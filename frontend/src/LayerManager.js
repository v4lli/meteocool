import $ from "jquery";
import TileJSON from "ol/source/TileJSON.js";
import TileLayer from "ol/layer/Tile.js";

var whenMapIsReady = (map, callback) => {
  if (map.get("ready")) {
    callback();
  } else {
    map.once("change:ready", whenMapIsReady.bind(null, map, callback));
  }
};

/**
 * Manages the reflectivity + forecast layers shown on the map.
 */
export class LayerManager {
  constructor (map, mainTileUrl, forecastTileUrl, numForecastLayers, opacity, enableIOSHooks) {
    this.numForecastLayers = numForecastLayers;
    this.forecastLayers = new Array(numForecastLayers);
    this.forecastDownloaded = false;
    this.mainLayer = false;
    this.map = map;
    this.numInFlightTiles = 0;
    this.appHandlers = [];
    this.mainTileUrl = mainTileUrl;
    this.opacity = opacity;
    this.currentForecastNo = -1;
    this.playPaused = false;
    this.enableIOSHooks = enableIOSHooks;

    if (enableIOSHooks) {
      this.appHandlers.push((handler, action) => {
        if (handler in window.webkit.messageHandlers) { window.webkit.messageHandlers[handler].postMessage(action); }
      });
    }
  }

  hook (handler, action) {
    // console.log("emitting event " + action + " to handler: " + handler);
    this.appHandlers.forEach((h) => {
      h(handler, action);
    });
  }

  playInProgress () {
    return this.currentForecastNo !== -1 && !this.playPaused;
  }

  getInFlightTiles () {
    return this.numInFlightTiles;
  }

  smartDownloadAndPlay () {
    if (this.playInProgress()) {
      clearTimeout(this.activeForecastTimeout);
      document.getElementById("nowcastIcon").src = "./player-play.png";
      document.getElementById("nowcastIcon").style.display = "";
      this.playPaused = true;
      return;
    }

    if (!this.forecastDownloaded) {
      document.getElementById("nowcastIcon").style.display = "none";
      document.getElementById("nowcastLoading").style.display = "";
      this.downloadForecast(() => {
        document.getElementById("nowcastLoading").style.display = "none";
        document.getElementById("nowcastIcon").style.display = "";
        document.getElementById("nowcastIcon").src = "./player-pause.png";
        this.playForecast();
      });
    } else {
      document.getElementById("nowcastIcon").style.display = "";
      document.getElementById("nowcastIcon").src = "./player-pause.png";
      this.playForecast();
    }
  }

  switchMainLayer (newLayer) {
    // invalidate old forecast
    if (this.playInProgress()) {
      this.removeForecast();
    }
    this.stopPlay();
    // reset internal forecast state
    this.invalidateLayers();

    // first add & fetch the new layer, then remove the old one to avoid
    // having no layer at all at some point.
    this.map.addLayer(newLayer);
    this.map.removeLayer(this.mainLayer);
    this.mainLayer = newLayer;
  }

  // invalidate (i.e. throw away) downloaded forecast stuff AND reset map to a
  // defined state.
  invalidateLayers () {
    this.forecastDownloaded = false;
    this.forecastLayers.forEach((layer) => {
      if (layer) {
        this.map.removeLayer(layer["layer"]);
        layer = false;
      }
    });
    this.hook("scriptHandler", "forecastInvalid");
  }

  setForecastLayer (num) {
    if (num === this.currentForecastNo) { return 1; }
    if (!this.forecastDownloaded) { return 2; }
    if (this.playInProgress()) { return 3; }
    if (num > this.numForecastLayers - 1) { return 4; }

    this.playPaused = true;

    if (num === -1) {
      this.map.addLayer(this.mainLayer);
    } else {
      this.map.addLayer(this.forecastLayers[num]["layer"]);
    }

    if (this.currentForecastNo === -1) {
      this.map.removeLayer(this.mainLayer);
    } else {
      this.map.removeLayer(this.forecastLayers[this.currentForecastNo]["layer"]);
    }

    this.currentForecastNo = num;
    return true;
  }

  // bring map back to a defined state, without touching the forecast stuff
  clear () {
    this.map.getLayers().forEach((layer) => {
      this.map.removeLayer(layer);
    });
  }

