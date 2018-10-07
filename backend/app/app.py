import datetime
import eventlet

eventlet.monkey_patch()

import logging
import time
import json
import os
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

# this doesn't work, WTF....
# mongo db conn
#dbconn = os.getenv("DB_CONN", default="mongodb://mongo:27017/")
#print(dbconn)
#print(type(dbconn))
dbconn = "mongodb://mongo:27017/"
db_client = MongoClient(dbconn)
# both will be created automatically when the first document is inserted
db = db_client["meteocool"]
collection = db["collection"]


def update_all_clients(newTileJson):
    socketio.emit("map_update", newTileJson, namespace="/tile")


@app.route("/internal/publish_new_tileset", methods=["POST"])
def publish_tileset():
    data = request.get_json()
    socketio.start_background_task(update_all_clients, data)
    return "OK"


@app.route("/")
def index():
    return "OK"


@app.route("/post_location", methods=["POST"])
def post_location():
    data = request.get_json()

    if not data:
        return jsonify(success=False, message="bad request")

    try:
        uuid = data["uuid"]
        latitude = data["lat"]
        longitude = data["lon"]
        source = data["source"]
    except KeyError:
        return jsonify(success=False, message="bad request")
    else:
        if source != "browser" and source != "ios":
            return jsonify(success=False, message="bad request")

        # XXX sanity check all other values as well!!!

        data = {
            "uuid": uuid,
            "lat": latitude,
            "lon": longitude,
            "last_updated": datetime.datetime.utcnow(),
            "dbz": 42,
            "source": source
        }

        geolocation = db.collection
        post_location = geolocation.insert_one(data).inserted_id

    return jsonify(success=True)


@socketio.on("connect", namespace="/tile")
def log_connection():
    logging.info("client connected")


numStrikes = 0
failStrikes = 0


def blitzortung_thread():
    """i connect to blitzortung.org and forward ligtnings to clients in my namespace"""

    logging.warn("blitzortung thread init")

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

    def foo():
        logging.warn(
            "Processed %d strikes since last report (%d failed)"
            % (getAndResetStrikes(), getAndResetFailStrikes())
        )
        threading.Timer(10, foo).start()

    websocket.enableTrace(True)
    logging.warn("start timer")
    threading.Timer(5 * 60, foo).start()

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
