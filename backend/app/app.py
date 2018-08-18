import logging
import json
import os

from flask import Flask, request
from flask_socketio import SocketIO

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("MC_KEY", "plxRemoveMe!")
socketio = SocketIO(app)

publish_token = os.getenv("MC_TOKEN", "1234")

# flugzeug tilejson
fz = '{"name":"Aeronautical chart FAA","description":"","attribution":"","type":"overlay","version":"1","format":"png","minzoom":5,"maxzoom":11,"bounds":[-124.111656,32.028685,-116.924543,40.448629],"scale":"1","basename":"faa","profile":"mercator","tiles":["http://tileserver.maptiler.com/faa/{z}/{x}/{y}.png"],"tilejson":"2.0.0","scheme":"xyz","grids":["http://tileserver.maptiler.com/faa/{z}/{x}/{y}.grid.json"]}'
weather = '{"name":"Weather Underground","description":"","attribution":"","type":"overlay","version":"1","format":"png","minzoom":0,"maxzoom":6,"bounds":[-179.999941,-60.010742,179.993412,59.982],"scale":"1","basename":"weather","profile":"mercator","tiles":["http://tileserver.maptiler.com/weather/{z}/{x}/{y}.png"],"tilejson":"2.0.0","scheme":"xyz","grids":["http://tileserver.maptiler.com/weather/{z}/{x}/{y}.grid.json"]}'


def update_all_clients(newTileJson):
    socketio.emit("map_update", newTileJson, namespace="/tile")


@app.route("/internal/publish_new_tileset", methods=["POST"])
def publish_tileset():
    data = request.get_json()

    try:
        data["token"]
    except KeyError:
        return "GIEV TOKEN", 400

    if publish_token != data["token"]:
        return "BYE", 401

    socketio.start_background_task(update_all_clients, data)
    return "THANKS"


@app.route("/")
def index():
    return "OK"


@app.route("/test1")
def index_test():
    socketio.start_background_task(update_all_clients, json.loads(fz))
    return "OK"


@app.route("/test2")
def index_test2():
    socketio.start_background_task(update_all_clients, json.loads(weather))
    return "OK"


@socketio.on("connect", namespace="/tile")
def log_connection():
    logging.info("client connected")


if __name__ == "__main__":
    logging.info("Starting meteocool backend app.py...")
    socketio.run(app, host="0.0.0.0")
