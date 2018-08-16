.PHONY: all

GDALTOMBTILES := gdal2mbtiles
OUT := tmp

mbtiles:
	python3 dwd2geojson.py tmp/raa01-wx_10000-latest-dwd---bin tmp/raa01-wx_10000-latest-dwd.png
	gdal_translate -of GTiff -a_srs '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs' -A_ullr 3.0889 55.5482 15.4801 46.1827 tmp/raa01-wx_10000-latest-dwd.png tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.png
	#env MINZOOM=0 MAXZOOM=20 gdal_polygonize.py -f mvt tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.png tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mvt
	$(GDALTOMBTILES) tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.png $(OUT)/raa01-wx_10000-latest-dwd-wgs84_transformed.mbtiles

all: mbtiles

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
