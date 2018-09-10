# meteocool

[meteocool](https://unimplemented.org/meteocool/) is a free GIS
visualisation & aggregation platform with focus on thunderstorms.
Optimized for mobile devices, you can use it to both chase or
avoid upcoming weather - that's up to you.

![An exemplary cloud formation with high reflectivity (aka thunderstorm)](/frontend/assets/IMG_3076.jpg?raw=true "An exemplary cloud formation with high reflectivity")

meteocool currently uses radar data provided by DWD and realtime lightning
information from the awesome blitzortung.org project.

## Features

* **Automatic Map Updates:** the biggest inconvenience with most weather radar
  visualisations is out-of-date data. Meteocool notifies its clients as
  soon as new radar data becomes available and the client tries
  to be transparent about the dataset age. Say goodbye to hammering F5!
* **Live Lightning Strikes:** new lightning strikes are displayed instantly,
  giving you an even better feeling for the cloud formation's intensity,
  trajectory and speed.
* **Dark Mode:** great for HUD-like displays and general night time usage.
* **Progressive Web App:** responsive, connectivity independent and app-like.
  Add a shortcut to your iOS or Android Home Screen to use meteocool in
  "app mode".

# Development

![UML Component Diagram](/doc/meteocool_component.png?raw=true "Component diagram")

Use docker-compose (see below) for the backend. Run ```make dev``` to start the
development configuration.

* Deploy to production: ```make prod```
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

For development, use ```yarn && yarn start``` inside the
```frontend/``` directory. This will compile the index.js application
and start a development webserver on localhost.

## Install

### docker-compose

the way to go. 2018.

install `docker-compose` and use `make dev`.

Release builds can be built using `make prod` or manually:

* `docker-compose build`
* `docker-compose up` (debug)
* `docker-compose up -d` (background)
