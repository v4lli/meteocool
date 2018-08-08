# meteocool

Makefile targets:

 - ```make run```: PNG + tiles erstellen in /tmp
 - ```make download```: aktuelle Wettermap vom DWD holen nach /tmp


## Install

# Mac OS

```brew install gdal --HEAD && brew install hdf5 netcdf4```

# Linux

```apt-get install gdal-bin libgdal-dev npm libvips```

# Both

```cd frontend && npm install```

```pip3 install wradlib gdal geojson pillow gdal2mbtiles```
