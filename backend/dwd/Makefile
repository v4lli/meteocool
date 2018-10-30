.PHONY: all

OUT := tmp

mbtiles:
	rm -f /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles
	# transforms binary runlength format to a 1100x900 px bitmap
	time python3 dwd2png.py tmp/raa01-wx_10000-latest-dwd---bin \
		tmp/raa01-wx_10000-latest-dwd.png
	# the worldfile defines where and how big the bitmap map in the target srs
	cp worldfile tmp/raa01-wx_10000-latest-dwd.wld
	# set the source srs http://docs.wradlib.org/en/latest/notebooks/radolan/radolan_grid.html
	gdal_translate -a_srs "+proj=stere +lat_0=90 +lat_ts=90 +lon_0=10 +k=0.93301270189 +x_0=0 +y_0=0 +a=6370040 +b=6370040 +to_meter=1000 +no_defs" \
		tmp/raa01-wx_10000-latest-dwd.png tmp/raa01-wx_10000-latest-dwd-srs.png
	# set the target srs to EPSG:3857 (standard web mercator)
	gdalwarp -overwrite -of gtiff -t_srs EPSG:3857 \
		tmp/raa01-wx_10000-latest-dwd-srs.png tmp/raa01-wx_10000-latest-dwd-final.tif
	# convert to mbtiles
	/usr/local/bin/gdal2mbtiles --version "$$(date +%s)" --min-resolution=7 \
		--max-resolution=10 tmp/raa01-wx_10000-latest-dwd-final.tif \
		/tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles
	mv -f /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles \
		$(OUT)/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles

tag: update
	mkdir -p ~/meteocool_tags/
	wget --no-verbose \
		https://opendata.dwd.de/weather/radar/composit/wx/raa01-wx_10000-latest-dwd---bin \
		-O ~/meteocool_tags/dwd-wx-composit-$$(date +%s).bin
	ls -l ~/meteocool_tags/

all: mbtiles

api: cron push

cron: mbtiles
	# First signal the tileserver
	nc -z tileserver 10001 || true
	sleep 3
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
	@# download forecast
	rm -rf tmp/forecast*
	mkdir tmp/forecast
	wget --no-verbose \
		https://opendata.dwd.de/weather/radar/composit/fx/FX_LATEST.tar.bz2 \
		-O tmp/forecast.tar.bz2
	tar -C tmp/forecast -xjf tmp/forecast.tar.bz2
	python3 push.py tmp/forecast/ \
		http://app:5000/internal/trigger_browser_notification || true


update:
	mkdir -p tmp/
	rm -f tmp/raa01-wx_10000-latest-dwd---bin
	wget --no-verbose \
		https://opendata.dwd.de/weather/radar/composit/wx/raa01-wx_10000-latest-dwd---bin \
		-O tmp/raa01-wx_10000-latest-dwd---bin

clean:
	rm -rf tmp/

legend:
	# XXX this should be run inside a container
	python3 color_legend.py ../../frontend/assets/legend_big.png
