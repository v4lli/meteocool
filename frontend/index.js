import 'ol/ol.css';

import CircleStyle from 'ol/style/Circle';
import OSM from 'ol/source/OSM';
import Point from 'ol/geom/Point';
import TileJSON from 'ol/source/TileJSON.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import io from 'socket.io-client';
import {Map, View, Geolocation, Feature} from 'ol';
import {defaults as defaultControls, OverviewMap} from 'ol/control.js';
import Control from 'ol/control/Control';
import {Style, Fill, Stroke} from 'ol/style';
import {fromLonLat} from 'ol/proj.js';

var view = new View({
  center: fromLonLat([10.447683, 51.163375]),
  zoom: 6,
  minzoom: 5
});

const map = new Map({
	target: 'map',
	layers: [
		new TileLayer({
			source: new OSM()
		})
  ],
  controls: defaultControls().extend([
    new OverviewMap()
  ]),
	view: view,
});

var geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true
  },
  projection: view.getProjection()
});

geolocation.setTracking(true);

// handle geolocation error.
geolocation.on('error', function(error) {
  console.log('could not get location data, doing nothing like it\'s 1990');
});

var accuracyFeature = new Feature();
geolocation.on('change:accuracyGeometry', function() {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  // stop annoying the user after a short time
  //setTimeout(function() {geolocation.on('change:accuracyGeometry', null);}, 1500);
});

var positionFeature = new Feature();
positionFeature.setStyle(new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: '#3399CC'
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

var haveZoomed = false;
geolocation.on('change:position', function() {
	var coordinates = geolocation.getPosition();
	positionFeature.setGeometry(coordinates ?  new Point(coordinates) : null);
	if (!haveZoomed) {
		map.getView().animate({center: coordinates, zoom: 10});
		haveZoomed = true;
	}
});

new VectorLayer({
  map: map,
  source: new VectorSource({
    features: [accuracyFeature, positionFeature]
  })
});


if (process.env.NODE_ENV === 'production') {
	var tileUrl = 'https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json';
	var websocketUrl = 'https://unimplemented.org/tile';
} else {
	var tileUrl = 'http://localhost:8070/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json';
	var websocketUrl = 'http://localhost:8071/tile';
}

var reflectivityOpacity = 0.85;

var currentLayer = new TileLayer({
			source: new TileJSON({
				url: tileUrl,
				crossOrigin: 'anonymous'
			}),
			opacity: reflectivityOpacity
		});
map.addLayer(currentLayer);
// we can now later call removeLayer(currentLayer), then update it with the new
// tilesource and then call addLayer again.
const socket = io.connect(websocketUrl);

socket.on('connect', () => console.log('websocket connected'));
socket.on('map_update', function(data){
	console.log(data);
	var newLayer = new TileLayer({
			source: new TileJSON({
				tileJSON: data,
				crossOrigin: 'anonymous'
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
var button = document.createElement('button');
button.innerHTML = 'L';
var locateMe = function(e) {
    var coordinates = geolocation.getPosition();
    map.getView().animate({center: coordinates, zoom: 10});
};
button.addEventListener('click', locateMe, false);
var element = document.createElement('div');
element.className = 'locate-me ol-unselectable ol-control';
element.appendChild(button);
var locateControl = new Control({
    element: element
});
map.addControl(locateControl);
