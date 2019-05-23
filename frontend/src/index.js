// my sincere apologies to anyone reading this source code. I promise to
// refactor this piece of crap some time soon(TM).

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
import { fromLonLat } from "ol/proj.js";
import { LayerManager } from "./LayerManager.js";
import { StrikeManager } from "./StrikeManager.js";

import logoBig from "../assets/android-chrome-512x512.png"; // eslint-disable-line no-unused-vars

const safeAreaInsets = require("safe-area-insets");

window.jQuery = $;
window.$ = $;

var dd = new DeviceDetect();

function lastUpdatedFn () {
  var elem = document.getElementById("updatedTime");

  if (elem) {
    if (window.lastUpdatedServer) {
      elem.innerHTML = distanceInWordsToNow(window.lastUpdatedServer) + " ago";
    } else {
      elem.innerHTML = "<span style='color: #ff0000;'>connection error</span>";
    }
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
  if (document.getElementById("navbar").style.display === "none") {
    navEl = 0;
  } else {
    navEl = document.getElementById("navbar").clientHeight;
  }

  browserHeight = window.innerHeight;

  if (dd.isAuxPage()) {
    mapEl.style.height = navEl;
  } else {
    mapEl.style.height = browserHeight - navEl + safeAreaInsets.top + "px";
  }
};

// ================
// OpenLayers setup
// ================

var positionFeature = new Feature();
positionFeature.setStyle(new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({
      color: "#3399CC"
    }),
    stroke: new Stroke({
      color: "#fff",
      width: 2.5
    })
  })
}));

// configuration/defaults
var zoom = 6;
var center = fromLonLat([10.447683, 51.163375]);

if (window.location.hash !== "") {
  // try to restore center, zoom-level and rotation from the URL
  if (window.location.hash.includes("#widgetMap")) {
    // XXX deduplicate with other case
    var hash = window.location.hash.replace("#widgetMap=", "");
    var parts = hash.split("/");
    if (parts.length === 4) {
      zoom = parseInt(parts[0], 10);
      center = fromLonLat([
        parseFloat(parts[2]),
        parseFloat(parts[1])
      ]);
      document.getElementById("navbar").style.display = "none";
      positionFeature.setGeometry(center ? new Point(center) : null);
    }
  } else {
    var hashM = window.location.hash.replace("#map=", "");
    var partsM = hashM.split("/");
    if (partsM.length === 4) {
      zoom = parseInt(partsM[0], 10);
      center = [ parseFloat(partsM[1]), parseFloat(partsM[2]) ];
    }
  }
}
dimensions();

//
// DARK MODE
//

var toggleButton = document.getElementById("toggleMode");
var navbar = document.getElementById("navbar");
var mclight = document.querySelectorAll(".modal-content, .mc-light");

// XXX use retina tiles if possible!
// https://openlayers.org/en/latest/examples/xyz-retina.html?mode=raw
// https://github.com/CartoDB/basemap-styles
var lightTiles = "https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png"; // 'undefined' will use the OSM class' default - OSM doesn't offer pbf (vector) tiles (?)
var darkTiles = "https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png";

// light view is default
var viewMode = true;

var toggleHTMLfixMe = () => {
  toggleButton.innerHTML = viewMode ? "dark mode" : "light mode";

  for (let index = 0; index < mclight.length; index++) {
    const element = mclight[index];
    if (element.classList.contains("bg-dark")) {
      element.classList.remove("bg-dark", "text-white");
    } else {
      element.classList.add("bg-dark", "text-white");
    }
  }
  if (navbar.classList.contains("navbar-light")) {
    navbar.classList.remove("navbar-light", "bg-light", "bg-dark", "text-white");
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

var baseAttributions = "&#169; <a href=\"https://www.dwd.de/DE/service/copyright/copyright_artikel.html\" target=\"_blank\">DWD</a> &#169; <a href=\"http://en.blitzortung.org/contact.php\" target=\"_blank\">blitzortung.org</a> &#169; <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">OSM</a> &#169; <a href=\"https://carto.com/attribution/\" target=\"_blank\">CARTO</a>";

if (!dd.isWidgetMode()) {
  baseAttributions = baseAttributions + " | <a href=\"#\" onclick=\"$('#impressumModal').modal('show'); return false;\">Impressum</a>";
}

if (dd.isAuxPage()) {
  baseAttributions = "";
}

var darkAttributions = "";

window.map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM({
        url: viewMode ? lightTiles : darkTiles,
        attributions: viewMode ? baseAttributions : baseAttributions + darkAttributions
      })
    })
  ],
  controls: dd.isWidgetMode() ? [attribution] : defaultControls({ attribution: false }).extend([
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
      url: viewMode ? lightTiles : darkTiles,
      attributions: viewMode ? baseAttributions : baseAttributions + darkAttributions
    })
  });
  window.map.getLayers().setAt(0, newLayer);
};

