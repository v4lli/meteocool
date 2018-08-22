# meteocool

![Logo](frontend/assets/android-chrome-192x192.png?raw=true "Meteocool logo")

![UML Component Diagram](/doc/meteocool_component.png?raw=true "Component diagram")

# Development

Use docker-compose (see below) for the backend. Run ```npm start``` inside ```frontend\``` to start developing on the frontend. When using
docker-compose, note the following:

* remove all 'logging' substructures from docker-compose.yml in order to use the default docker logging facility

## Backend

Makefile targets in ```backend/```:

 - ```make mbtiles```: PNG + tiles erstellen in tmp/
 - ```make update```: aktuelle Wettermap vom DWD holen nach tmp/
 - ```make update mbtiles```: beides zusammen

## Frontend

All changes in ```frontend/``` are automatically deployed on https://unimplemented.org/meteocool/ as soon as they are pushed into the master
branch (See ```infra/deploy_server.py``` for the webhook server).

For development, use ```npm start``` inside the ```frontend/``` directory. This will compile the index.js application and start a development
webserver on localhost.

XXX wenn man npm start verwendet sollte in der app automatisch localhost fuer websockets verwendet werden. wenn der build ueber parcel
passiert sollte die produktive url genommen werden.

## Install

# docker-compose

the way to go. 2018.

install `docker-compose` and do this:

* `docker-compose build`
* `docker-compose up` (debug)
* `docker-compose up -d` (background)


# Manual docker setup

DON'T USE; USE DOCKER-COMPOSE INSTEAD!

Initially, create the dwd volume, which is used to transfer date between the tileserver container and the backend container, then launch the
upstream tileserver:

```
docker volume create dwd
docker run -d --name meteocool-tile -v dwd:/data -p 8080:80 klokantech/tileserver-gl
```

Then (and after every change) re-build the backend docker container:

```
cd backend/
docker build -t meteocool .
docker run -it --rm -v dwd:/usr/src/app/tmp meteocool && docker exec -it meteocool-tile /bin/sh -c 'kill -HUP $(pidof node)'
```

The last line rebuilds the mbtiles file and signals the tileserver to reload the tiledatabase. This will be replaced soon by a backend
process which will handle notifying websocket clients.
