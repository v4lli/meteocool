/*
 * This is basically a 1000 line config file for openlayers. :)
 */
import "./main.css";
import "ol/ol.css";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import $ from "jquery";
import CircleStyle from "ol/style/Circle";
import { circular as circularPolygon } from "ol/geom/Polygon.js";
import { get as getProjection, getTransformFromProjections, fromLonLat } from "ol/proj.js";
import Control from "ol/control/Control";
import OSM from "ol/source/OSM";
import Point from "ol/geom/Point";
import TileJSON from "ol/source/TileJSON.js";
import TileLayer from "ol/layer/Tile.js";
import Attribution from "ol/control/Attribution";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import distanceInWordsToNow from "date-fns/distance_in_words_to_now";
import dateFnGerman from "date-fns/locale/de";
import dateFnEnglish from "date-fns/locale/en";
import io from "socket.io-client";
import { Cluster } from "ol/source.js";
import { DeviceDetect } from "./DeviceDetect.js";
import { Settings } from "./Settings.js";
import { Fill, Stroke, Style, Text } from "ol/style";
import { Map, View, Geolocation, Feature } from "ol";
import { defaults as defaultControls, OverviewMap } from "ol/control.js";

import { LayerManager } from "./LayerManager.js";
import { StrikeManager } from "./StrikeManager.js";
import { Workbox } from "workbox-window";

import logoBig from "../assets/android-chrome-512x512.png"; // eslint-disable-line no-unused-vars

const safeAreaInsets = require("safe-area-insets");

window.jQuery = $;
window.$ = $;

var dd = new DeviceDetect();

// german localization - since we have very few string, do this manually
// instead of using another crappy library.
// var lang = "en";
var dfnLocale = dateFnEnglish;
if (window.location.search.indexOf("lang=de") !== -1 || window.navigator.language.split("-")[0] === "de") {
  $("#localizedLastUpdated").text("Aktualisiert");
  $("#updatedTime").text("nie!");
  $("#openSettings").text("Einstellungen");
  $("#toggleMode").text("Dark Mode");
  $("#localizedDocumentation").text("Dokumentation");
  $("#localizedApps").text("Android & iPhone");
  $("#localizedAbout").text("Über meteocool");
  $("#logotext").text("meteocool.de");
  // lang = "de";
  dfnLocale = dateFnGerman;
} else {
  $("#logotext").text("meteocool.com");
}

function lastUpdatedFn () {
  var elem = document.getElementById("updatedTime");

  if (elem) {
    if (window.lastUpdatedServer) {
      elem.innerHTML = distanceInWordsToNow(window.lastUpdatedServer, { locale: dfnLocale, addSuffix: true });
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
  } else if (window.location.hash.includes("#map")) {
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

var view = new View({
  center: center,
  zoom: zoom,
  minzoom: 5
});

var baseAttributions = "&#169; <a href=\"https://www.dwd.de/DE/service/copyright/copyright_artikel.html\" target=\"_blank\" rel=\"noopener\" rel=\"noreferrer\">DWD</a> &#169; <a href=\"http://en.blitzortung.org/contact.php\" target=\"_blank\" rel=\"noopener\" rel=\"noreferrer\">blitzortung.org</a> &#169; <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\" rel=\"noopener\" rel=\"noreferrer\">OSM</a> &#169; <a href=\"https://carto.com/attribution/\" target=\"_blank\" rel=\"noopener\" rel=\"noreferrer\">CARTO</a>";

if (!dd.isWidgetMode()) {
  baseAttributions = baseAttributions + " | <a href=\"#\" onclick=\"$('#impressumModal').modal('show'); return false;\">Impressum</a>";
}

if (dd.isAuxPage()) {
  baseAttributions = "";
}

window.map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM({
        url: lightTiles,
        attributions: baseAttributions
      })
    })
  ],
  controls: dd.isWidgetMode() ? [attribution] : defaultControls({ attribution: false }).extend([
    new OverviewMap(),
    attribution
  ]),
  view: view
});
//
// Geolocation (showing the user's position)
//

window.geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: false
  },
  projection: view.getProjection()
});

if (!window.location.hash && !DeviceDetect.getIosAPILevel() >= 2 && !DeviceDetect.getAndroidAPILevel() >= 1) {
  // wtf is this XXX
  if (!dd.isAuxPage()) {
    window.geolocation.setTracking(true);
  }
}

// handle geolocation error.
window.geolocation.on("error", (error) => {
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
      console.log(error);
      break;
  }
});

var accuracyFeature = new Feature();
window.geolocation.on("change:accuracyGeometry", () => {
  accuracyFeature.setGeometry(window.geolocation.getAccuracyGeometry());
});

var shouldUpdate = true;
window.map.on("moveend", () => {
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
});

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

/*
 * Need to disable this stylechecker warning because the VectorLayer constructor
 * us only used for its sideeffects, which isn't nice.
 */
/* eslint-disable */
new VectorLayer({
  source: new VectorSource({features: [accuracyFeature, positionFeature]}),
  map: map,
  renderMode: 'image'
});
/* eslint-enable */

