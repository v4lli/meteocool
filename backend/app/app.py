import eventlet
eventlet.monkey_patch()

import logging
import json
import os
import websocket
from pyproj import Proj, transform

from flask import Flask, request
from flask_socketio import SocketIO
from werkzeug.security import check_password_hash, generate_password_hash

logging.basicConfig(level=logging.WARN)

app = Flask(__name__)
socketio = SocketIO(app)

publish_token = generate_password_hash(os.getenv("MC_TOKEN"))


def update_all_clients(newTileJson):
    socketio.emit("map_update", newTileJson, namespace="/tile")


@app.route("/internal/publish_new_tileset", methods=["POST"])
def publish_tileset():
    data = request.get_json()

    try:
        token = request.args.get("token", "")
    except KeyError:
        logging.warn("no token supplied")
        return "GIEV TOKEN", 400

    if not check_password_hash(publish_token, token):
        logging.warn("authentication fail")
        return "AUTH FAIL! BYE", 401

    socketio.start_background_task(update_all_clients, data)
    logging.info("authentication success")
    return "OK"


@app.route("/")
def index():
    return "OK"


@socketio.on("connect", namespace="/tile")
def log_connection():
    logging.info("client connected")

def blitzortung_thread():
    """i connect to blitzortung.org and forward ligtnings to clients in my namespace"""

    logging.info("blitzortung thread init")

    def broadcast_lightning(data):
        if "lat" in data and "lon" in data:
            transformed = transform(Proj(init='epsg:4326'), Proj(init='epsg:3857'), data["lon"], data["lat"])
            socketio.emit("lightning", {"lat": transformed[1], "lon": transformed[0]}, namespace="/tile")
            print("Processed lightning")
        else:
            print("Invalid lightning: %s" % message)

    def on_message(ws, message):
        print("on_message")
        data = json.loads(message)
        socketio.start_background_task(broadcast_lightning, data)

    def on_error(ws, error):
        print("error:")
        print(error)

    def on_close(ws):
        print("### closed ###")

    def on_open(ws):
        ws.send(json.dumps({"west":  -20.0, "east":   44.0, "north":  71.5, "south":  23.1}))

    websocket.enableTrace(True)
    # XXX switch between all available servers like the webclient does!
    # XXX error handling
    ws = websocket.WebSocketApp("ws://ws.blitzortung.org:8059/",
                              on_message = on_message,
                              on_error = on_error,
                              on_open = on_open,
                              on_close = on_close)
    logging.info("blitzortung run forever")
    ws.run_forever()

eventlet.spawn(blitzortung_thread)

if __name__ == "__main__":
    logging.info("Starting meteocool backend app.py...")
    socketio.run(app, host="0.0.0.0")

# vim: set ts=4 sw=4 expandtab:
