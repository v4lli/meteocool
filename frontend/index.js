import 'ol/ol.css';

import MVT from 'ol/format/MVT.js';
import OSM from 'ol/source/OSM';
import {fromLonLat} from 'ol/proj.js';
import TileJSON from 'ol/source/TileJSON.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile.js';
import {Map, View,LonLat,Projection} from 'ol';
import io from 'socket.io-client';

const map = new Map({
	target: 'map',
	layers: [
		new TileLayer({
			source: new OSM()
		}),

	],
	view: new View({
		center: fromLonLat([8.23, 46.86]),
		zoom: 7,
		minzoom: 5
	})
});

var currentLayer = new TileLayer({
			source: new TileJSON({
				url: 'http://tileserver.maptiler.com/faa.json',
				crossOrigin: 'anonymous'
			})
		});
// we can now later call removeLayer(currentLayer), then update it with the new
// tilesource and then call addLayer again.

var socket = require('socket.io-client')('http://localhost:8080/');
socket.on('event', function(data){
	var newLayer = new TileLayer({
			source: new TileJSON({
				url: data["newTileUrl"],
				crossOrigin: 'anonymous'
			})
		});
	// first add & fetch the new layer, then remove the old one to avoid
	// having no layer at all at some point.
	map.addLayer(newLayer);
	map.removeLayer(currentLayer);
	currentLayer = newLayer;
});
