import eventlet
eventlet.monkey_patch()

import datetime
import json
import logging
import random
import threading
import uuid

import websocket
from pymongo import MongoClient
from pyproj import Proj, transform
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
import geopy.distance

logging.basicConfig(level=logging.WARN, format='%(asctime)s %(levelname)s %(message)s')

app = Flask(__name__)
socketio = SocketIO(app, async_mode='threading')

db_client = MongoClient("mongodb://mongo:27017/")
# both will be created automatically when the first document is inserted
db = db_client["meteocool"]
collection = db["collection"]
pressure = db["pressure"]

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

# Public API endpoint, used by the iOS app to notify the backend about an
# acknowledged notification.
@app.route("/clear_notification", methods=["POST"])
def clear_notification():
    data = request.get_json()
    token = None
    if data:
        try:
            token = data["token"]
        except KeyError:
            logging.warn("Invalid request: %s", str(data))
            return jsonify(success=False, message="bad request, missing keys")
        if not isinstance(token, str) or len(token) > 128 or len(token) < 32:
            logging.warn("Invalid request: %s", str(data))
            return jsonify(success=False, message="bad token")

        obj = db.collection.find_one({"token": str(token)})
        if not obj or not "_id" in obj:
            logging.warn("Token %s not found in db", str(token))
            return jsonify(success=False)
        db.collection.update_one({"_id": obj["_id"]}, {"$set": {"ios_onscreen": False}})
        logging.warn("Updated session for %s", str(data))
    return jsonify(success=True)


# Public API endpoint, used by mobile devies and browsers to
# register notification requests for incoming rain. Expects a
# JSON dict containing the following keys:
#  - lat: float
#  - lon: float
#  - ahead: int - look n minutes into the future (5 minute steps, max=60)
#  - source: string - "ios" or "browser"
#  - token: string - for source=browser, a random identifier
#    used by the push-handling backend to associate a websocket
#    connection with a rain notification. for source=ios, a valid
#    APNS push token.
@app.route("/post_location", methods=["POST"])
def post_location():
    return save_location_to_backend(request.get_json())

def save_location_to_backend(data):
    if not data:
        return jsonify(success=False, message="bad request")

    try:
        lat = data["lat"]
        lon = data["lon"]
        source = data["source"]
        ahead = data["ahead"]
        intensity = data["intensity"]
        token = data["token"]
        accuracy = data["accuracy"]
    except KeyError:
        logging.warn("Bad request, missing keys: %s" % data)
        return jsonify(success=False, message="bad request, missing keys")
    else:
        if not isinstance(lat, float) or not isinstance(lon, float):
            logging.warn("Bad request, invalid key(s): %s" % data)
            return jsonify(success=False, message="bad lat/lon")
        if not isinstance(accuracy, float) and not isinstance(accuracy, int):
            logging.warn("Bad request, invalid key(s): %s" % data)
            return jsonify(success=False, message="invalid accuracy")
        if source != "browser" and source != "ios":
            logging.warn("Bad request, invalid key(s): %s" % data)
            return jsonify(success=False, message="bad source")
        if not isinstance(token, str) or len(token) > 128 or len(token) < 32:
            if token != "anon":
                logging.warn("Bad request, invalid key(s): %s" % data)
                return jsonify(success=False, message="bad token")
        if not isinstance(ahead, int) or ahead < 0 or ahead > 60:
            logging.warn("Bad request, invalid key(s): %s" % data)
            return jsonify(success=False, message="invalid ahead value")
        if not isinstance(intensity, int) or intensity < 0 or intensity > 130:
            logging.warn("Bad request, invalid key(s): %s" % data)
            return jsonify(success=False, message="invalid intensity value")

        ## TRAVEL MODE
        # get current speed as reported by the device
        try:
            speed = data["speed"]
        except KeyError:
            speed = 0
        if not isinstance(speed, float) and not isinstance(speed, int):
            logging.warn("Invalid speed value: %s" % data)
            return jsonify(success=False, message="invalid speed value")
        # get last speed and last updated time
        obj = db.collection.find_one({"token": str(token)})
        last_speed = -1
        last_time = datetime.datetime.utcnow()
        last_time = None
        last_latlon = None
        if not obj or not "_id" in obj:
            logging.warn("Token %s not found in db", str(token))
        else:
            try:
                last_speed = obj["travelmode_speed"]
                last_time = obj["last_updated"]
                last_latlon = (obj["lat"], obj["lon"])
            except KeyError:
                logging.warn("No travelmode for client")
                last_speed = -1
                pass

        def calculate_travelspeed(last_time, last_latlon, current_speed, current_latlon):
            # If the client reports a value and we have none, takt the one from
            # the client.
            ret_speed = 0
            if not current_latlon or not last_latlon:
                if current_speed >= 0:
                    ret_speed = current_speed
                logging.warn("unable to interpolate speed, using client reported=%d" % current_speed)
            else:
                if last_latlon:
                    # based on the last update and the last update's timestamp,
                    # we can calculate an average speed between the old location
                    # and the new one.
                    km_dist = geopy.distance.vincenty((last_latlon[0], last_latlon[1]), (current_latlon[0], current_latlon[1])).km
                    h_diff = (datetime.datetime.utcnow()-last_time).total_seconds()/3600
                    ret_speed = km_dist/h_diff
                    logging.warn("DISTNACE between %f/%f and %f/%f in %d seconds: %f" % (last_latlon[0],
                        last_latlon[1], current_latlon[0], current_latlon[1],
                        (datetime.datetime.utcnow()-last_time).total_seconds(), ret_speed))
                else:
                    # well we're fucked now
                    pass

            # XXX accuracy is totally ignored still
            return ret_speed, -1

        travelmode_speed, travelmode_accuracy = calculate_travelspeed(last_time, last_latlon, speed, (lat, lon))

        # XXX this will override ios_onscreen! FIXME ... or not?
        insert_data = {
            "lat": lat,
            "lon": lon,
            "accuracy": accuracy,
            "intensity": intensity,
            "ahead": ahead,
            "last_updated": datetime.datetime.utcnow(),
            "last_push": datetime.datetime.utcfromtimestamp(0),
            "ios_onscreen": False,
            "travelmode_speed": travelmode_speed,
            "travelmode_accuracy": travelmode_accuracy,
            "source": source,
            "token": token
        }
        key = {"token": token}
        if token != "anon":
            db.collection.update(key, insert_data, upsert=True)
            logging.warn("inserted new client data: %s" % insert_data)

    try:
        altitude = data["altitude"]
        verticalAccuracy = data["verticalAccuracy"]
        pressure = data["pressure"]
        timestamp = data["timestamp"]
        # lat + lon + accuracy already processed above
    except KeyError as e:
        logging.warn("request does not include barometric parameters: %s" % e)
    else:
        invalidKey = None
        if not isinstance(altitude, float):
            invalidKey = "altitude"
        if not isinstance(verticalAccuracy, int) and not isinstance(verticalAccuracy, float):
            invalidKey = "verticalAccuracy"
        if not isinstance(pressure, float):
            invalidKey = "pressure"
        if not isinstance(timestamp, float):
            if isinstance(timestamp, int):
                timestamp = float(timestamp)
            else:
                invalidKey = "timestamp"

        if invalidKey:
            logging.warn("Bad request, invalid values for non-omitted key(s): %s - %s" % (invalidKey, data))
            return jsonify(success=False, message="invalid non-omitted value %s" % invalidKey)

        device_str = source
        if "device" in data:
            if isinstance(data["device"], str) and len(data["device"]) < 128 and len(data["device"]) > 0:
                device_str = data["device"]

        pressure_data = {
            "lat": lat,
            "lon": lon,
            "altitude": altitude,
            "verticalAccuracy": float(verticalAccuracy),
            "pressure": pressure,
            "receivedTimestamp": datetime.datetime.utcnow(),
            "device": device_str,
            "deviceTimestamp": timestamp
        }
        db.pressure.insert(pressure_data)
        logging.warn("inserted new barometric data: %s" % pressure_data)

    return jsonify(success=True)