  stopPlay () {
    this.currentForecastNo = -1;
    this.playPaused = false;
    let elem = document.getElementById("nowcastIcon");
    if (elem) {
      elem.src = "./player-play.png";
      elem.style.display = "";
      $("#forecastTimeWrapper").css("display", "none");
      this.hook("scriptHandler", "playFinished");
    }
  }

  playForecast (e) {
    if (!this.forecastDownloaded) {
      console.log("not all forecasts downloaded yet");
      return;
    }
    this.playPaused = false;

    if (this.currentForecastNo === this.forecastLayers.length - 1) {
      // we're past the last downloaded layer, so end the play
      this.map.addLayer(this.mainLayer);
      this.map.removeLayer(this.forecastLayers[this.currentForecastNo]["layer"]);
      this.stopPlay();
      $("#forecastTimeWrapper").css("display", "none");
      return;
    }

    if (this.currentForecastNo < 0) {
      // play not yet in progress, remove main layer
      this.map.removeLayer(this.mainLayer);
      this.hook("scriptHandler", "playStarted");
      if (!this.enableIOSHooks) {
        $("#forecastTimeWrapper").css("display", "block");
      }
    } else {
      // remove previous layer
      this.map.removeLayer(this.forecastLayers[this.currentForecastNo]["layer"]);
    }
    this.currentForecastNo++;
    this.map.addLayer(this.forecastLayers[this.currentForecastNo]["layer"]);

    if (this.currentForecastNo >= 0) {
      let layerTime = (parseInt(this.forecastLayers[this.currentForecastNo]["version"]) + (this.currentForecastNo + 1) * 5 * 60) * 1000;
      let dt = new Date(layerTime);
      let dtStr = ("0" + dt.getHours()).slice(-2) + ":" + ("0" + dt.getMinutes()).slice(-2);
      $(".forecastTimeInner").html(dtStr);
      this.hook("layerTimeHandler", layerTime);
    }
    this.activeForecastTimeout = window.setTimeout(() => { this.playForecast(); }, 600);
  }

  removeForecast () {
    if (this.currentForecastNo >= 0) {
      this.map.removeLayer(this.forecastLayers[this.currentForecastNo]["layer"]);
    }
    this.hook("scriptHandler", "playFinished");
    this.currentForecastNo = -1;
  }

  downloadForecast (cb) {
    let forecastArrayIdx = 0;

    this.layersFinishedCounter = 0;
    for (var ahead = 5; ahead <= 5 * this.numForecastLayers; ahead += 5) {
      // capture the idx to make it available inside the callback
      let idx = forecastArrayIdx;

      /* javascript be like: because who the fuck needs proper printf? */
      var numStr;
      if (ahead === 5) {
        numStr = "05";
      } else {
        numStr = ahead.toString();
      }
      let url = "https://a.tileserver.unimplemented.org/data/FX_0" + numStr + "-latest.json";

      $.getJSON({
        dataType: "json",
        url: url,
        success: (data) => {
          // create new source + transparent layer, which keep track of
          // downloaded/still not downloaded tiles.
          var source = new TileJSON({
            tileJSON: data,
            crossOrigin: "anonymous",
            transition: 0
          });
          source.on("tileloadstart", () => { ++this.numInFlightTiles; });
          source.on("tileloadend", () => { --this.numInFlightTiles; });
          var newLayer = new TileLayer({
            source: source,
            opacity: 0
          });

          this.forecastLayers[idx] = { "layer": newLayer, "version": data["version"] };
          // This starts the tile download process:
          this.map.set("ready", false);
          this.map.addLayer(newLayer);

          whenMapIsReady(this.map, () => {
            this.layersFinishedCounter++;
            if (this.layersFinishedCounter === this.numForecastLayers) {
              this.forecastDownloaded = true;
              console.log("finished all tiles: " + this.layersFinishedCounter);
              this.forecastLayers.forEach((layer) => {
                if (layer) {
                  this.map.removeLayer(layer["layer"]);
                  layer["layer"].setOpacity(0.5);
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

  downloadMainTiles (cb) {
    $.getJSON({
      dataType: "json",
      url: this.mainTileUrl,
      success: (data) => {
        this.switchMainLayer(new TileLayer({
          source: new TileJSON({
            tileJSON: data,
            crossOrigin: "anonymous",
            transition: 0
          }),
          opacity: this.opacity
        }));

        this.hook("timeHandler", data.version.toString());
        if (cb) { cb(data); }
      }
    });
  }
}

/* vim: set ts=2 sw=2 expandtab: */
