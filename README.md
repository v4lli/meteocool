# meteocool

[meteocool](https://meteocool.unimplemented.org/) is a free GIS
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

Use docker-compose (see below) for the backend. Run ```make dev```
to run the development build (the first one might take a while).

Use ```make dev devrestart``` to build and also start all containers on
your local system. After that, go to https://127.0.0.1:8040 to access
your development system.

* Production build: ```make prod```
* Use feature branches!
* docker-compose MUST be executed in the root-directory of the repository!
  Otherwise bind mounts for config files will not work and no error
  will be reported.
* Using localhost instead of 127.0.0.1 will lead to problems (see #76).
* When the color mapping for dbZ-values (pixels) is changed, the legend
  needs to be regenerated. Because this happens very rarely, the script
  for that isn't dockerized. Use ```make legend``` inside ```backend/dwd/```
  to regenerate the legend PNG.

## Backend

Makefile targets in ```backend/dwd/```:

 - ```make mbtiles```: create PNG + tiles in tmp/
 - ```make update```: fetch current radar date from DWD
 - ```make update mbtiles```: both operations together

## Frontend

For frontend development, use ```yarn && yarn start``` inside the
```frontend/``` directory. This will compile the src/index.js application
and start a development webserver on localhost. Note that for a complete
local development setup you also need the other containers.

## Install

### docker-compose

the way to go. 2018.

install `docker-compose` and use `make dev`. For development purposes, use the docker-compose-dev.yml file.

Release builds can be built using `make prod` or manually:

* `docker-compose build`
* `docker-compose up` (debug)
* `docker-compose up -d` (background)