# Executed when a new websocket client connects. Currently no-op.
@socketio.on("connect", namespace="/tile")
def log_connection():
    logging.warn("client connected")

# Called by the browser to register push notifications
pushable_browsers = []

@socketio.on("register", namespace="/rain_notify_browser")
def register_browser_push(json):
    global pushable_browsers
    rand_uuid = str(uuid.uuid4())

    pushable_browsers.append({"sid": request.sid, "uuid": rand_uuid})

    logging.warn("registering browser push: %s" % str(json))

    ret = save_location_to_backend({
        "lat": json["lat"],
        "lon": json["lon"],
        "ahead": json["ahead"],
        "accuracy": 1.0,
        "intensity": json["intensity"],
        "source": "browser",
        "token": rand_uuid})
    logging.warn(ret.data)
    return ret

# Called by the browser to register push notifications
@socketio.on("unregister", namespace="/rain_notify_browser")
def register_browser_push(json):
    # XXX implement me
    logging.warn("UNregistering browser push: %s" % str(json))

@app.route("/internal/trigger_browser_notification", methods=["POST"])
def trigger_browser_notification():
    data = request.get_json()

    for browser in pushable_browsers:
        if data["token"] == browser["uuid"]:
            # XXX we need some kind of feedback from socketio here.
            # if the notification can't be delivered, it needs to be removed from the database
            # (like in push.py)
            socketio.emit("notify", {
                "title": ("Rain expected in %d minutes!" % data["ahead"]),
                "body": ("DWD reports that it might rain at your current location in about %d minutes." % data["ahead"])
            }, room=browser["sid"])

    return jsonify(success=True)

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
        ws.send(json.dumps({
            "west": -20.0,
            "east": 44.0,
            "north": 71.5,
            "south": 23.1}))

    def stats_logging_cb():
        logging.warn("Processed %d strikes since last report (%d failed)"
            % (getAndResetStrikes(), getAndResetFailStrikes()))
        threading.Timer(5*60, stats_logging_cb).start()

    logging.warn("blitzortung thread init")
    websocket.enableTrace(True)
    stats_logging_cb()

    while True:
        # XXX error handling
        tgtServer = "ws://ws.blitzortung.org:80%d/" % (random.randint(50, 90))
        logging.warn("blitzortung-thread: Connecting to %s..." % tgtServer)
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
