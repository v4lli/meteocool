FROM ubuntu:latest

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev libvips python3 python3-dev python3-pip python3-gdal wget python3-tk python3-gdal
WORKDIR /usr/src/app
ADD . /usr/src/app
RUN pip3 install -r requirements.txt
RUN mkdir temp
CMD make update mbtiles

