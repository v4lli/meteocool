import "./main.css";
import "ol/ol.css";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import $ from "jquery";
import CircleStyle from "ol/style/Circle";
import Control from "ol/control/Control";
import OSM from "ol/source/OSM";
import Point from "ol/geom/Point";
import TileJSON from "ol/source/TileJSON.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import distanceInWordsToNow from "date-fns/distance_in_words_to_now";
import io from "socket.io-client";
import { Cluster } from "ol/source.js";
import { DeviceDetect } from "./modules/device-detect.js";
import { Fill, Stroke, Style, Text } from "ol/style";
import { Map, View, Geolocation, Feature } from "ol";
import { defaults as defaultControls, OverviewMap } from "ol/control.js";
import { fromLonLat, toLonLat } from "ol/proj.js";

import logoBig from "../assets/android-chrome-512x512.png";

const safeAreaInsets = require("safe-area-insets");

window.jQuery = $;
window.$ = $;

var lastUpdatedServer = false;
// the timer is started later by the callback which downloads the initial
// map.
function lastUpdatedFn () {
  var elem = document.getElementById("updatedTime");

  if (lastUpdatedServer) {
    elem.innerHTML = distanceInWordsToNow(lastUpdatedServer) + " ago";
  } else {
    elem.innerHTML = "never";
  }
  setTimeout(lastUpdatedFn, 10000);
}

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

// Detect PWA on iOS for iPhone X UI optimization
var ipXPWAOpt = () => {
  if (DeviceDetect.isiPhoneWithNotch()) {
    document.getElementById("clockbg").style.display = "block";
    document.getElementById("spacer").style.display = "block";
  }
};
ipXPWAOpt();

//
// poor man's resizer for fullscreen map
//
var dimensions = () => {
  let browserHeight;
  let navEl;
  let mapEl;

  mapEl = document.getElementById("map");
  navEl = document.getElementById("navbar").clientHeight;
  browserHeight = window.innerHeight;
  mapEl.style.height = browserHeight - navEl + safeAreaInsets.top + "px";
};
dimensions();

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
  dimensions();
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
  distance: 4,
  map: map,
  source: vs
});

var styleCache = {};
var vl = new VectorLayer({ // eslint-disable-line no-unused-vars
  source: clusters,
  map: map,
  style: function (feature) {
    var size = feature.get("features").length;
    var style = styleCache[size];
    if (!style) {
      var textsize;
      if (size > 12) {
        textsize = 38;
      } else if (size > 8) {
        textsize = 35;
      } else if (size > 3) {
        textsize = 33;
      } else if (size > 1) {
        textsize = 26;
      } else {
        textsize = 24;
      }
      style = new Style({
        text: new Text({
          text: "⚡️",
          fill: new Fill({ color: "rgba(255, 255, 255, 1.0)" }),
          font: textsize + "px Calibri,sans-serif"
        })
      });
      styleCache[size] = style;
    }
    return style;
  }
});

// timer every 10 sec
// {
//  vs.forEachFeature(function (f){
//    // 1. get feature age from f.getId() (timestamp)
//    // 2. calculate alpha value based on age
//    // 3. update feature style
//  }
// }

var haveZoomed = false;
geolocation.on("change:position", function () {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  if (window.location.hash !== "" && !haveZoomed) {
    map.getView().animate({ center: coordinates, zoom: 10 });
    haveZoomed = true;
  }
});

//
// actually display reflectivity radar data
//

var tileUrl = "http://localhost:8041/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
var websocketUrl = "/tile";
if (process.env.NODE_ENV === "production") {
  tileUrl = "https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
}

var reflectivityOpacity = 0.5;
var currentLayer;

// manually download tileJSON using jquery, so we can extract the "version"
// field and use it for the "last updated" feature.
$.getJSON({
  dataType: "json",
  url: tileUrl,
  success: function (data) {
    currentLayer = new TileLayer({
      source: new TileJSON({
        tileJSON: data,
        crossOrigin: "anonymous"
      }),
      opacity: reflectivityOpacity
    });
    map.addLayer(currentLayer);
    lastUpdatedServer = new Date(data.version * 1000);
    lastUpdatedFn();
  }
});

