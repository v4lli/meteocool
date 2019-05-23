import $ from "jquery";
import TileJSON from "ol/source/TileJSON.js";
import TileLayer from "ol/layer/Tile.js";

function whenMapIsReady (map, callback) {
  if (map.get("ready")) {
    callback();
  } else {
    map.once("change:ready", whenMapIsReady.bind(null, map, callback));
  }
}

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

    if (enableIOSHooks) {
      this.appHandlers.push(function (handler, action) {
        window.webkit.messageHandlers[handler].postMessage(action);
      });
    }
  }

  hook (handler, action) {
    this.appHandlers.forEach(function (h) {
      h(handler, action);
    });
  }

  playInProgress () {
    return this.currentForecastNo !== -1;
  }

  getInFlightTiles () {
    return this.numInFlightTiles;
  }

  smartDownloadAndPlay () {
    if (this.playInProgress()) {
      clearTimeout(this.activeForecastTimeout);
      document.getElementById("nowcastIcon").src = "./player-play.png";
      document.getElementById("nowcastIcon").style.display = "";
      return;
    }

    if (!this.forecastDownloaded) {
      document.getElementById("nowcastIcon").style.display = "none";
      document.getElementById("nowcastLoading").style.display = "";
      this.downloadForecast(() => {
        document.getElementById("nowcastLoading").style.display = "none";
        document.getElementById("nowcastIcon").style.display = "";
        document.getElementById("nowcastIcon").src = "./player-pause.png";
        this.forecastDownloaded = true;
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
      // pause playback (toggle)
      this.removeForecast();
    }
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
    this.forecastLayers.forEach(function (layer) {
      if (layer) {
        this.map.removeLayer(layer);
        layer = false;
      }
    });
    this.hook("scriptHandler", "forecastInvalid");
  }

  setForecastLayer (num) {
    if (num === this.currentForecastNo) { return; }
    if (!this.forecastDownloaded) { return; }

    if (this.playInProgress()) {
      // this.map.removeLayer(this.mainLayer);
      this.smartDownloadAndPlay();
    }

    this.map.addLayer(this.forecastLayers[num]);
    this.map.removeLayer(this.forecastLayers[this.currentForecastNo]);
    this.currentForecastNo = num;
  }

  clear () {
    this.map.getLayers().forEach((layer) => {
      this.map.removeLayer(layer);
    });
  }

  // bring map back to a defined state, without touching the forecast stuff

  playForecast (e) {
    if (!this.forecastDownloaded) {
      console.log("not all forecasts downloaded yet");
      return;
    }

    if (this.currentForecastNo === this.forecastLayers.length - 1) {
      // we're past the last downloaded layer, so end the play
      this.map.addLayer(this.mainLayer);
      this.map.removeLayer(this.forecastLayers[this.currentForecastNo]["layer"]);
      this.currentForecastNo = -1;
      document.getElementById("nowcastIcon").src = "./player-play.png";
      document.getElementById("nowcastIcon").style.display = "";
      this.hook("scriptHandler", "playFinished");
      return;
    }

    if (this.currentForecastNo < 0) {
      // play not yet in progress, remove main layer
      this.map.removeLayer(this.mainLayer);
      this.hook("scriptHandler", "playStarted");
    } else {
      // remove previous layer
      this.map.removeLayer(this.forecastLayers[this.currentForecastNo]["layer"]);
    }
    this.currentForecastNo++;
    this.map.addLayer(this.forecastLayers[this.currentForecastNo]["layer"]);
    this.hook("layerTimeHandler", this.forecastLayers[this.currentForecastNo]["version"]);
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
            if (this.layersFinishedCounter === this.forecastLayers.length) {
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
