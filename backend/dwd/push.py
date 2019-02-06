#!/usr/bin/python3

# very inefficient (we can simply convert between the two coordinate systems
# and get xy directly without two O(n^2) operations). this is just a poc! XXX

import os
import sys
import json
import glob
import logging
from gobiko.apns.exceptions import BadDeviceToken, Unregistered
from gobiko.apns import APNsClient
from pymongo import MongoClient
from scipy.spatial import distance
import requests
import wradlib as wrl
from wradlib.trafo import rvp_to_dbz
import smopy
import random
import string
from PIL.Image import composite, blend
from PIL import Image
from pyfcm import FCMNotification
from dwdTemperature import dwdTemperature

logging.basicConfig(level=logging.WARN, format='%(asctime)s %(levelname)s %(message)s')

def closest_node(node, nodes):
    closest_index = distance.cdist([node], nodes).argmin()
    return closest_index

def dbz_to_str_pure(dbz,lat,lon):
    rain_snow = rain_or_snow(lat,lon)

    if dbz > 65:
        return "Large hail"
    if dbz > 60:
        return "Hail"
    if dbz > 55:
        return "Small hail"
    if dbz > 47:
        return "Extreme %s" % rain_snow
    if dbz > 40:
        return "Heavy %s" % rain_snow
    if dbz > 35:
        return "Intense %s" % rain_snow
    if dbz > 30:
        return "More intense %s" % rain_snow
    if dbz > 25:
        return "Rain" if rain_snow == "rain" else "Snow"
    if dbz > 20:
        return "Light %s" % rain_snow
    if dbz > 15:
        return "Drizzle" if rain_snow == "rain" else "Snowflakes"
    if dbz > 0:
        # ???
        return "Mist"
    if dbz > -10:
        # ???
        return "Light mist"
    if dbz > -31:
        # ???
        return "Extremely light mist"
    if dbz <= -31:
        return "No %s" % rain_snow


dwdTemp = dwdTemperature()
dwdTemp.get_stations()

def rain_or_snow(lat,lon):
    station_id = dwdTemp.find_next_station(lat, lon)
    current_temperature = dwdTemp.get_current_temperature(station_id)

    if current_temperature and current_temperature <= 0:
        return "snow"
    else:
        return "rain"

def dbz_to_str(dbz, lat, lon, lower_case=False):
    intensity = None
    if lower_case:
        intensity = dbz_to_str_pure(dbz,lat,lon).lower()
    else:
        intensity = dbz_to_str_pure(dbz,lat,lon)

    return "%s (%d dbZ)" % (intensity, dbz)

def get_rain_peaks(forecast_maps, max_ahead, xy, user_ahead=0, user_intensity=10):
    timeframe = user_ahead
    max_intensity = 0
    peak_mins = 0

    while timeframe <= max_ahead:
        intensity = rvp_to_dbz(forecast_maps[timeframe][0][xy[0]][xy[1]])
        if intensity > max_intensity:
            peak_mins = timeframe
            max_intensity = intensity
        if intensity < user_intensity:
            break
        timeframe += 5

    return max_intensity, peak_mins, timeframe-user_ahead

# XXX make dependant on ahead
# XXX cleanup cronjob
# XXX missing OSM and DWD copyright
# XXX missing crop
def generate_preview(lat, lon):
    osm_map = smopy.Map((lat-0.5, lon-0.5, lat+0.5, lon+0.5), z=9).to_pil()
    weather_map = smopy.Map((lat-0.5, lon-0.5, lat+0.5, lon+0.5), z=9,
            tileserver="http://a.tileserver.unimplemented.org/data/FX_015-latest/{z}/{x}/{y}.png").to_pil()

    random_name = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(128))
    pathspec = "/pushpreview/%s.png" % random_name

    out = Image.blend(osm_map, weather_map, 0.4).convert("RGB")
    # out is 768 × 768 pixels
    #out.crop((100,100, 668,668)).save("/pushpreview/%s.png" % random_name, format="png", optimize=True)
    out.save(pathspec, format="png", optimize=True)

    return "https://meteocool.unimplemented.org%s" % pathspec

