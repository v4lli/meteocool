#!/usr/bin/python3

# very inefficient (we can simply convert between the two coordinate systems
# and get xy directly without two O(n^2) operations). this is just a poc! XXX

import os
import sys
import json
import glob
import logging
from gobiko.apns.exceptions import BadDeviceToken
from gobiko.apns import APNsClient
from pymongo import MongoClient
from scipy.spatial import distance
import requests
import wradlib as wrl
from wradlib.trafo import rvp_to_dbz

logging.basicConfig(level=logging.WARN, format='%(asctime)s %(levelname)s %(message)s')

def closest_node(node, nodes):
    closest_index = distance.cdist([node], nodes).argmin()
    return closest_index

def dbz_to_str(dbz):
    if dbz > 65:
        return "Large hail"
    if dbz > 60:
        return "Hail"
    if dbz > 55:
        return "Small hail"
    if dbz > 45:
        return "Heavy rain"
    if dbz > 26:
        return "Rain"
    if dbz > 20:
        return "Light rain"
    if dbz > 15:
        return "Drizzle"
    if dbz > 10:
        return "Mist"
    if dbz > 0:
        # ???
        return "Light mist"

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
        except KeyError as e:
            print("Invalid db line: %s" % e)
            continue

        if token != "fad41f92886425d2efc71b402a711e9c63013d79a0b9905a828471860cd5ab7f":
            continue

        if ahead > max_ahead or ahead%5 != 0:
            logging.error("%s: invalid ahead value" % doc_id)
            continue
        data = forecast_maps[ahead]

        # XXX check lat/lon against the bounds of the dwd data here
        # to avoid useless calculations here

        result = closest_node((lon, lat), linearized_grid)
        xy = (int(result / gridsize), int(result % gridsize))
        reported_intensity = rvp_to_dbz(data[0][xy[0]][xy[1]])
        logging.warn("%d >? %d" % (reported_intensity, intensity))
        if reported_intensity > intensity:
            logging.warn("%s: intensity %d > %d matches in %d min forecast (type=%s)" % (doc_id, reported_intensity, intensity, ahead, source))
            if source == "browser":
                requests.post(browser_notify_url, json={"token": token, "ahead": ahead})
            elif source == "ios":
                # https://developer.apple.com/library/archive/documentation/NetworkingInternet/
                # Conceptual/RemoteNotificationsPG/PayloadKeyReference.html#//apple_ref/doc/uid/TP40008194-CH17-SW1
                if apns:
                    # only send another notification if the previous one was
                    # acknowledged (app was opened or we successfully deleted the
                    # last one).
                    if not ios_onscreen:
                        message_dict = {
                            "title": ("%s expected" % (dbz_to_str(reported_intensity))),
                            "body": "%s (%d dbZ) expected in %d minutes at your location!"  % (dbz_to_str(reported_intensity),
                                reported_intensity, ahead)
                        }
                        try:
                            apns.send_message(token, message_dict, badge=0, sound="pulse.aiff")
                        except BadDeviceToken:
                            logging.warn("%s: sending iOS notification failed with BadDeviceToken, removing push client", doc_id)
                            collection.remove(doc_id)
                        else:
                            logging.warn("%s: sent iOS notification", doc_id)
                            # mark notification as delivered in the database, so we can
                            # clear it as soon as the rain stops.
                            collection.update({"_id": doc_id}, {"$set": {"ios_onscreen": True}})
                    else:
                        logging.warn("%s: old notification not acknowledged, not re-sending", doc_id)
                else:
                    logging.warn("iOS push not configured but iOS source requested")
            else:
                logging.warn("unknown source type %s" % source)
        else:
            if ios_onscreen:
                # rain has stopped and the notification is (possibly) still
                # displayed on the device.
                try:
                    apns.send_message(token, None, badge=0, content_available=True, extra={"clear_all": True})
                except BadDeviceToken:
                    logging.warn("%s: silent iOS notification failed with BadDeviceToken, removing push client", doc_id)
                    collection.remove(doc_id)
                else:
                    logging.warn("%s: sent silent notification" % doc_id)
                    collection.update({"_id": doc_id}, { "$set": {"ios_onscreen": True} })
        cnt = cnt + 1

    logging.warn("===> Processed %d total clients" % cnt)
