import Point from "ol/geom/Point";
import { Feature } from "ol";

export class StrikeManager {
  constructor (maxStrikes, vectorSource) {
    this.maxStrikes = maxStrikes;
    this.vs = vectorSource;
    this.strikes = [];
    this.enabled = true;
  }

  addStrike (lon, lat) {
    return this.addStrikeWithTime(lon, lat, new Date().getTime());
  }

  removeOne (id, idx) {
    let remove = this.vs.getFeatureById(id);
    if (remove) {
      this.vs.removeFeature(remove);
    }
    if (idx !== -1) {
      this.strikes = this.strikes.slice(0, idx).concat(this.strikes.slice(idx + 1, this.strikes.length));
    }
  }

  addStrikeWithTime (lon, lat, time) {
    if (!this.enabled)
      return false;
    var lightning = new Feature(new Point([lon, lat]));
    lightning.setId(time);
    this.strikes.push(lightning.getId());
    if (this.strikes.length > this.maxStrikes) {
      var toRemove = this.strikes.shift();
      this.removeOne(toRemove, -1);
    }
    return this.vs.addFeature(lightning);
  }

  // purge old strikes
  fadeStrikes () {
    let now = new Date().getTime();
    let MINS = 60 * 1000;
    this.strikes.forEach((id, idx) => {
      if (id < now - 30 * MINS) {
        this.removeOne(id, idx);
      }
    });
    this.vs.refresh();
  }

  clearAll () {
    this.strikes = [];
    this.vs.clear();
  }

  debug () {
    console.log(this.strikes);
    console.log(this.vs.getFeatures());
  }

  enable(state) {
    if (!state)
      this.clearAll();
    this.enabled = state;
  }
};

/* vim: set ts=2 sw=2 expandtab: */