function toggleIOSBar () {
  if (DeviceDetect.isIos()) {
    if (viewMode) {
      window.webkit.messageHandlers["scriptHandler"].postMessage("lightmode");
    } else {
      window.webkit.messageHandlers["scriptHandler"].postMessage("darkmode");
    }
  }
}

if (toggleButton) {
  toggleButton.onclick = () => {
    toggleViewMode();
    toggleHTMLfixMe();
    toggleIOSBar();
  };
}

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

if (!window.location.hash && !DeviceDetect.getIosAPILevel() >= 2 && !DeviceDetect.getAndroidAPILevel() >= 1) {
  // wtf is this XXX
  if (!dd.isAuxPage()) {
    geolocation.setTracking(true);
  }
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
vl.setZIndex(100);
window.map.addLayer(vl);

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
    window.map.getView().animate({ center: coordinates, zoom: 9 });
    haveZoomed = true;
  }
});

//
// actually display reflectivity radar data
//

var tileUrl = "http://localhost:8041/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
var websocketUrl = "https://meteocool.com/tile";
// if (process.env.NODE_ENV === "production") {
tileUrl = "https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
// }

var reflectivityOpacity = 0.5;

window.lm = new LayerManager(window.map, tileUrl, null, 9, reflectivityOpacity, DeviceDetect.getIosAPILevel() >= 2);

// manually download tileJSON using jquery, so we can extract the "version"
// field and use it for the "last updated" feature.
function manualTileUpdate () {
  var elem = document.getElementById("updatedTime");
  if (elem) { elem.innerHTML = "checking..."; }
  window.lm.downloadMainTiles((data) => updateTimestamp(new Date(data.version * 1000)));
}
window.manualTileUpdateFn = function (p) { manualTileUpdate(); };
manualTileUpdate();

// we can now later call removeLayer(currentLayer), then update it with the new
// tilesource and then call addLayer again.
const socket = io.connect(websocketUrl);

socket.on("connect", () => console.log("websocket connected"));

let strikemgr = new StrikeManager(1337, vs);

socket.on("lightning", function (data) {
  strikemgr.addStrike(data["lon"], data["lat"]);
});

window.sock = socket;

// called when new cloud layers are available
socket.on("map_update", function (data) {
  window.lm.switchMainLayer(new TileLayer({
    source: new TileJSON({
      tileJSON: data,
      crossOrigin: "anonymous"
    }),
    opacity: reflectivityOpacity
  }));

  // update the relative time at the top of the page
  updateTimestamp(new Date(data.version * 1000));

  // XXX actually V3
  if (DeviceDetect.getIosAPILevel() >= 2) {
    window.webkit.messageHandlers["timeHandler"].postMessage(data.version.toString());
  }
});

window.isMonitoring = false;

if (DeviceDetect.getIosAPILevel() >= 2) {
  window.webkit.messageHandlers["scriptHandler"].postMessage("startMonitoringLocation");
  window.webkit.messageHandlers["scriptHandler"].postMessage("startMonitoringLocationImplicit");
  window.isMonitoring = true;
}

// locate me button
if (!dd.isWidgetMode()) {
  var button = document.createElement("button");
  button.classList.add("locate-me-btn");
  button.title = "Locate Me";
  button.innerHTML = "<img class=\"\" id=\"pulse\" src=\"./baseline_location_searching_white_48dp.png\">";
}

if (!dd.isWidgetMode() && !DeviceDetect.getAndroidAPILevel() >= 1) {
  var locateMe = function (e) {
    var coordinates = geolocation.getPosition();
    if (coordinates) {
      geolocation.setTracking(true);
      window.map.getView().animate({ center: coordinates, zoom: 10 });
    }
  };

  if (DeviceDetect.getIosAPILevel() >= 2) {
    button.addEventListener("click", function () {
      if (window.isMonitoring) {
        $("#pulse").addClass("pulse");
        window.webkit.messageHandlers["scriptHandler"].postMessage("startMonitoringLocation"); // old API, may 2019
        window.webkit.messageHandlers["scriptHandler"].postMessage("startMonitoringLocationExplicit");
        if (window.userLocation != null) {
          window.map.getView().animate({ center: window.userLocation, zoom: 10 });
        }
      } else {
        $("#pulse").removeClass("pulse");
        window.webkit.messageHandlers["scriptHandler"].postMessage("stopMonitoringLocation");
      }
      window.isMonitoring = !window.isMonitoring;
    }, false);
  } else {
    button.addEventListener("click", locateMe, false);
  }
}

