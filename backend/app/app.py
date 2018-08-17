from threading import Lock


from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit, Namespace
import json

app = Flask(__name__)
app.config["SECRET_KEY"] = "lolCool22!"
app.debug = True
app.engineio_logger = True
socketio = SocketIO(app)

thread = None
thread_lock = Lock()

# flugzeug tilejson
fz = '{"name":"Aeronautical chart FAA","description":"","attribution":"","type":"overlay","version":"1","format":"png","minzoom":5,"maxzoom":11,"bounds":[-124.111656,32.028685,-116.924543,40.448629],"scale":"1","basename":"faa","profile":"mercator","tiles":["http://tileserver.maptiler.com/faa/{z}/{x}/{y}.png"],"tilejson":"2.0.0","scheme":"xyz","grids":["http://tileserver.maptiler.com/faa/{z}/{x}/{y}.grid.json"]}'
weather = '{"name":"Weather Underground","description":"","attribution":"","type":"overlay","version":"1","format":"png","minzoom":0,"maxzoom":6,"bounds":[-179.999941,-60.010742,179.993412,59.982],"scale":"1","basename":"weather","profile":"mercator","tiles":["http://tileserver.maptiler.com/weather/{z}/{x}/{y}.png"],"tilejson":"2.0.0","scheme":"xyz","grids":["http://tileserver.maptiler.com/weather/{z}/{x}/{y}.grid.json"]}'

def update_all_clients(*args):
    socketio.emit(
        "map_update",
        json.loads(fz),
        namespace="/tile",
    )

@app.route("/internal/publish_new_tileset", methods = ['POST'])
def publish_tileset():
    global thread
    with thread_lock:
        thread = socketio.start_background_task(target=background_thread, args=())
    return "OK"

@app.route("/")
def index():
    return "OK"

@socketio.on("connect", namespace="/tile")
def log_connection():
    print("Client connected")
    # XXX improve logging


if __name__ == "__main__":
    print("Started app.py")
    socketio.run(app, host='0.0.0.0')
