FC_FILE ?= unknown
ifeq ($(FC_FILE),unknown)
  $(error FC_FILE NOT SET)
endif

# XXX deduplicate with main makefile.
$(FC_FILE).mbtiles: $(FC_FILE)
	time python3 ../dwd2png.py $(FC_FILE) $(FC_FILE).png
	# the worldfile defines where and how big the bitmap map in the target srs
	cp worldfile_forecast $(FC_FILE).wld
	# set the source srs http://docs.wradlib.org/en/latest/notebooks/radolan/radolan_grid.html
	gdal_translate -a_srs "+proj=stere +lat_0=90 +lat_ts=90 +lon_0=10 +k=0.93301270189 +x_0=0 +y_0=0 +a=6370040 +b=6370040 +to_meter=1000 +no_defs" \
	        $(FC_FILE).png $(FC_FILE)-srs.png
	# set the target srs to EPSG:3857 (standard web mercator)
	gdalwarp -overwrite -of gtiff -t_srs EPSG:3857 \
	        $(FC_FILE)-srs.png $(FC_FILE)-final.tif
	/usr/local/bin/gdal2mbtiles --version "$$(date +%s)" --min-resolution=6 \
	        --max-resolution=9 $(FC_FILE)-final.tif \
	        $(FC_FILE)-final.mbtiles
