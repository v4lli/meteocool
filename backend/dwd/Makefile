.PHONY: all

GDALTOMBTILES := /usr/local/bin/gdal2mbtiles
OUT := tmp

mbtiles:
	# transforms binary runlength format to a 1100x900 px bitmap
	time python3 dwd2geojson.py tmp/raa01-wx_10000-latest-dwd---bin tmp/raa01-wx_10000-latest-dwd.png
	# the worldfile defines where and how big the bitmap map in the target srs
	cp worldfile tmp/raa01-wx_10000-latest-dwd.wld
	gdal_translate -a_srs "+proj=stere +lat_0=90 +lat_ts=90 +lon_0=10 +k=0.93301270189 +x_0=0 +y_0=0 +a=6370040 +b=6370040 +to_meter=1000 +no_defs" tmp/raa01-wx_10000-latest-dwd.png tmp/raa01-wx_10000-latest-dwd-srs.png
	gdalwarp -overwrite -of gtiff -t_srs EPSG:3857 tmp/raa01-wx_10000-latest-dwd-srs.png tmp/raa01-wx_10000-latest-dwd-final.tif
	# set the target srs to EPSG:3857 (standard web mercator)
	#gdal_translate -a_srs EPSG:3857 tmp/raa01-wx_10000-latest-dwd.png tmp/raa01-wx_10000-latest-dwd-3857.png
	#cd tmp && time gdalwarp -overwrite -of GTiff -s_srs "+proj=stere +lon_0=10.0 +lat_0=90.0 +lat_ts=60.0 +a=6370040 +b=6370040 +units=m" -t_srs "EPSG:3857" -te_srs "+proj=stere +lon_0=10.0 +lat_0=90.0 +lat_ts=60.0 +a=6370040 +b=6370040 +units=m"  -te 207716.2755078182 5827593.4587101545 1795826.6626303399 7415703.845832676 -r near raa01-wx_10000-latest-dwd.png raa01-wx_10000-latest-dwd-srs.tif
	#gdal_translate -of GTiff -a_srs EPSG:3857 -A_ullr 6183597.34 344021.46 1723236.85 5809675.52 tmp/raa01-wx_10000-latest-dwd-3857-srs-clean.png tmp/raa01-wx_10000-latest-dwd-3857-clean.bmp
	# time gdal_translate -of GTiff -a_srs '+proj=stere +ellps=WGS84 +datum=WGS84 +lat_0=90 +lat_ts=90 +lon_0=10 +k=0.93301270189 +x_0=0 +y_0=0 +a=6370040 +b=6370040 +to_meter=1000 +no_defs' -A_ullr 3.0889 55.5482 15.4801 46.1827 tmp/raa01-wx_10000-latest-dwd.png tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.png
	#env MINZOOM=0 MAXZOOM=20 gdal_polygonize.py -f mvt tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.png tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mvt
	time $(GDALTOMBTILES) --version "$$(date +%s)" --min-resolution=7 --max-resolution=7 tmp/raa01-wx_10000-latest-dwd-final.tif /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles
	mv -f /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles $(OUT)/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles

debug:
	time python3 dwd2geojson.py tmp/raa01-wx_10000-latest-dwd---bin tmp/raa01-wx_10000-latest-dwd.png

tag: update
	mkdir -p ~/meteopool_tags/
	wget https://opendata.dwd.de/weather/radar/composit/wx/raa01-wx_10000-latest-dwd---bin -O ~/meteopool_tags/dwd-wx-composit-$$(date +%s).bin
	ls -l ~/meteopool_tags/

all: mbtiles

api: mbtiles
	# First signal the tileserver
	nc -z tileserver 10001
	sleep 3
	# Then download the new tilejson (will be broadcasted to all clients)
	wget -q https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json -O /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.json
	# Then broadcast it
	# XXX remove token from logging... @ might not work when the command fails
	@curl -s -X POST -d @/tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.json \
	  http://app:5000/internal/publish_new_tileset?token=${MC_TOKEN} \
	  -H 'Cache-Control: no-cache' \
	  -H 'Content-Type: application/json'
	rm -f /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.json

update:
	mkdir -p tmp/
	rm -f tmp/raa01-wx_10000-latest-dwd---bin
	wget -q https://opendata.dwd.de/weather/radar/composit/wx/raa01-wx_10000-latest-dwd---bin -O tmp/raa01-wx_10000-latest-dwd---bin

clean:
	rm -rf tmp/
