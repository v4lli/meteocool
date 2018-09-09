import "./main.css";
import "ol/ol.css";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import CircleStyle from "ol/style/Circle";
import OSM from "ol/source/OSM";
import Point from "ol/geom/Point";
import TileJSON from "ol/source/TileJSON.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {Map, View, Geolocation, Feature} from "ol";
import {defaults as defaultControls, OverviewMap} from "ol/control.js";
import Control from "ol/control/Control";
import {Fill, Stroke, Style, Text, Icon, RegularShape} from "ol/style";
import {fromLonLat} from "ol/proj.js";

import {Cluster} from 'ol/source.js';


import io from "socket.io-client";

// ===================
// Environment & Setup
// ===================

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(reg => {
      console.log("SW registered: ", reg);

      // Update service worker on page refresh
      // https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68
      function listenForWaitingServiceWorker (reg, callback) {
        function awaitStateChange () {
          reg.installing.addEventListener("statechange", function () {
            if (this.state === "installed") callback(reg);
          });
        }
        if (!reg) return;
        if (reg.waiting) return callback(reg);
        if (reg.installing) awaitStateChange();
        reg.addEventListener("updatefound", awaitStateChange);
      }

      // Reload once when the new Service Worker starts activating
      var refreshing;
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        console.log("Reloading page for latest content");
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
      function promptUserToRefresh (reg) {
        // Immediately load service worker
        reg.waiting.postMessage("skipWaiting");
        // if (window.confirm("New version available! OK to refresh?")) {
        //  reg.waiting.postMessage('skipWaiting');
        // }
      }
      listenForWaitingServiceWorker(reg, promptUserToRefresh);
    }).catch(registrationError => {
      console.log("SW registration failed: ", registrationError);
    });
  });
}

//
// poor man's resizer for fullscreen map
//
let browserHeight;
let navEl;
let mapEl;
var dimensions = () => {
  browserHeight = window.innerHeight;
  navEl = document.getElementById("navbar").clientHeight;
  mapEl = document.getElementById("map");
};
dimensions();
mapEl.style.height = browserHeight - navEl + "px";

window.addEventListener("resize", () => {
  dimensions();
  mapEl.style.height = browserHeight - navEl + "px";
});


//
// Detect PWA on iOS for iPhone X UI optimization
// Copied from stackoverflow:
// https://stackoverflow.com/questions/50543163/can-i-detect-if-my-pwa-is-launched-as-an-app-or-visited-as-a-website
//
const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test( userAgent );
}
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

if (isIos() && isInStandaloneMode()) {
  document.getElementById("clockbg").style.display = "block";
  document.getElementById("spacer").style.display = "block";
}

// ================
// OpenLayers setup
// ================

// configuration/defaults
var zoom = 6;
var center = fromLonLat([10.447683, 51.163375]);
// var rotation = 0;

if (window.location.hash !== "") {
  // try to restore center, zoom-level and rotation from the URL
  var hash = window.location.hash.replace("#map=", "");
  var parts = hash.split("/");
  if (parts.length === 4) {
    zoom = parseInt(parts[0], 10);
    center = [
      parseFloat(parts[1]),
      parseFloat(parts[2])
    ];
    // rotation = parseFloat(parts[3]);
  }
}

//
// DARK MODE
//

var toggleButton = document.getElementById("toggleMode");
var navbar = document.getElementById("navbar");

var lightTiles; // 'undefined' will use the OSM class' default - OSM doesn't offer pbf (vector) tiles (?)
var darkTiles = "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.pbf";

// light view is default
var viewMode = true;

var toggleHTMLfixMe = () => {
  toggleButton.innerHTML = viewMode ? "dark mode" : "light mode";
  if (navbar.classList.contains("navbar-light")) {
    navbar.classList.remove("navbar-light", "bg-light");
    navbar.classList.add("navbar-dark", "bg-dark", "text-white");
  } else {
    navbar.classList.remove("navbar-dark", "bg-dark", "text-white");
    navbar.classList.add("navbar-light", "bg-light");
  }
};

if (localStorage.getItem("darkMode")) {
  viewMode = false;
  toggleHTMLfixMe();
}

var view = new View({
  center: center,
  zoom: zoom,
  minzoom: 5
});

var map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM({
        url: viewMode ? lightTiles : darkTiles
      })
    })
  ],
  controls: defaultControls().extend([
    new OverviewMap()
  ]),
  view: view
});

var toggleViewMode = () => {
  viewMode ? localStorage.setItem("darkMode", viewMode) : localStorage.removeItem("darkMode");
  viewMode = !viewMode;
  var newLayer = new TileLayer({
    source: new OSM({
      url: viewMode ? lightTiles : darkTiles
    })
  });
  map.getLayers().setAt(0, newLayer);
};

toggleButton.onclick = () => {
  toggleViewMode();
  toggleHTMLfixMe();
};

//
// Geolocation (showing the user's position)
//

var geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true
  },
  projection: view.getProjection()
});

if (!window.location.hash) {
  geolocation.setTracking(true);
}

// handle geolocation error.
geolocation.on("error", function (error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      console.log("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      console.log("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      console.log("The request to get user location timed out.");
      break;
    default:
      console.log("could not get location data, doing nothing like it's 1990");
      break;
  }
});

var accuracyFeature = new Feature();
geolocation.on("change:accuracyGeometry", function () {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  // stop annoying the user after a short time
  // setTimeout(function() {geolocation.on('change:accuracyGeometry', null);}, 1500);
});

