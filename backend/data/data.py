import json
import logging
import random
import threading
import time

from aiohttp import web

import websocket
from pyproj import Proj, transform
from flask_socketio import SocketIO

logging.basicConfig(level=logging.WARN, format='%(asctime)s %(levelname)s %(message)s')

# Executed when a new websocket client connects. Currently no-op.
#@socketio.on("getStrikes", namespace="/tile")
#def sendStrikes(p):
#    logging.warn("sendStrikes because of getStrikes")
#    socketio.emit("bulkStrikes", strikeCache, namespace="/tile", room=request.sid)

class SocketIOWrapper:
    def __init__(self, socketio):
        self.socketio = socketio

    def broadcast(self, event, data):
        self.socketio.emit(event, data, namespace="/tile")

    def reply(self, sid, event, data):
        self.socketio.emit(event, data, namespace="/tile", room=sid)

class Blitzortung(SocketIOWrapper, threading.Thread):
    """i connect to blitzortung.org and forward ligtnings to clients in my namespace"""
    def __init__(self, socketio, lightning_cache_max):
        SocketIOWrapper.__init__(self, socketio)
        threading.Thread.__init__(self)
        self.max_lightning_cache = lightning_cache_max
        self.numStrikes = 0
        self.failStrikes = 0
        self.strikeCache = []

    def on_message(self, ws, message):
        data = json.loads(message)
        if "timeout" in data:
            logging.warn("Got timeout event from upstream, closing")
            ws.close()
            return

        if "lat" in data and "lon" in data:
            self.numStrikes += 1
            transformed = transform(Proj(init="epsg:4326"),
                    Proj(init="epsg:3857"), data["lon"], data["lat"])

            alt = -1
            pol = 0
            try:
                alt = data["alt"]
                pol = data["pol"]
                time = data["time"]
            except KeyError:
                pass

            strikeData = {
               "lat": transformed[1],
               "lon": transformed[0],
               "alt": alt,
               "pol": pol,
               "time": time
            }

            if len(self.strikeCache) >= self.max_lightning_cache:
                self.strikeCache.pop(0)
            self.strikeCache.append(strikeData)
            logging.warn("lightning")
        else:
            self.failStrikes += 1

    def getAndResetStrikes(self):
        result = self.numStrikes
        self.numStrikes = 0
        return result

    def getAndResetFailStrikes(self):
        result = self.failStrikes
        self.failStrikes = 0
        return result

    def on_error(self, ws, error):
        logging.error("ws error: %s" % error)
        ws.close()

    def on_close(self, ws):
        logging.error("ws closed.")

    def on_open(self, ws):
        ws.send(json.dumps({
            "west": 2.0,
            "east": 18.0,
            "north": 55.5,
            "south": 26.5}))

    def stats_logging_cb(self, init=False):
        def strike_outdated(s):
            if s["time"]/1000/1000/1000 < time.time() - 50*60:
                return True
            else:
                return False

        if not init:
            oldlen = len(self.strikeCache)
            self.strikeCache[:] = [s for s in self.strikeCache if not strike_outdated(s)]
            logging.warn("Processed %d strikes since last report (%d failed). Removed %d from cache. New size: %d"
                % (self.getAndResetStrikes(), self.getAndResetFailStrikes(), oldlen - len(self.strikeCache), len(self.strikeCache)))
        threading.Timer(1*60, self.stats_logging_cb).start()

    def run(self):
        logging.warn("blitzortung thread init")
        self.stats_logging_cb(init=True)
        while True:
            tgtServer = "ws://ws.blitzortung.org:80%d/" % (random.randint(50, 90))
            logging.warn("blitzortung-thread: Connecting to %s..." % tgtServer)
            time.sleep(3)
            ws = websocket.WebSocketApp(
                tgtServer,
                on_message=self.on_message,
                on_error=self.on_error,
                on_open=self.on_open,
                on_close=self.on_close,
            )
            logging.warn("blitzortung-thread: Entering main loop")
            ws.run_forever()

async def lightning_cache(data, request):
    return web.json_response(data)

if __name__ == "__main__":
    socketio = SocketIO(message_queue='amqp://mq')
    blitzortung = Blitzortung(socketio, 1000)
    blitzortung.start()

    server = web.Application()
    async def handle(request):
        return await lightning_cache(blitzortung.strikeCache, request)
    server.add_routes([web.get('/lightning_cache', handle)])
    web.run_app(server, port=5000)


# vim: set ts=4 sw=4 expandtab:
