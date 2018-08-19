import logging
import json
import os

from flask import Flask, request
from flask_socketio import SocketIO
from werkzeug.security import check_password_hash, generate_password_hash

logging.basicConfig(level=logging.INFO)

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
        return "GIEV TOKEN", 400

    if not check_password_hash(publish_token, token):
        logging.info("authentication fail")
        return "BYE", 401

    socketio.start_background_task(update_all_clients, data)
    logging.info("authentication success")
    return "THANKS"


@app.route("/")
def index():
    return "OK"


@socketio.on("connect", namespace="/tile")
def log_connection():
    logging.info("client connected")


if __name__ == "__main__":
    logging.info("Starting meteocool backend app.py...")
    socketio.run(app, host="0.0.0.0")
