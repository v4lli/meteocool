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
import Attribution from "ol/control/Attribution";
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

function lastUpdatedFn () {
  var elem = document.getElementById("updatedTime");

  if (window.lastUpdatedServer) {
    elem.innerHTML = distanceInWordsToNow(window.lastUpdatedServer) + " ago";
  } else {
    elem.innerHTML = "<span style='color: #ff0000;'>connection error</span>";
  }
}
setTimeout(lastUpdatedFn, 10000);

window.lastUpdatedServer = false;
function updateTimestamp (lastUpdatedParam) {
  window.lastUpdatedServer = lastUpdatedParam;
  lastUpdatedFn();
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

// hide browser push feature on ios
var attribution = new Attribution({
  collapsible: false
});
if (DeviceDetect.isIos()) {
  document.getElementById("browserPushMenu").style.display = "none";

  attribution.setCollapsible(true);
  attribution.setCollapsed(true);
}

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

window.map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM({
        url: viewMode ? lightTiles : darkTiles,
        attributions: "&#169; <a href=\"https://www.dwd.de/DE/service/copyright/copyright_artikel.html\">DWD</a> &#169; <a href=\"http://en.blitzortung.org/contact.php\">blitzortung.org</a> &#169; <a href=\"https://www.openstreetmap.org/copyright\">OSM</a> contributors."
      })
    })
  ],
  controls: defaultControls({ attribution: false }).extend([
    new OverviewMap(),
    attribution
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
  window.map.getLayers().setAt(0, newLayer);
};

function toggleIOSBar() {
  if (DeviceDetect.isIos()) {
    if (viewMode) {
      window.webkit.messageHandlers["scriptHandler"].postMessage("lightmode");
    } else {
      window.webkit.messageHandlers["scriptHandler"].postMessage("darkmode");
    }
  }
}


toggleButton.onclick = () => {
  toggleViewMode();
  toggleHTMLfixMe();
  toggleIOSBar();
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

window.map.on("moveend", updatePermalink);

// restore the view state when navigating through the history, see
// https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
window.addEventListener("popstate", function (event) {
  if (event.state === null) {
    return;
  }
  window.map.getView().setCenter(event.state.center);
  window.map.getView().setZoom(event.state.zoom);
  window.map.getView().setRotation(event.state.rotation);
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
  map: document.map,
  source: vs
});

var styleCache = {};
var vl = new VectorLayer({ // eslint-disable-line no-unused-vars
  source: clusters,
  map: document.map,
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
    window.map.getView().animate({ center: coordinates, zoom: 10 });
    haveZoomed = true;
  }
});

//
// actually display reflectivity radar data
//

var tileUrl = "http://localhost:8041/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
var websocketUrl = "/tile";
// if (process.env.NODE_ENV === "production") {
tileUrl = "https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
// }

var reflectivityOpacity = 0.5;
window.currentLayer = false;

// manually download tileJSON using jquery, so we can extract the "version"
// field and use it for the "last updated" feature.
function manualTileUpdate (removePrevious) {
  var elem = document.getElementById("updatedTime");
  elem.innerHTML = "checking...";

  $.getJSON({
    dataType: "json",
    url: tileUrl,
    success: function (data) {
      var newLayer = new TileLayer({
        source: new TileJSON({
          tileJSON: data,
          crossOrigin: "anonymous"
        }),
        opacity: reflectivityOpacity
      });
      window.map.addLayer(newLayer);
      if (window.currentLayer) { window.map.removeLayer(window.currentLayer); }
      window.currentLayer = newLayer;

      // force reload of forecast
      window.forecastDownloaded = false;
      window.forecastLayers.forEach(function (layer) {
        window.playInPorgress = false;
        layer = false;
      });

      updateTimestamp(new Date(data.version * 1000));
    }
  });
}
window.manualTileUpdateFn = manualTileUpdate;
manualTileUpdate(false);

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
  updateTimestamp(new Date(data.version * 1000));

  var newLayer = new TileLayer({
    source: new TileJSON({
      tileJSON: data,
      crossOrigin: "anonymous"
    }),
    opacity: reflectivityOpacity
  });
  // first add & fetch the new layer, then remove the old one to avoid
  // having no layer at all at some point.
  window.map.addLayer(newLayer);
  window.map.removeLayer(window.currentLayer);
  window.currentLayer = newLayer;
  // invalidate old forecast
  var wasActive = false;
  if (window.playInPorgress) {
    // pause playback
    window.smartDownloadAndPlay();
    wasActive = true;
  }
  window.forecastDownloaded = false;
  window.forecastLayers.forEach(function (layer) {
    layer = false;
  });
  if (wasActive) { window.smartDownloadAndPlay(); }
});

