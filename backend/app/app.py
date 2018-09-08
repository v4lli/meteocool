import logging
import json
import os

from flask import Flask, request
from flask_socketio import SocketIO

logging.basicConfig(level=logging.WARN)

app = Flask(__name__)
socketio = SocketIO(app)


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


@socketio.on("connect", namespace="/tile")
def log_connection():
    logging.info("client connected")


if __name__ == "__main__":
    logging.info("Starting meteocool backend app.py...")
    socketio.run(app, host="0.0.0.0")
