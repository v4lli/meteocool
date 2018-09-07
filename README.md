# meteocool

[meteocool](https://unimplemented.org/meteocool/) is a free GIS
visualisation & aggregation platform with focus on thunderstorms.
Optimized for mobile devices, so you can use it to both chase or
avoid upcoming weather - that's up to you.

![An exemplary cloud formation with high reflectivity (aka thunderstorm)](/frontend/assets/IMG_3076.jpg?raw=true "An exemplary cloud formation with high reflectivity")

meteocool currently uses radar data provided by DWD and realtime lightning
information from the awesome blitzortung.org project.

# Development

![UML Component Diagram](/doc/meteocool_component.png?raw=true "Component diagram")

Use docker-compose (see below) for the backend. Run ```npm start``` inside
```frontend\``` to start developing on the frontend. When using docker-compose,
note the following:

* remove all 'logging' substructures from docker-compose.yml in order to use
  the default docker logging facility (```docker logs```/stdout)
* Deploy frontend to production:
  ```cd frontend/ && npm install && npm run-script build```
* Use feature branches!
* docker-compose MUST be executed in the root-directory of the repository!
  Otherwise bind mounts for config files will not work and no error
  will be reported (thanks, docker).

## Backend

Makefile targets in ```backend/dwd/```:

 - ```make mbtiles```: PNG + tiles erstellen in tmp/
 - ```make update```: aktuelle Wettermap vom DWD holen nach tmp/
 - ```make update mbtiles```: beides zusammen

## Frontend

All changes in ```frontend/``` are automatically deployed on
https://unimplemented.org/meteocool/ as soon as they are pushed
into the master branch (See ```infra/deploy_server.py``` for the
webhook server).

For development, use ```npm install && npm start``` inside the
```frontend/``` directory. This will compile the index.js application
and start a development webserver on localhost.

## Install

# docker-compose

the way to go. 2018.

install `docker-compose` and do this:

* `docker-compose build`
* `docker-compose up` (debug)
* `docker-compose up -d` (background)


# Manual docker setup

DON'T USE; USE DOCKER-COMPOSE INSTEAD!

Initially, create the dwd volume, which is used to transfer date
between the tileserver container and the backend container, then
launch the upstream tileserver:

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

The last line rebuilds the mbtiles file and signals the tileserver
to reload the tiledatabase. This will be replaced soon by a backend
process which will handle notifying websocket clients.
