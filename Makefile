.PHONY: all

all:
	mkdir -p tmp/
	wget https://opendata.dwd.de/weather/radar/composit/wx/raa01-wx_10000-latest-dwd---bin -O tmp/raa01-wx_10000-latest-dwd---bin
	python3 dwd2geojson.py tmp/raa01-wx_10000-latest-dwd---bin reflectivity.geojson
