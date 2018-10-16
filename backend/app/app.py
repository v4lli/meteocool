import datetime
import eventlet

eventlet.monkey_patch()

import logging
import json
import websocket
import threading
from pyproj import Proj, transform
from pymongo import MongoClient
import random

from flask import Flask, request, jsonify
from flask_socketio import SocketIO

logging.basicConfig(level=logging.WARN)

app = Flask(__name__)
socketio = SocketIO(app)

db_client = MongoClient("mongodb://mongo:27017/")
# both will be created automatically when the first document is inserted
db = db_client["meteocool"]
collection = db["collection"]

# Background thread started by the internal API endpoint, triggered
# by the dwd backend container. newTileJson needs to be a valid
# tileJSON structure.
def update_all_clients(newTileJson):
    socketio.emit("map_update", newTileJson, namespace="/tile")

# Internal API endpoint, triggered by the dwd backend container.
@app.route("/internal/publish_new_tileset", methods=["POST"])
def publish_tileset():
    data = request.get_json()
    if data:
        socketio.start_background_task(update_all_clients, data)
        return "OK"
    else:
        return "ERROR"

# Public API endpoint, used by mobile devies and browsers to
# register notification requests for incoming rain. Expects a
# JSON dict containing the following keys:
#  - lat: float
#  - lon: float
#  - source: string - "ios" or "browser"
#  - token: string - for source=browser, a random identifier
#    used by the push-handling backend to associate a websocket
#    connection with a rain notification. for source=ios, a valid
#    APNS push token.
@app.route("/post_location", methods=["POST"])
def post_location():
    data = request.get_json()

    if not data:
        return jsonify(success=False, message="bad request")

    try:
        lat = data["lat"]
        lon = data["lon"]
        source = data["source"]
        token = data["token"]
        accuracy = data["accuracy"]
    except KeyError:
        return jsonify(success=False, message="bad request, missing keys")
    else:
        if not isinstance(lat, float) or not isinstance(lon, float):
            return jsonify(success=False, message="bad lat/lon")
        if not isinstance(accuracy, float):
            return jsonify(success=False, message="invalid accuracy")
        if source != "browser" and source != "ios":
            return jsonify(success=False, message="bad source")
        if not isinstance(token, str) or len(token) > 128 or len(token) < 32:
            return jsonify(success=False, message="bad token")

        data = {
            "lat": lat,
            "lon": lon,
            "accuracy": accuracy,
            "last_updated": datetime.datetime.utcnow(),
            "dbz": 42,
            "source": source,
            "token": token
        }

        geolocation = db.collection
        post_location = geolocation.insert_one(data).inserted_id

    return jsonify(success=True)


# Executed when a new websocket client connects. Currently no-op.
@socketio.on("connect", namespace="/tile")
def log_connection():
    logging.info("client connected")


numStrikes = 0
failStrikes = 0


def blitzortung_thread():
    """i connect to blitzortung.org and forward ligtnings to clients in my namespace"""

    def broadcast_lightning(data):
        # XXX does this need a lock in python?
        global numStrikes
        global failStrikes
        if "lat" in data and "lon" in data:
            numStrikes = numStrikes + 1
            transformed = transform(
                Proj(init="epsg:4326"), Proj(init="epsg:3857"), data["lon"], data["lat"]
            )
            socketio.emit(
                "lightning",
                {"lat": transformed[1], "lon": transformed[0]},
                namespace="/tile",
            )
        else:
            failStrikes = failStrikes + 1
            # print("Invalid lightning: %s" % message)

    def on_message(ws, message):
        data = json.loads(message)
        if "timeout" in data:
            logging.warn("Got timeout event from upstream, closing")
            ws.close()

        socketio.start_background_task(broadcast_lightning, data)

    def getAndResetStrikes():
        global numStrikes
        result = numStrikes
        numStrikes = 0
        return result

    def getAndResetFailStrikes():
        global failStrikes
        result = failStrikes
        failStrikes = 0
        return result

    def on_error(ws, error):
        print("error:")
        print(error)
        ws.close()

    def on_close(ws):
        print("### closed ###")

    def on_open(ws):
        ws.send(json.dumps({"west": -20.0, "east": 44.0, "north": 71.5, "south": 23.1}))

    def stats_logging_cb():
        logging.warn(
            "Processed %d strikes since last report (%d failed)"
            % (getAndResetStrikes(), getAndResetFailStrikes())
        )
        threading.Timer(10, stats_logging_cb).start()

    logging.warn("blitzortung thread init")
    websocket.enableTrace(True)
    threading.Timer(5 * 60, stats_logging_cb).start()

    while True:
        # XXX error handling
        tgtServer = "ws://ws.blitzortung.org:80%d/" % (random.randint(50, 90))
        logging.info("blitzortung-thread: Connecting to %s..." % tgtServer)
        ws = websocket.WebSocketApp(
            tgtServer,
            on_message=on_message,
            on_error=on_error,
            on_open=on_open,
            on_close=on_close,
        )
        logging.warn("blitzortung-thread: Entering main loop")
        ws.run_forever()


eventlet.spawn(blitzortung_thread)

if __name__ == "__main__":
    logging.warn("Starting meteocool backend app.py...")
    socketio.run(app, host="0.0.0.0")

# vim: set ts=4 sw=4 expandtab:
