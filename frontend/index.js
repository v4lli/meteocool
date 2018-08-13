import 'ol/ol.css';

import OSM from 'ol/source/OSM';
import {fromLonLat} from 'ol/proj.js';
import TileJSON from 'ol/source/TileJSON.js';
import TileLayer from 'ol/layer/Tile.js';
import {Map, View} from 'ol';
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
map.addLayer(currentLayer);
// we can now later call removeLayer(currentLayer), then update it with the new
// tilesource and then call addLayer again.
const socket = io.connect('http://localhost:5000/tile');

socket.on('connect', () => console.log('user connected'));
socket.on('map_update', (msg) => console.log(msg))

socket.on('message', function(data){
	var newLayer = new TileLayer({
			source: new TileJSON({
				tileJSON: data,
				crossOrigin: 'anonymous'
			})
		});
	// first add & fetch the new layer, then remove the old one to avoid
	// having no layer at all at some point.
	map.addLayer(newLayer);
	map.removeLayer(currentLayer);
	currentLayer = newLayer;
});