var vs = new VectorSource({
  features: []
});

var clusters = new Cluster({
  distance: 8,
  map: document.map,
  source: vs
});

var styleCache = {};
var vl = new VectorLayer({ // eslint-disable-line no-unused-vars
  source: clusters,
  map: document.map,
  style: function (feature) {
    var size = feature.get("features").length;
    var age = 0;
    let now = new Date().getTime();
    let MINS = 1000 * 30;
    feature.get("features").forEach((feature) => { age += (now - feature.getId()) / MINS; });
    // age max = 60, divide by 3 to reduce to 20 age levels max
    age = (Math.round(age / size / 2.5)) + 1;
    if (age > 30) {
      age = 20;
    }
    var textsize;
    if (size > 13) {
      textsize = 40;
    } else if (size > 9) {
      textsize = 34;
    } else if (size > 3) {
      textsize = 29;
    } else {
      textsize = 24;
    }
    if (!(age in styleCache)) {
      styleCache[age] = {};
    }
    var style = styleCache[age][textsize];
    if (!style) {
      var opacity;
      if (age < 5) {
        opacity = 1;
      } else {
        // XXX oh god i'm so sorry
        opacity = Math.max(Math.min(1 - (age / 30 * 0.8) - 0.2, 1), 0);
      }
      // console.log("new size + age: " + textsize + ", " + age + ", opacity: " + opacity);

      style = new Style({
        text: new Text({
          text: "⚡️",
          fill: new Fill({ color: "rgba(255, 255, 255, " + opacity + ");" }),
          font: textsize + "px Calibri,sans-serif"
        })
      });
      styleCache[age][textsize] = style;
    }
    return style;
  }
});
vl.setZIndex(100);
window.map.addLayer(vl);

var haveZoomed = false;
window.geolocation.on("change:position", () => {
  var coordinates = window.geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  if (window.location.hash !== "" && !haveZoomed) {
    window.map.getView().animate({ center: coordinates, zoom: 9 });
    haveZoomed = true;
  }
});

//
// actually display reflectivity radar data
//

// var tileUrl = "http://localhost:8041/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
// var websocketUrl = "http://localhost:8040/tile";
// if (process.env.NODE_ENV === "production") {
var tileUrl = "https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json";
var websocketUrl = "https://meteocool.com/tile";
// }

var reflectivityOpacity = 0.5;

window.lm = new LayerManager(window.map, tileUrl, null, 9, reflectivityOpacity, DeviceDetect.getIosAPILevel() >= 2);
// we can now later call removeLayer(currentLayer), then update it with the new
// tilesource and then call addLayer again.
const socket = io.connect(websocketUrl);
window.sock = socket;

let strikemgr = new StrikeManager(1000, vs);
window.sm = strikemgr;

socket.on("connect", () => console.log("websocket connected"));

socket.on("bulkStrikes", (message) => {
  console.log("Got " + message.length + " strikes from cache");
  strikemgr.clearAll();
  message.forEach((elem) => {
    strikemgr.addStrikeWithTime(elem["lon"], elem["lat"], Math.round(elem["time"] / 1000 / 1000));
  });
});

socket.on("lightning", function (data) {
  strikemgr.addStrike(data["lon"], data["lat"]);
});

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

  if (DeviceDetect.getIosAPILevel() >= 2) {
    button.addEventListener("click", () => {
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
  } else if (DeviceDetect.getAndroidAPILevel() >= 1) {
    button.addEventListener("click", function () {
      Android.injectLocation(); // eslint-disable-line no-undef
    }, false);
  } else {
    // normal, browser based location stuff
    button.addEventListener("click", (e) => {
      window.geolocation.setTracking(true);
      var coordinates = window.geolocation.getPosition();
      if (coordinates) {
        window.map.getView().animate({ center: coordinates, zoom: 10 });
      }
    }, false);
  }
  var element = document.createElement("div");
  element.className = "locate-me ol-unselectable ol-control";
  element.appendChild(button);
  window.map.addControl(new Control({ element: element }));
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
window.downloadForecast = (cb) => { window.lm.downloadForecast(cb); };
window.playForecast = () => { window.lm.playForecast(); };
window.smartDownloadAndPlay = () => { window.lm.smartDownloadAndPlay(); };
window.setForecastLayer = (num) => { return window.lm.setForecastLayer(num); };

// interface hooks for apps
window.hidePlayButton = function () {
  playButton.style.display = "none";
};
window.showPlayButton = function () {
  playButton.style.display = "";
};

window.userLocation = null;
window.injectLocation = (lat, lon, accuracy, zoom = false) => {
  var center = fromLonLat([lon, lat]);
  window.userLocation = center;
  if (zoom || !haveZoomed) {
    haveZoomed = true;
    window.map.getView().animate({ center: center, zoom: 9 });
  }
  if (accuracy > 0) {
    const accuracyPoly = circularPolygon([lon, lat], accuracy);
    accuracyPoly.applyTransform(getTransformFromProjections(getProjection("EPSG:4326"), window.map.getView().getProjection()));
    accuracyFeature.setGeometry(accuracyPoly);
  }
  positionFeature.setGeometry(center ? new Point(center) : null);
};

window.setAfg = () => { accuracyFeature.setGeometry(window.afg); };

// Keep URL parameters on "reload"
if (!dd.isAuxPage()) {
  document.getElementById("logolinkhref").href = window.location.href;
}

$(document).ready(function () {
  if (DeviceDetect.getIosAPILevel() >= 2) {
    $("#topMenu")[0].children[2].style.display = "none";
    $("#topMenu")[0].children[3].style.display = "none";
    // XXX re-enable once the scrolling is enabled
  }
  if (window.location.href.indexOf("#about") !== -1) {
    $("#about").modal("show");
  }
  if (window.location.href.indexOf("#apps") !== -1) {
    $("#appModal").modal("show");
  }
  if (window.location.href.indexOf("#impressum") !== -1) {
    $("#impressumModal").modal("show");
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
  window.history.pushState("appModal", "meteocool Apps", "/#apps");
});
$("#about").on("show.bs.modal", function () {
  window.history.pushState("about", "meteocool About", "/#about");
});
$("#impressumModal").on("show.bs.modal", function () {
  window.history.pushState("impressm", "meteocool Impressum", "/#impressum");
});

if (DeviceDetect.getIosAPILevel() >= 3) {
  $("#openSettings").css("display", "inline");
  $("#openSettings").onclick = () => {
    window.webkit.messageHandlers["settingsHandler"].postMessage("show");
  };
}
if (DeviceDetect.getAndroidAPILevel() >= 2) {
  $("#showMenuBtn").css("display", "none");
  $("#showMenuBtnAndroid").css("display", "inline");
  $("#showMenuBtnAndroid").click(() => {
    Android.showSettings(); // eslint-disable-line no-undef
  });
}

var settings = new Settings({
  "mapRotation": {
    "type": "boolean",
    "default": true,
    "cb": (value) => {
      view = new View({
        center: window.map.getView().getCenter(),
        zoom: window.map.getView().getZoom(),
        minzoom: 5,
        enableRotation: value
      });
      window.map.setView(view);
    }
  },
  "zoomOnForeground": {
    "type": "boolean",
    "default": false,
    "cb": null
  },
  "proMode": {
    "type": "boolean",
    "default": false,
    "cb": null
  },
  "darkMode": {
    "type": "boolean",
    "default": false,
    "cb": (state) => {
      // Switch to dark tilelayer
      var newLayer = new TileLayer({
        source: new OSM({
          url: state ? darkTiles : lightTiles,
          attributions: baseAttributions
        })
      });
      window.map.getLayers().setAt(0, newLayer);

      // change menu bar and modal background color
      toggleButton.innerHTML = state ? "light mode" : "dark mode";
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

      // notify iOS app
      if (DeviceDetect.isIos()) {
        if (settings.get("darkMode")) {
          window.webkit.messageHandlers["scriptHandler"].postMessage("darkmode");
        } else {
          window.webkit.messageHandlers["scriptHandler"].postMessage("lightmode");
        }
      }
    }
  }
});

// for historic reason, this is the hook called by the apps when entering
// foreground..
window.manualTileUpdateFn = (p) => {
  // manually download tileJSON using jquery, so we can extract the "version"
  // field and use it for the "last updated" feature.
  var elem = document.getElementById("updatedTime");
  if (elem) { elem.innerHTML = "..."; }
  window.lm.downloadMainTiles((data) => updateTimestamp(new Date(data.version * 1000)));
  window.sock.emit("getStrikes", null, (data) => {});
  if (settings.get("zoomOnForeground")) {
    if (window.userLocation) {
      window.map.getView().animate({ center: window.userLocation, zoom: 10 });
    } else {
      if (DeviceDetect.getAndroidAPILevel() >= 2) {
        Android.injectLocation(); // eslint-disable-line no-undef
        window.setTimeout(() => { window.manualTileUpdateFn(true); }, 1000);
      }
    }
  }
};
window.manualTileUpdateFn();

if (DeviceDetect.getAndroidAPILevel() >= 2) {
  Android.requestSettings(); // eslint-disable-line no-undef
}

if (settings.get("darkMode")) {
  settings.cb("darkMode");
}

window.injectSettings = (newSettings) => {
  for (var key in newSettings) {
    settings.set(key, newSettings[key]);
  }
};

if (toggleButton) {
  toggleButton.onclick = () => settings.set("darkMode", !settings.get("darkMode"));
  ;
}

// Register service worker
if ("serviceWorker" in navigator) {
  const wb = new Workbox("sw.js");
  wb.addEventListener("waiting", (event) => {
    wb.addEventListener("controlling", (event) => {
      console.log("Reloading page for latest content");
      window.location.reload();
    });
    wb.messageSW({ type: "SKIP_WAITING" });
    // Old serviceworker message for migration, can be removed in the future
    wb.messageSW("SKIP_WAITING");
  });
  wb.register();
}

// purge old lightning strikes on restart
setTimeout(() => { strikemgr.fadeStrikes(); }, 30 * 1000);

/* vim: set ts=2 sw=2 expandtab: */
