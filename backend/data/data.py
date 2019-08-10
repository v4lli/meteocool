import json
import logging
import random
import threading
import time
from datetime import timezone
import datetime
from xml.etree import ElementTree
from xml.etree.ElementTree import ParseError

import asyncio
from aiohttp import web

import websocket
from pyproj import Proj, transform
from flask_socketio import SocketIO
import requests

logging.basicConfig(level=logging.WARN, format='%(asctime)s %(levelname)s %(message)s')

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
                time = data["time"]
                pol = data["pol"]
                alt = data["alt"]
            except KeyError:
                pass

            if pol != 0:
                logging.warn("Seen non-zero polarity")

            strikeData = {
               "lat": transformed[1],
               "lon": transformed[0],
               "time": time
            }

            self.broadcast("lightning", strikeData)

            if len(self.strikeCache) >= self.max_lightning_cache:
                self.strikeCache.pop(0)
            self.strikeCache.append(strikeData)
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
                % (self.getAndResetStrikes(), self.getAndResetFailStrikes(),
                    oldlen - len(self.strikeCache), len(self.strikeCache)))
        threading.Timer(5*60, self.stats_logging_cb).start()

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

# https://www.dwd.de/DE/leistungen/radarprodukte/dokumentation_mcd.pdf?__blob=publicationFile&v=2
class DwdMesocyclones(SocketIOWrapper, threading.Thread):
    def __init__(self, socketio):
        SocketIOWrapper.__init__(self, socketio)
        threading.Thread.__init__(self)
        self.cache = []
        self.attributes = {}
        self.lastFileTime = None

    def run(self):
        apiURL = "http://opendata.dwd.de/weather/radar/mesocyclones/meso_20190809_1805.xml"
        #apiURL = "http://opendata.dwd.de/weather/radar/mesocyclones/meso_latest.xml"

        logging.warn("dwd mesocyclone thread init with url=%s" % apiURL)
        while True:
            if self.lastFileTime:
                time.sleep(60)

            r = requests.head(apiURL)
            fileTime = datetime.datetime.strptime(r.headers['last-modified'], "%a, %d %b %Y %X GMT")

            if not self.lastFileTime or self.lastFileTime < fileTime:
                logging.warn("downloading new meso file")
                self.lastFileTime = fileTime
            else:
                logging.warn("meso xml already seen")
                continue

            # avoid DoSing dwd server when unreachable
            time.sleep(1)

            tree = None
            try:
                tree = ElementTree.fromstring(requests.get(apiURL).content)
            except ParseError as e:
                logging.error("xml parse error: %s" % e)
                tree = []

            eventId = 0
            for child in tree:
                if child.tag != "event":
                    continue

                coords = child.findall("location/area/ellipse/moving-point")[0]
                if not coords:
                    continue
                lat = None
                lon = None
                try:
                    lat = float(coords.find("latitude").text)
                    lon = float(coords.find("longitude").text)
                except ValueError:
                    continue

                mesotime = datetime.datetime.strptime(child.findall("time")[0].text, "%Y-%m-%dT%H:%M:%S")

                diameter_child = child.findall("location/area/ellipse/major_axis")[0]
                diameter = None
                try:
                    diameter = float(diameter_child.text)
                except ValueError:
                    continue

                intensity = None
                intensity_child = child.findall("nowcast-parameters/meso_intensity")[0]
                try:
                    intensity = int(intensity_child.text)
                except ValueError:
                    continue

                transformed = transform(Proj(init="epsg:4326"),
                        Proj(init="epsg:3857"), lon, lat)
                mesocyclone = {
                        "lat": transformed[1],
                        "lon": transformed[0],
                        "diameter": diameter,
                        "time": mesotime.replace(tzinfo=timezone.utc).timestamp()*1000 + eventId,
                        "intensity": intensity
                }

                attribs = {}
                for param in child.findall("nowcast-parameters")[0]:
                    if param.tag == "elevations" or param.tag == "meso_intensity":
                        continue
                    tag = param.tag.replace("mesocyclone_", "")
                    try:
                        attribs[tag] = "%.2f" % float(param.text)
                    except ValueError:
                        continue
                    if "units" in param.attrib:
                        attribs[tag] += (" %s" % param.attrib["units"])

                logging.info(mesocyclone)
                logging.info(attribs)
                self.broadcast("mesocyclone", mesocyclone)
                self.cache.append(mesocyclone)
                self.attributes[mesocyclone["time"]] = attribs
                eventId += 1


async def cache_server(data, request):
    return web.json_response(data)

if __name__ == "__main__":
    socketio = SocketIO(message_queue='amqp://mq')
    blitzortung = Blitzortung(socketio, 1000)
    meso = DwdMesocyclones(socketio)

    blitzortung.start()
    meso.start()

    server = web.Application()
    async def lightning_cache(request):
        return await cache_server(blitzortung.strikeCache, request)
    server.add_routes([web.get('/lightning_cache', lightning_cache)])
    async def mesocyclone_cache(request):
        return await cache_server(meso.cache, request)
    server.add_routes([web.get('/mesocyclones/all/', mesocyclone_cache)])
    async def mesocyclone_one(request):
        await asyncio.sleep(100)
        attribs = None
        try:
            ts = int(request.match_info.get('id', 0))
            attribs = meso.attributes[ts]
        except ValueError:
            return web.json_response({'error': 'invalid id'})
        return web.json_response(attribs)
    server.add_routes([web.get('/mesocyclones/{id}', mesocyclone_one)])
    web.run_app(server, port=5000)


# vim: set ts=4 sw=4 expandtab:
