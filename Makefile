.PHONY: all

all:
	python3 backend/dwd2geojson.py tmp/raa01-wx_10000-latest-dwd---bin tmp/raa01-wx_10000-latest-dwd.png
	gdal_translate -of GTiff -a_srs '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs' -A_ullr 3.0889 55.5482 15.4801 46.1827 tmp/raa01-wx_10000-latest-dwd.png tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.png
	gdal_polygonize.py -f mvt tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.png tmp/raa01-wx_10000-latest-dwd-wgs84_transformed.mvt

update:
	mkdir -p tmp/
	wget https://opendata.dwd.de/weather/radar/composit/wx/raa01-wx_10000-latest-dwd---bin -O tmp/raa01-wx_10000-latest-dwd---bin
