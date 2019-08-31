.PHONY: all

OUT := tmp

mbtiles:
	rm -f /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles
	mkdir -p /scratch/tmp
	# transforms binary runlength format to a 1100x900 px bitmap
	time python3 dwd2png.py /scratch/raa01-wx_10000-latest-dwd---bin \
		/scratch/raa01-wx_10000-latest-dwd.png
	# the worldfile defines where and how big the bitmap map in the target srs
	cp worldfile /scratch/raa01-wx_10000-latest-dwd.wld
	# set the source srs http://docs.wradlib.org/en/latest/notebooks/radolan/radolan_grid.html
	gdal_translate -a_srs "+proj=stere +lat_0=90 +lat_ts=90 +lon_0=10 +k=0.93301270189 +x_0=0 +y_0=0 +a=6370040 +b=6370040 +to_meter=1000 +no_defs" \
		/scratch/raa01-wx_10000-latest-dwd.png /scratch/raa01-wx_10000-latest-dwd-srs.png
	# set the target srs to EPSG:3857 (standard web mercator)
	gdalwarp -overwrite -of gtiff -t_srs EPSG:3857 \
		/scratch/raa01-wx_10000-latest-dwd-srs.png /scratch/raa01-wx_10000-latest-dwd-final.tif
	# process forecasts concurrently
	nice -n 15 make -C . push &
	# convert to mbtiles
	/usr/local/bin/gdal2mbtiles --version "$$(stat --printf '%Y' /scratch/raa01-wx_10000-latest-dwd---bin)" --min-resolution=6 \
		--max-resolution=10 /scratch/raa01-wx_10000-latest-dwd-final.tif \
		/scratch/tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles
	mv -f /scratch/tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles \
		$(OUT)/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles
	rm -r /scratch/*

tag: update
	mkdir -p ~/meteocool_tags/
	wget --no-verbose -NS \
		https://opendata.dwd.de/weather/radar/composit/wx/raa01-wx_10000-latest-dwd---bin \
		-O ~/meteocool_tags/dwd-wx-composit-$$(date +%s).bin
	ls -l ~/meteocool_tags/

all: mbtiles

api: cron

cron: mbtiles
	# First signal the tileserver
	nc -z tileserver 10001 || true
	# XXX need to sync the nc call above to the async push target... m(
	sleep 2
	# Then download the new tilejson (will be broadcasted to all clients)
	# XXX replace with internal hostname!
	wget --no-verbose \
		https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json \
		-O /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.json || true
	@# Then broadcast it
	curl -s -X POST -d @/tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.json \
	  http://app:5000/internal/publish_new_tileset \
	  -H 'Cache-Control: no-cache' \
	  -H 'Content-Type: application/json' || true
	rm -f /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.json

push:
	sleep 1
	@# download forecast
	rm -rf /forecast/tmp/forecast*
	mkdir -p /forecast/tmp/forecast
	wget --no-verbose \
		https://opendata.dwd.de/weather/radar/composit/fx/FX_LATEST.tar.bz2 \
		-O /forecast/tmp/forecast.tar.bz2
	if ! [ -z "${RECORDING}" ]; then \
		cp -f /forecast/tmp/forecast.tar.bz2 /recording/FX_LATEST_$$(date "+%F-%T").tbz2 ; \
	fi
	tar -C /forecast/tmp/forecast -xjf /forecast/tmp/forecast.tar.bz2
	bash -c 'for f in /forecast/tmp/forecast/FX*_0{05,10,15,20,25,30,35,40,45}_*; do nice -n 1 make -C fc_preview/ FC_FILE=$$f & done; wait'
	mv /forecast/tmp/forecast/FX*_005_*.mbtiles /data/FX_005-latest.mbtiles
	mv /forecast/tmp/forecast/FX*_010_*.mbtiles /data/FX_010-latest.mbtiles
	mv /forecast/tmp/forecast/FX*_015_*.mbtiles /data/FX_015-latest.mbtiles
	mv /forecast/tmp/forecast/FX*_020_*.mbtiles /data/FX_020-latest.mbtiles
	mv /forecast/tmp/forecast/FX*_025_*.mbtiles /data/FX_025-latest.mbtiles
	mv /forecast/tmp/forecast/FX*_030_*.mbtiles /data/FX_030-latest.mbtiles
	mv /forecast/tmp/forecast/FX*_035_*.mbtiles /data/FX_035-latest.mbtiles
	mv /forecast/tmp/forecast/FX*_040_*.mbtiles /data/FX_040-latest.mbtiles
	mv /forecast/tmp/forecast/FX*_045_*.mbtiles /data/FX_045-latest.mbtiles
	nc -z tileserver 10001 || true
	sleep 2
	python3 push.py /forecast/tmp/forecast/
	rm -rf /forecast/tmp/forecast*


update:
	mkdir -p tmp/
	rm -f tmp/raa01-wx_10000-latest-dwd---bin
	cd /scratch/ && wget --no-verbose -SN \
		http://opendata.dwd.de/weather/radar/composit/wx/raa01-wx_10000-latest-dwd---bin && \
		md5s="$$(md5sum /scratch/raa01-wx_10000-latest-dwd---bin)" ; \
		if ! [ "$$md5s" = "$$(cat /tmp/raa01-wx_10000-latest-dwd---bin.md5)" ]; then \
			echo "$$md5s" > /tmp/raa01-wx_10000-latest-dwd---bin.md5 ; \
			if ! [ -z "${RECORDING}" ]; then \
				cp -f raa01-wx_10000-latest-dwd---bin /recording/raa01-wx_10000-latest-dwd---bin-$$(date "+%F-%T") ; \
			fi ; \
			exit 0 ; \
		else \
			echo "No new data from dwd" ; \
			exit 1 ; \
		fi

clean:
	rm -rf tmp/

legend:
	# XXX this should be run inside a container
	python3 color_legend.py ../../frontend/assets/legend_big.png