var shouldUpdate = true;
var updatePermalink = function () {
  if (!shouldUpdate) {
    // do not update the URL when the view was changed in the 'popstate' handler
    shouldUpdate = true;
    return;
  }

  var center = view.getCenter();
  var hash = "#map=" +
      view.getZoom() + "/" +
      Math.round(center[0] * 100) / 100 + "/" +
      Math.round(center[1] * 100) / 100 + "/" +
      view.getRotation();
  var state = {
    zoom: view.getZoom(),
    center: view.getCenter(),
    rotation: view.getRotation()
  };
  window.history.pushState(state, "map", hash);
};

map.on("moveend", updatePermalink);

// restore the view state when navigating through the history, see
// https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
window.addEventListener("popstate", function (event) {
  if (event.state === null) {
    return;
  }
  map.getView().setCenter(event.state.center);
  map.getView().setZoom(event.state.zoom);
  map.getView().setRotation(event.state.rotation);
  shouldUpdate = false;
});

var positionFeature = new Feature();
positionFeature.setStyle(new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: "#3399CC"
    }),
    stroke: new Stroke({
      color: "#fff",
      width: 2
    })
  })
}));

/* eslint-disable */
/*
 * Need to disable this stylechecker warning because the VectorLayer constructor
 * us only used for its sideeffects, which isn't nice.
 */
new VectorLayer({
  source: new VectorSource({features: [accuracyFeature, positionFeature]}),
  map: map
});
/* eslint-enable */

var vs = new VectorSource({
  features: []
});

var clusters = new Cluster({
  distance: 3,
  map: map,
  source: vs
});

var styleCache = {};
      var vl = new VectorLayer({
        source: clusters,
        map: map,
        style: function(feature) {
          var size = feature.get('features').length;
          var style = styleCache[size];
          if (!style) {
            var textsize;
            if (size > 10) {
              textsize = 38;
            } else if (size > 3) {
              textsize = 33;
            } else if (size > 1) {
              textsize = 28;
            }
            style = new Style({
              text: new Text({
                text: "⚡️",
                font: textsize + 'px Calibri,sans-serif'
              })
            });
            styleCache[size] = style;
          }
          return style;
        }
      });


var haveZoomed = false;
geolocation.on("change:position", function () {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  if (window.location.hash !== "" && !haveZoomed) {
    map.getView().animate({center: coordinates, zoom: 10});
    haveZoomed = true;
  }
});

//
// actually display reflectivity radar data
//

var tileUrl = "http://localhost:8070/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
var websocketUrl = "http://localhost:8071/tile";
if (process.env.NODE_ENV === "production") {
  tileUrl = "https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
  websocketUrl = "https://unimplemented.org/tile";
}

var reflectivityOpacity = 0.5;

var currentLayer = new TileLayer({
  source: new TileJSON({
    url: tileUrl,
    crossOrigin: "anonymous"
  }),
  opacity: reflectivityOpacity
});
map.addLayer(currentLayer);
// we can now later call removeLayer(currentLayer), then update it with the new
// tilesource and then call addLayer again.
const socket = io.connect(websocketUrl);

socket.on("connect", () => console.log("websocket connected"));

class StrikeManager {
  constructor(maxStrikes) {
    this.maxStrikes = maxStrikes;
		this.strikes = []
  }

  addStrike(lon, lat) {
     var lightning = new Feature(new Point([lon, lat]));
		 lightning.setId(new Date().getTime());
		 this.strikes.push(lightning.getId());
		 if(this.strikes.length > this.maxStrikes) {
				var toRemove = this.strikes.shift();
				console.log("had to remove");
				console.log(toRemove);
		   vs.removeFeature(vs.getFeatureById(toRemove));
		 }
     vs.addFeature(lightning);
	}
};
let strikemgr = new StrikeManager(1337);

socket.on("lightning", function (data) {
     strikemgr.addStrike(data["lon"], data["lat"]);
});

socket.on("map_update", function (data) {
  console.log(data);

  var lastUpdated = new Date();
  document.getElementById("updatedTime").innerHTML = "Last update: " + ("0" + lastUpdated.getHours()).slice(-2) + ":" + ("0" + lastUpdated.getMinutes()).slice(-2);

  var newLayer = new TileLayer({
    source: new TileJSON({
      tileJSON: data,
      crossOrigin: "anonymous"
    }),
    opacity: reflectivityOpacity
  });
  // first add & fetch the new layer, then remove the old one to avoid
  // having no layer at all at some point.
  map.addLayer(newLayer);
  map.removeLayer(currentLayer);
  currentLayer = newLayer;
});

// locate me button
var button = document.createElement("button");
button.classList.add("locate-me-btn");
button.innerHTML = "<img src=\"./baseline_location_searching_white_48dp.png\">";
var locateMe = function (e) {
  var coordinates = geolocation.getPosition();
  geolocation.setTracking(true);
  map.getView().animate({center: coordinates, zoom: 10});
};
button.addEventListener("click", locateMe, false);
var element = document.createElement("div");
element.className = "locate-me ol-unselectable ol-control";
element.appendChild(button);
var locateControl = new Control({
  element: element
});
map.addControl(locateControl);

// quickfix for "last updated: never" XXX
// will be replaced soon by counter
var lastUpdated = new Date();
document.getElementById("updatedTime").innerHTML = "Last update: " + ("0" + lastUpdated.getHours()).slice(-2) + ":" + ("0" + lastUpdated.getMinutes()).slice(-2);

/* vim: set ts=2 sw=2 expandtab: */