// we can now later call removeLayer(currentLayer), then update it with the new
// tilesource and then call addLayer again.
const socket = io.connect(websocketUrl);

socket.on("connect", () => console.log("websocket connected"));

class StrikeManager {
  constructor (maxStrikes) {
    this.maxStrikes = maxStrikes;
    this.strikes = [];
  }

  addStrike (lon, lat) {
    var lightning = new Feature(new Point([lon, lat]));
    lightning.setId(new Date().getTime());
    this.strikes.push(lightning.getId());
    if (this.strikes.length > this.maxStrikes) {
      var toRemove = this.strikes.shift();
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
  map.getView().animate({ center: coordinates, zoom: 10 });
};
button.addEventListener("click", locateMe, false);
var element = document.createElement("div");
element.className = "locate-me ol-unselectable ol-control";
element.appendChild(button);
var locateControl = new Control({
  element: element
});
map.addControl(locateControl);

// https://stackoverflow.com/a/44579732/10272994
// resize for orientationchange
function orientationChanged () {
  const timeout = 120;
  return new window.Promise(function (resolve) {
    const go = (i, height0) => {
      window.innerHeight !== height0 || i >= timeout
        ? resolve()
        : window.requestAnimationFrame(() => go(i + 1, height0));
    };
    go(0, window.innerHeight);
  });
}

window.addEventListener("resize", function () {
  orientationChanged().then(function () {
    if (DeviceDetect.isiPhoneWithNotch()) {
      if (window.innerHeight < window.innerWidth) {
        // landscape
        document.getElementById("clockbg").style.display = "none";
        document.getElementById("spacer").style.display = "none";
      } else {
        // portrait
        ipXPWAOpt();
      }
    }
    setTimeout(function () { dimensions(); map.updateSize(); }, 100);
  });
});

/* push notifications */
var pushLink = document.getElementById("toggleNotifyLink");
var pushLink2 = document.getElementById("toggleNotifyLink2");
var pushCheckbox = document.getElementById("toggleNotifyCheckbox");

pushLink.onclick = () => {
  pushCheckbox.checked = !pushCheckbox.checked;
  pushCheckbox.onchange();
};
pushLink2.onclick = () => {
  pushCheckbox.checked = !pushCheckbox.checked;
  pushCheckbox.onchange();
};

var pushSocket;

pushCheckbox.onchange = () => {
  var checked = pushCheckbox.checked;
  if (!Notification) { return; }

  if (checked) {
    console.log("registering push notification...");
    pushSocket = io.connect("/rain_notify_browser");

    var ahead = parseInt(document.getElementById("aheadSelect").value);
    var coordinates = geolocation.getPosition();
    if (!coordinates) {
      console.log("no geolocation");
      $("#geoLocationModal").modal();
      return;
    }
    var currentLonLat = toLonLat(coordinates);

    pushSocket.on("notify", function (data) {
      /* eslint-disable no-new */
      /* This is a browser API! I didn't want to "use new for side effects"! */
      new Notification(data.title, {
        "icon": logoBig,
        "body": data.body,
        "requireInteraction": true,
        "vibrate": [200, 100, 200]
      });
      /* eslint-enable */
    });

    pushSocket.emit("register", {
      "lat": currentLonLat[1],
      "lon": currentLonLat[0],
      "ahead": ahead,
      "intensity": 10,
      "accuracy": 1.0
    });

    if (Notification.permission !== "granted") { Notification.requestPermission(); }

    var notifyText = "You will be notified " + ahead + " minutes before it rains!";
    /* eslint-disable no-new */
    /* This is a browser API! I didn't want to "use new for side effects"! */
    new Notification(notifyText, {
      "icon": logoBig
    });
    /* eslint-enable */
  } else {
    console.log("unregistering...");
    socket.emit("unregister", {});
  }
};

/* vim: set ts=2 sw=2 expandtab: */