// locate me button
var button = document.createElement("button");
button.classList.add("locate-me-btn");
button.innerHTML = "<img src=\"./baseline_location_searching_white_48dp.png\">";
var locateMe = function (e) {
  var coordinates = geolocation.getPosition();
  geolocation.setTracking(true);
  window.map.getView().animate({ center: coordinates, zoom: 10 });
};
button.addEventListener("click", locateMe, false);
var element = document.createElement("div");
element.className = "locate-me ol-unselectable ol-control";
element.appendChild(button);
var locateControl = new Control({
  element: element
});
window.map.addControl(locateControl);

// forecast button
var playButton = document.createElement("button");
playButton.classList.add("play");
playButton.innerHTML = "<img src=\"./player-play.png\" id=\"nowcastIcon\"><div class=\"spinner-border spinner-border-sm\" role=\"status\" id=\"nowcastLoading\" style=\"display: none;\"><span class=\"sr-only\">Loading...</span></div>";
var playButtonScript = function (e) {
  window.smartDownloadAndPlay();
};
playButton.addEventListener("click", playButtonScript, false);
var playElement = document.createElement("div");
playElement.className = "play ol-unselectable ol-control";
playElement.appendChild(playButton);
var playControl = new Control({
  element: playElement
});
window.map.addControl(playControl);

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
    setTimeout(function () { dimensions(); window.map.updateSize(); }, 100);
  });
  if (DeviceDetect.isIos()) {
    attribution.setCollapsible(true);
    attribution.setCollapsed(true);
  } else {
    var smallAttrib = window.map.getSize()[0] < 700;
    attribution.setCollapsible(smallAttrib);
    attribution.setCollapsed(smallAttrib);
  }
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

// openlayers in-flight tile detection from
// https://stackoverflow.com/questions/33061221/ensuring-all-tiles-are-loaded-in-open-layers-3-xyz-source/45054387#45054387

// var activityIndicatorEnabled = false;

// function enableActivityIndicator () {
//   if (!activityIndicatorEnabled) {
//     console.log("activity indicator ENABLE");
//     activityIndicatorEnabled = true;
//   }
// }
// function disableActivityIndicator () {
//   if (activityIndicatorEnabled) {
//     console.log("disable indicator DISABLE");
//     activityIndicatorEnabled = false;
//   }
// }

window.map.on("postrender", function (evt) {
  if (!evt.frameState) { return; }

  var numHeldTiles = 0;
  var wanted = evt.frameState.wantedTiles;
  for (var layer in wanted) {
    if (wanted.hasOwnProperty(layer)) { numHeldTiles += Object.keys(wanted[layer]).length; }
  }

  var ready = window.numInFlightTiles === 0 && numHeldTiles === 0;
  if (window.map.get("ready") !== ready) { window.map.set("ready", ready); }
});

window.map.set("ready", false);

function whenMapIsReady (callback) {
  if (window.map.get("ready")) { callback(); } else { window.map.once("change:ready", whenMapIsReady.bind(null, callback)); }
}

window.forecastLayers = [false, false, false, false, false, false];
window.forecastNo = -1;
window.numInFlightTiles = 0;

function downloadForecast (cb) {
  var ahead;
  let forecastArrayIdx = 0;

  for (ahead = 5; ahead <= 30; ahead += 5) {
    let idx = forecastArrayIdx;
    /* javascript: because who the fuck need proper printf? */
    var numStr;
    if (ahead === 5) {
      numStr = "05";
    } else {
      numStr = ahead.toString();
    }
    let url = "https://a.tileserver.unimplemented.org/data/FX_0" + numStr + "-latest.json";
    window.finishedCounter = 0;
    $.getJSON({
      dataType: "json",
      url: url,
      success: function (data) {
        var source = new TileJSON({
          tileJSON: data,
          crossOrigin: "anonymous",
          transition: 0
        });
        source.on("tileloadstart", function () { ++window.numInFlightTiles; });
        source.on("tileloadend", function () { --window.numInFlightTiles; });
        var newLayer = new TileLayer({
          source: source,
          opacity: 0
        });
        window.forecastLayers[idx] = newLayer;
        // This starts the tile download process:
        window.map.set("ready", false);
        window.map.addLayer(newLayer);

        whenMapIsReady(function () {
          window.finishedCounter++;
          if (window.finishedCounter === window.forecastLayers.length) {
            console.log("finished all tiles: " + window.finishedCounter);
            window.forecastLayers.forEach(function (layer) {
              if (layer) {
                window.map.removeLayer(layer);
                layer.setOpacity(0.5);
              }
            });
            if (cb) { cb(); }
          }
        });
      }
    });
    forecastArrayIdx++;
  }
}

