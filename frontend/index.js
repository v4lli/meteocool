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


if (process.env.NODE_ENV === 'production') {
	// XXX das ist nicht die production url. dieser layer ist ueber californien, irgendeine flugzeugmap...
	var tileUrl = 'https://a.tileserver.unimplemented.org/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json';
	var websocketUrl = 'https://unimplemented.org/tile';
} else {
	var tileUrl = 'http://localhost:8070/data/raa01-wx_10000-latest-dwd-wgs84_transformed.json';
	var websocketUrl = 'http://localhost:8071/tile';
}

var currentLayer = new TileLayer({
			source: new TileJSON({
				url: tileUrl,
				crossOrigin: 'anonymous'
			})
		});
map.addLayer(currentLayer);
// we can now later call removeLayer(currentLayer), then update it with the new
// tilesource and then call addLayer again.
const socket = io.connect(websocketUrl);

socket.on('connect', () => console.log('user connected'));
socket.on('map_update', function(data){
	console.log(data);
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
