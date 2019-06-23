import Point from "ol/geom/Point";
import { Feature } from "ol";
import { Fill, Stroke, Style, Text, Circle } from "ol/style";

export class StrikeManager {
  constructor (maxStrikes, vectorSource) {
    this.maxStrikes = maxStrikes;
    this.vs = vectorSource;
    this.strikes = [];
  }

  addStrike (lon, lat) {
    var lightning = new Feature(new Point([lon, lat]));
    lightning.setId(new Date().getTime());
    this.strikes.push(lightning.getId());
    if (this.strikes.length > this.maxStrikes) {
      var toRemove = this.strikes.shift();
      this.vs.removeFeature(this.vs.getFeatureById(toRemove));
    }
    this.vs.addFeature(lightning);
  }

  // purge old strikes
  fadeStrikes() {
    let now = new Date().getTime();
    let MINS = 60*1000;
    this.strikes.forEach((id, idx) => {
      if (id < now - 59*MINS) {
        this.vs.removeFeature(this.vs.getFeatureById(id));
        this.strikes = this.strikes.slice(0, idx).concat(this.strikes.slice(idx + 1, this.strikes.length))
      }
    });
    this.vs.refresh();
  }
};

/* vim: set ts=2 sw=2 expandtab: */
