import 'ol/ol.css';

import MVT from 'ol/format/MVT.js';
import OSM from 'ol/source/OSM';
import {fromLonLat} from 'ol/proj.js';
import TileJSON from 'ol/source/TileJSON.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile.js';
import {Map, View,LonLat,Projection} from 'ol';

const map = new Map({
	target: 'map',
	layers: [
		new TileLayer({
			source: new OSM()
		}),
		new TileLayer({
			source: new TileJSON({
				url: 'https://unimplemented.org/meteocool/tileserver/raa01-wx_10000-latest-dwd-wgs84_transformed.json',
				crossOrigin: 'anonymous'
			})
		})

	],
	view: new View({
		center: fromLonLat([8.23, 46.86]),
		zoom: 7,
		minzoom: 5
	})
});
