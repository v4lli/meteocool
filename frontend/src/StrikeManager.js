import Point from "ol/geom/Point";
import { Feature } from "ol";

export class StrikeManager {
  constructor (maxStrikes, vectorSource) {
    this.maxStrikes = maxStrikes;
    this.vs = vectorSource;
    this.strikes = [];
  }

  addStrike (lon, lat) {
    this.addStrikeWithTime(lon, lat, new Date().getTime());
  }

  addStrikeWithTime (lon, lat, time) {
    var lightning = new Feature(new Point([lon, lat]));
    lightning.setId(time);
    this.strikes.push(lightning.getId());
    if (this.strikes.length > this.maxStrikes) {
      var toRemove = this.strikes.shift();
      this.vs.removeFeature(this.vs.getFeatureById(toRemove));
    }
    this.vs.addFeature(lightning);
  }

  // purge old strikes
  fadeStrikes () {
    let now = new Date().getTime();
    let MINS = 60 * 1000;
    this.strikes.forEach((id, idx) => {
      if (id < now - 30 * MINS) {
        this.vs.removeFeature(this.vs.getFeatureById(id));
        this.strikes = this.strikes.slice(0, idx).concat(this.strikes.slice(idx + 1, this.strikes.length));
      }
    });
    this.vs.refresh();
  }

  clearAll () {
    this.strikes = [];
    this.vs.clear();
  }
};

/* vim: set ts=2 sw=2 expandtab: */