if (DeviceDetect.getAndroidAPILevel() >= 1) {
  button.addEventListener("click", function () {
    Android.injectLocation(); // eslint-disable-line no-undef
  }, false);
}

if (!dd.isWidgetMode()) {
  var element = document.createElement("div");
  element.className = "locate-me ol-unselectable ol-control";
  element.appendChild(button);
  window.map.addControl(
    new Control({
      element: element
    }));
}

// forecast button
var playButton;
if (!dd.isWidgetMode()) {
  playButton = document.createElement("button");
  playButton.classList.add("play");
  playButton.title = "Play Forecast";
  // XXX set attributes via dom instead of innerHTML
  playButton.innerHTML = "<img src=\"./player-play.png\" id=\"nowcastIcon\"><div class=\"spinner-border spinner-border-sm\" role=\"status\" id=\"nowcastLoading\" style=\"display: none;\"><span class=\"sr-only\">Loading...</span></div>";
  playButton.addEventListener("click", (e) => { window.lm.smartDownloadAndPlay(e); }, false);
  var playElement = document.createElement("div");
  playElement.className = "play ol-unselectable ol-control";
  playElement.appendChild(playButton);
  var playControl = new Control({
    element: playElement
  });
  window.map.addControl(playControl);
}

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

// always show attributions in widget mode
if (dd.isWidgetMode()) {
  attribution.setCollapsible(false);
  attribution.setCollapsed(false);
}

//
// openlayers in-flight tile detection from
// https://stackoverflow.com/questions/33061221/ensuring-all-tiles-are-loaded-in-open-layers-3-xyz-source/45054387#45054387
//
window.map.on("postrender", function (evt) {
  if (!evt.frameState) { return; }

  var numHeldTiles = 0;
  var wanted = evt.frameState.wantedTiles;
  for (var layer in wanted) {
    if (wanted.hasOwnProperty(layer)) { numHeldTiles += Object.keys(wanted[layer]).length; }
  }

  var ready = window.lm.getInFlightTiles() === 0 && numHeldTiles === 0;
  if (window.map.get("ready") !== ready) { window.map.set("ready", ready); }
});
window.map.set("ready", false);

// hooks for forecast control
window.downloadForecast = function () { window.lm.downloadForecast(); };
window.playForecast = function () { window.lm.playForecast(); };
window.smartDownloadAndPlay = function () { window.lm.smartDownloadAndPlay(); };
window.setForecastLayer = function (num) { window.lm.setForecastLayer(num); };

// interface hooks for apps
window.hidePlayButton = function () {
  playButton.style.display = "none";
};
window.showPlayButton = function () {
  playButton.style.display = "";
};

window.userLocation = null;
window.injectLocation = function (lat, lon, accuracy, zoom = false) {
  var center = fromLonLat([lon, lat]);
  window.userLocation = center;
  if (zoom || !haveZoomed) {
    haveZoomed = true;
    window.map.getView().animate({ center: center, zoom: 9 });
  }
  positionFeature.setGeometry(center ? new Point(center) : null);
};

// Keep URL parameters on "reload"
if (!dd.isAuxPage()) {
  document.getElementById("logolinkhref").href = window.location.href;
}

$(document).ready(function () {
  if (DeviceDetect.getIosAPILevel() >= 2) {
    $("#topMenu")[0].children[1].style.display = "none";
    $("#topMenu")[0].children[2].style.display = "none";
    // XXX re-enable once the scrolling is enabled
  }
  if (window.location.href.indexOf("#about") !== -1) {
    $("#about").modal("show");
  }
  if (DeviceDetect.getIosAPILevel() >= 2 && (window.location.href.indexOf("documentation.html") !== -1)) {
    window.webkit.messageHandlers["scriptHandler"].postMessage("enableScrolling");
    window.webkit.messageHandlers["scriptHandler"].postMessage("drawerHide");
  } else if (DeviceDetect.getIosAPILevel() >= 2) {
    window.webkit.messageHandlers["scriptHandler"].postMessage("disableScrolling");
    window.webkit.messageHandlers["scriptHandler"].postMessage("drawerShow");
  }
});

// lazy load images in modal
$("#appModal").on("show.bs.modal", function () {
  $(".lazy_load").each(function () {
    var img = $(this);
    img.attr("src", img.data("src"));
  });
});

/* vim: set ts=2 sw=2 expandtab: */
