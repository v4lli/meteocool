import Point from "ol/geom/Point";
import { Feature } from "ol";

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
};
