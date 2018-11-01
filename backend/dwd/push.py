#!/usr/bin/python3

# very inefficient (we can simply convert between the two coordinate systems
# and get xy directly without two O(n^2) operations). Just a poc! XXX

from scipy.spatial import distance
import os
import sys
import wradlib as wrl
import requests
import json
import glob
from pymongo import MongoClient
from gobiko.apns import APNsClient
from gobiko.apns.exceptions import BadDeviceToken

def closest_node(node, nodes):
    closest_index = distance.cdist([node], nodes).argmin()
    return closest_index

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
    cnt = 0
    forecast_maps = {}
    for f in forecast_files:
        forecast_maps[cnt] = wrl.io.radolan.read_radolan_composite(f)
        cnt = cnt + 5

    # wradlib setup
    radolan_grid_ll = wrl.georef.get_radolan_grid(900,900, wgs84=True)
    linearized_grid = []
    for lon in radolan_grid_ll:
        for lat in lon:
            linearized_grid.append(lat)

    # iterate through all db entries and push browser events to the app backend,
    # ios push events to apple
    cursor = collection.find({})
    for document in cursor:
        lat = document["lat"]
        lon = document["lon"]
        token = document["token"]
        ahead = document["ahead"]
        intensity = document["intensity"]
        ios_onscreen = document["ios_onscreen"]

        if ahead > 60 or ahead%5 != 0:
            print("invalid ahead value")
            break
        data = forecast_maps[ahead]

        # XXX check lat/lon against the bounds to avoid useless calculations here

        result = closest_node((lon, lat), linearized_grid)
        xy = (int(result / 900), int(result % 900))
        if data[0][xy[0]][xy[1]] > intensity:
            print("Client > 10: %s" % str(document))
            if document["source"] == "browser":
                requests.post(browser_notify_url, json={"token": token, "ahead": ahead})
            elif document["source"] == "ios":
                if apns:
                    # https://developer.apple.com/library/archive/documentation/NetworkingInternet/
                    # Conceptual/RemoteNotificationsPG/PayloadKeyReference.html#//apple_ref/doc/uid/TP40008194-CH17-SW1
                    try:
                        apns.send_message(token, ("Rain expected in %d minutes!" % ahead), badge=0, sound="pulse.aiff")
                    except BadDeviceToken:
                        print("bad token: %s; removing from db", token)
                        collection.remove(document["_id"])
                    else:
                        # mark notification as delivered in the database, so we can
                        # clear it as soon as the rain stops.
                        db.collection.update(document["_id"], {"$set": {"ios_onscreen": True}})
                else:
                    print("iOS push not configured!")
            else:
                print("unknown source type")
        else:
            if ios_onscreen:
                # rain has stopped and the notification is (possibly) still
                # displayed on the device.
                # XXX ios app should notify our api as soon as it is launched (and notifications are clearead)
                # XXX so we can reset the flag and don't send this silent push.
                try:
                    apns.send_message(token, None, badge=0, content_available=True, extra={"clear_all": True})
                except BadDeviceToken:
                    # XXX duplicate code
                    print("bad token: %s; removing from db", token)
                    collection.remove(document["_id"])
                else:
                    db.collection.update(document["_id"], { "$set": {"ios_onscreen": True} })
