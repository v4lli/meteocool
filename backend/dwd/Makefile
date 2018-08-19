.PHONY: all

GDALTOMBTILES := /usr/local/bin/gdal2mbtiles
OUT := tmp

mbtiles:
	python3 dwd2geojson.py tmp/raa01-wx_10000-latest-dwd---bin tmp/raa01-wx_10000-latest-dwd.png
	gdal_translate -of GTiff -a_srs '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs' -A_ullr 3.0889 55.5482 15.4801 46.1827 tmp/raa01-wx_10000-latest-dwd.png tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.png
	#env MINZOOM=0 MAXZOOM=20 gdal_polygonize.py -f mvt tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.png tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mvt
	$(GDALTOMBTILES) tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.png $(OUT)/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles

all: mbtiles

api: mbtiles
	# First signal the tileserver
	nc -z tileserver 10001
	# Then download the new tilejson (will be broadcasted to all clients)
	wget https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json -O /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.json
	# Then broadcast it
	curl -X POST -d @/tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.json http://app:5000/internal/publish_new_tileset?token=loldude22changeMe \
	  -H 'Cache-Control: no-cache' \
	  -H 'Content-Type: application/json'
	rm -f /tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.json

update:
	mkdir -p tmp/
	wget https://opendata.dwd.de/weather/radar/composit/wx/raa01-wx_10000-latest-dwd---bin -O tmp/raa01-wx_10000-latest-dwd---bin

docker:
	docker build -t meteocool .
	@# docker volume create dwd
	@# docker run -d --name meteocool-tile -v dwd:/data -p 8080:5000 klokantech/tileserver-gl
	docker run -it --rm -v dwd:/usr/src/app/tmp meteocool && docker exec -it meteocool-tile /bin/sh -c 'kill -HUP $$(pidof node)'

clean:
	rm -rf tmp/
