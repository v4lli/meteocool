# meteocool

[meteocool](https://meteocool.com/) is a free GIS
visualisation & aggregation platform with focus on thunderstorms.
Optimized for mobile devices, you can use it to both chase or
avoid upcoming weather - that's up to you.

![An exemplary cloud formation with high reflectivity (aka thunderstorm)](/doc/pano-thunderstorm.jpg?raw=true "An exemplary cloud formation with high reflectivity")

meteocool currently uses radar data provided by DWD and realtime lightning
information from the awesome blitzortung.org project.

 <a href="https://itunes.apple.com/de/app/meteocool-rain-radar/id1438364623"><img src="https://raw.githubusercontent.com/v4lli/meteocool/master/frontend/assets/download-on-appstore.png" style="width: 49%; float: left;" alt="Download on Apple Appstore"></a>
<a href="https://play.google.com/store/apps/details?id=com.meteocool"><img src="https://user-images.githubusercontent.com/1577223/57536457-84883480-7344-11e9-899d-c31ac124917c.png" style="width: 49%" alt="Download on Google Play Store"></a>
 </tr>
</table>

## Features

<img src="/doc/ios-lockscreen.png?raw=true" alt="iOS Notifications" width="50%" align="right">

* **Automatic Map Updates:** the biggest inconvenience with most weather radar
  visualisations is out-of-date data. Meteocool notifies its clients as
  soon as new radar data becomes available and the client tries
  to be transparent about the dataset age. Say goodbye to hammering F5!
* **Live Lightning Strikes:** new lightning strikes are displayed instantly,
  giving you an even better feeling for the cloud formation's intensity,
  trajectory and speed.
* **Push Notifications:** get notified about incoming rain up to 60 minutes
  in advance. Works in any modern browser and on iOS.
* **Dark Mode:** great for HUD-like displays and general night time usage.
* **Progressive Web App:** responsive, connectivity independent and app-like.
  Add a shortcut to your iOS or Android Home Screen to use meteocool in
  "app mode".
* **iOS & Android Apps:** native iOS and Android apps provide battery-efficient
  background location services to allow for accurate rain notifications without
  user interaction.

<img width="100%" alt="Screenshot 2019-05-11 13 33 19" src="https://user-images.githubusercontent.com/1577223/57573080-444bb380-7423-11e9-935d-2a990f5026f6.png">

# Development

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
* When the color mapping for dbZ-values (pixels) is changed, the legend
  needs to be regenerated. Because this happens very rarely, the script
  for that isn't dockerized. Use ```make legend``` inside ```backend/dwd/```
  to regenerate the legend PNG.
* The database is initialized when the first entry is generated. Sadly this
  causes the push backend to hang until backend/app provides a first entry.
  As a work around, create a notification request via the web UI after the
  first startup. The databse is persistently kept on a docker volume.

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

install `docker-compose` and use `make dev`. For development purposes, use the docker-compose-dev.yml file.

Release builds can be built using `make prod` or manually:

* `docker-compose build`
* `docker-compose up` (debug)
* `docker-compose up -d` (background)