window.playInPorgress = false;

function playForecast () {
  if (!(window.forecastLayers[0] && window.forecastLayers[1] && window.forecastLayers[2])) {
    console.log("not all forecasts downloaded yet");
    console.log(window.forecastLayers);
    return;
  }

  switch (window.forecastNo) {
    case -1:
      window.forecastNo++;
      window.map.addLayer(window.forecastLayers[window.forecastNo]);
      window.map.removeLayer(window.currentLayer);
      window.activeForecastTimeout = window.setTimeout(window.playForecast, 750);
      break;
    case 0:
      window.map.addLayer(window.forecastLayers[++window.forecastNo]);
      window.map.removeLayer(window.forecastLayers[--window.forecastNo]);
      window.forecastNo++;
      window.activeForecastTimeout = window.setTimeout(window.playForecast, 750);
      break;
    case 1:
      window.map.addLayer(window.forecastLayers[++window.forecastNo]);
      window.map.removeLayer(window.forecastLayers[--window.forecastNo]);
      window.forecastNo++;
      window.activeForecastTimeout = window.setTimeout(window.playForecast, 750);
      break;
    case 2:
      window.map.addLayer(window.forecastLayers[++window.forecastNo]);
      window.map.removeLayer(window.forecastLayers[--window.forecastNo]);
      window.forecastNo++;
      window.activeForecastTimeout = window.setTimeout(window.playForecast, 750);
      break;
    case 3:
      window.map.addLayer(window.forecastLayers[++window.forecastNo]);
      window.map.removeLayer(window.forecastLayers[--window.forecastNo]);
      window.forecastNo++;
      window.activeForecastTimeout = window.setTimeout(window.playForecast, 750);
      break;
    case 4:
      window.map.addLayer(window.forecastLayers[++window.forecastNo]);
      window.map.removeLayer(window.forecastLayers[--window.forecastNo]);
      window.forecastNo++;
      window.activeForecastTimeout = window.setTimeout(window.playForecast, 750);
      break;
    case 5:
      window.map.addLayer(window.currentLayer);
      window.map.removeLayer(window.forecastLayers[window.forecastNo]);
      window.forecastNo = -1;
      window.playInPorgress = false;
      document.getElementById("nowcastIcon").src = "./player-play.png";
      document.getElementById("nowcastIcon").style.display = "";
      break;
  }
}

window.downloadForecast = downloadForecast;
window.playForecast = playForecast;

window.forecastDownloaded = false;
window.smartDownloadAndPlay = function () {
  if (window.playInPorgress) {
    clearTimeout(window.activeForecastTimeout);
    window.playInPorgress = false;
    document.getElementById("nowcastIcon").src = "./player-play.png";
    document.getElementById("nowcastIcon").style.display = "";
    return;
  }

  if (!window.forecastDownloaded) {
    document.getElementById("nowcastIcon").style.display = "none";
    document.getElementById("nowcastLoading").style.display = "";
    window.downloadForecast(function () {
      document.getElementById("nowcastLoading").style.display = "none";
      document.getElementById("nowcastIcon").style.display = "";
      document.getElementById("nowcastIcon").src = "./player-pause.png";
      window.forecastDownloaded = true;
      window.playInPorgress = true;
      window.playForecast();
    });
  } else {
    window.playInPorgress = true;
    document.getElementById("nowcastIcon").style.display = "";
    document.getElementById("nowcastIcon").src = "./player-pause.png";
    playForecast();
  }
};

// enableActivityIndicator();

/* vim: set ts=2 sw=2 expandtab: */