if __name__ == "__main__":
    # programm parameters
    radar_files = sys.argv[1]
    browser_notify_url = sys.argv[2]

    # Apple Push setup
    apns_config_file = '/etc/apns.json'
    apns = None
    if os.path.isfile(apns_config_file):
        config = None
        with open(apns_config_file) as conf_file:
            config = json.load(conf_file)
        apns = APNsClient(
            team_id=config["team_id"],
            bundle_id=config["bundle_id"],
            auth_key_id=config["auth_key_id"],
            auth_key_filepath=config["auth_key_filepath"],
            use_sandbox=config["use_sandbox"]
        )

    # Android push setup. The API key comes from the environment.
    fcm = None
    if os.getenv('FCM_API_KEY', None):
        fcm = FCMNotification()

    # mongodb setup
    db_client = MongoClient("mongodb://mongo:27017/")
    # both will be created automatically when the first document is inserted
    db = db_client["meteocool"]
    collection = db["collection"]

    # forecast file enumeration & import
    forecast_files = sorted(glob.glob(radar_files + "/FX*_*_MF002"))
    max_ahead = 0
    forecast_maps = {}
    for f in forecast_files:
        forecast_maps[max_ahead] = wrl.io.radolan.read_radolan_composite(f)
        max_ahead = max_ahead + 5
    max_ahead -= 5
    logging.warn("Maximum forecast in minutes: %d" % max_ahead)

    # wradlib setup
    gridsize = 900
    radolan_grid_ll = wrl.georef.get_radolan_grid(gridsize, gridsize, wgs84=True)
    linearized_grid = []
    for lon in radolan_grid_ll:
        for lat in lon:
            linearized_grid.append(lat)

    # iterate through all db entries and push browser events to the app backend,
    # ios push events to apple
    cursor = collection.find({})
    cnt = 0
    for document in cursor:
        try:
            doc_id = document["_id"]
            lat = document["lat"]
            lon = document["lon"]
            token = document["token"]
            ahead = document["ahead"]
            intensity = document["intensity"]
            ios_onscreen = document["ios_onscreen"]
            source = document["source"]
            last_updated = document["last_updated"]
        except KeyError as e:
            print("Invalid key line: %s" % e)
            continue

        if token == "anon":
            continue

        # overwrite instensity for everyone
        intensity = 18

        if ahead > max_ahead or ahead%5 != 0:
            logging.error("%s: invalid ahead value" % doc_id)
            continue

        # TRAVEL MODE DETECTION
        try:
            travelmodeSpeed = document["travelmode_speed"]
            travelmodeAccuracy = document["travelmode_accuracy"]
        except KeyError as e:
            logging.warn("travel mode not supported for this client")
        else:
            # if the interpolated speed is still above ~20 km/h, don't push
            # XXX accuracy beachten
            m_diff = (datetime.datetime.utcnow()-last_updated).total_seconds() / 60
            # cool down by 0.35 km/h per minute
            interpolatedSpeed = max(travelmodeSpeed - m_diff*0.35, 0)
            if interpolatedSpeed > 10:
                logging.warn("%s: not pushing for client because of too high interpolated speed %f (orig=%f)" % (token, interpolatedSpeed, travelmodeSpeed))
                continue
            else:
                logging.warn("interpolatedSpeed=%f < 20km/h -> OK" % interpolatedSpeed)

        # XXX check lat/lon against the bounds of the dwd data here
        # to avoid useless calculations here

        # user position in grid
        result = closest_node((lon, lat), linearized_grid)
        xy = (int(result / gridsize), int(result % gridsize))

        # get forecasted value from grid
        data = forecast_maps[ahead]
        reported_intensity = rvp_to_dbz(forecast_maps[ahead][0][xy[0]][xy[1]])

        # also check timeframes BEFORE the configured ahead value
        if reported_intensity < intensity:
            timeframe = ahead - 5
            while timeframe > 0:
                previous_intensity = rvp_to_dbz(forecast_maps[timeframe][0][xy[0]][xy[1]])
                if previous_intensity >= intensity:
                    logging.warn("%s: no match for old ahead value, but %d >= %d for lower ahead=%d!" % (token,
                        previous_intensity, intensity, timeframe))
                    reported_intensity = previous_intensity
                    ahead = timeframe
                timeframe -= 5

        logging.warn("%d >? %d" % (reported_intensity, intensity))
        if reported_intensity >= intensity:
            logging.warn("%s: intensity %d > %d matches in %d min forecast (type=%s)" % (token, reported_intensity, intensity, ahead, source))

            # fancy message generation
            max_intensity, peak_mins, total_mins = get_rain_peaks(forecast_maps, max_ahead, xy, ahead, intensity)
            message_dict = {
                "title": "%s expected in %d min!" % (dbz_to_str(reported_intensity,lat,lon), ahead),
                "body": "Peaks with %s in %d minutes, lasting a total of at least %d min." % (
                    dbz_to_str(max_intensity, lat, lon, lower_case=True), peak_mins, total_mins)
            }
            if max_intensity == reported_intensity:
                message_dict["body"] = "No duration estimate; possibly just a little shower."

            if source == "browser":
                requests.post(browser_notify_url, json={"token": token, "ahead": ahead})
            elif source == "android":
                if fcm and not ios_onscreen:
                    result = fcm.notify_single_device(registration_id=token,
                            message_title=message_dict["title"],
                            message_body=message_dict["body"],
                            message_icon="rain")
                    collection.update({"_id": doc_id}, {"$set": {"ios_onscreen": True}})
                    logging.warn("%s: Delivered android push notification with result=%s" % (token, result))
                else:
                    logging.error("FCM support not enabled")
            elif source == "ios":
                # https://developer.apple.com/library/archive/documentation/NetworkingInternet/
                # Conceptual/RemoteNotificationsPG/PayloadKeyReference.html#//apple_ref/doc/uid/TP40008194-CH17-SW1
                if apns:
                    # only send another notification if the previous one was
                    # acknowledged (app was opened or we successfully deleted the
                    # last one).
                    if not ios_onscreen:
                        # push preview maps
                        extra_dict = {}
                        preview_url = generate_preview(lat, lon)
                        if preview_url:
                            logging.warn("generated push preview at %s" % preview_url)
                            extra_dict["preview"] = preview_url
                        try:
                            apns.send_message(token, message_dict, badge=0,
                                    sound="pulse.aiff", extra=extra_dict, mutable_content=True, category="WeatherAlert")
                        except BadDeviceToken:
                            logging.warn("%s: sending iOS notification failed with BadDeviceToken, removing push client", token)
                            collection.remove(doc_id)
                        except Unregistered:
                            logging.warn("%s: sending iOS notification failed with Unregistered, removing push client", token)
                            collection.remove(doc_id)
                        else:
                            logging.warn("%s: sent iOS notification", token)
                            # mark notification as delivered in the database, so we can
                            # clear it as soon as the rain stops.
                            collection.update({"_id": doc_id}, {"$set": {"ios_onscreen": True}})
                    else:
                        logging.warn("%s: old notification not acknowledged, not re-sending", token)
                else:
                    logging.warn("iOS push not configured but iOS source requested")
            else:
                logging.warn("unknown source type %s" % source)
        else:
            if ios_onscreen:
                # rain has stopped and the notification is (possibly) still
                # displayed on the device.
                if source == "ios":
                    try:
                        apns.send_message(token, None, badge=0, content_available=True, extra={"clear_all": True})
                    except BadDeviceToken:
                        logging.warn("%s: silent iOS notification failed with BadDeviceToken, removing push client", token)
                        collection.remove(doc_id)
                    except Unregistered:
                        logging.warn("%s: silent iOS notification failed with Unregistered, removing push client", token)
                        collection.remove(doc_id)
                    else:
                        logging.warn("%s: sent silent notification" % token)
                        collection.update({"_id": doc_id}, { "$set": {"ios_onscreen": False} })
                elif source == "android":
                    result = fcm.single_device_data_message(registration_id=token, data_message={"clear_all": True})
                    logging.warn("%s: Delivered android data push with result=%s" % (token, result))
                    collection.update({"_id": doc_id}, { "$set": {"ios_onscreen": False} })
                else:
                    logging.error("%s: Unsupported source" % token)
        cnt = cnt + 1

    logging.warn("===> Processed %d total clients" % cnt)
