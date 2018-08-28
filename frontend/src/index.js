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
import io from "socket.io-client";
import {Map, View, Geolocation, Feature} from "ol";
import {defaults as defaultControls, OverviewMap} from "ol/control.js";
import Control from "ol/control/Control";
import {Style, Fill, Stroke} from "ol/style";
import {fromLonLat} from "ol/proj.js";

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

// mo
var defaultOsmMapView = true;
var toggleMode = document.getElementById("toggleMode");
toggleMode.onclick = () => {
  var newLayer = new TileLayer({
    source: new OSM({
      url: defaultOsmMapView ? "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" : "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    })
  });
  map.getLayers().setAt(0, newLayer);
  defaultOsmMapView = !defaultOsmMapView;
  toggleMode.innerHTML = defaultOsmMapView ? "dark mode" : "light mode";
};

// poor man's resizer
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

// default zoom, center and rotation
var zoom = 6;
var center = fromLonLat([10.447683, 51.163375]);
var rotation = 0;

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
    rotation = parseFloat(parts[3]);
  }
}

var view = new View({
  center: center,
  zoom: zoom,
  minzoom: 5
});

const map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  controls: defaultControls().extend([
    new OverviewMap()
  ]),
  view: view
});

var shouldUpdate = true;
var view = map.getView();
var updatePermalink = function() {
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
window.addEventListener("popstate", function(event) {
  if (event.state === null) {
    return;
  }
  map.getView().setCenter(event.state.center);
  map.getView().setZoom(event.state.zoom);
  map.getView().setRotation(event.state.rotation);
  shouldUpdate = false;
});


var geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true
  },
  projection: view.getProjection()
});

geolocation.setTracking(true);

// handle geolocation error.
geolocation.on("error", function (error) {
  console.log("could not get location data, doing nothing like it's 1990");
});

var accuracyFeature = new Feature();
geolocation.on("change:accuracyGeometry", function () {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  // stop annoying the user after a short time
  // setTimeout(function() {geolocation.on('change:accuracyGeometry', null);}, 1500);
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

var haveZoomed = false;
geolocation.on("change:position", function () {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  if (window.location.hash !== "" && !haveZoomed) {
    map.getView().animate({center: coordinates, zoom: 10});
    haveZoomed = true;
  }
});

new VectorLayer({
  map: map,
  source: new VectorSource({
    features: [accuracyFeature, positionFeature]
  })
});

if (process.env.NODE_ENV === "production") {
  var tileUrl = "https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
  var websocketUrl = "https://unimplemented.org/tile";
} else {
  var tileUrl = "http://localhost:8070/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
  var websocketUrl = "http://localhost:8071/tile";
}

var reflectivityOpacity = 0.75;

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
socket.on("map_update", function (data) {
  console.log(data);

  var lastUpdated = new Date();
  document.getElementById("updatedTime").innerHTML = "Last update: " + lastUpdated.getHours() + ":" + lastUpdated.getMinutes();

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

// Detects if device is on iOS
const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test( userAgent );
};
// Detects if device is in standalone mode
const isInStandaloneMode = () => ("standalone" in window.navigator) && (window.navigator.standalone);

// Checks if should display install popup notification:
if (isIos() && isInStandaloneMode()) {
  document.getElementById("clockbg").style.display = "block";
  document.getElementById("spacer").style.display = "block";
}
