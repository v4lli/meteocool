#!/usr/bin/python3

# very inefficient (we can simply convert between the two coordinate systems
# and get xy directly without two O(n^2) operations). Just a poc! XXX

#from pyproj import Proj, transform
from scipy.spatial import distance
import numpy
import os
import sys
import wradlib as wrl
from pymongo import MongoClient

db_client = MongoClient("mongodb://mongo:27017/")
# both will be created automatically when the first document is inserted
db = db_client["meteocool"]
collection = db["collection"]

radar_file = sys.argv[1]
browser_notify_url = sys.argv[2]

data = wrl.io.radolan.read_radolan_composite(radar_file)

def closest_node(node, nodes):
    closest_index = distance.cdist([node], nodes).argmin()
    return closest_index


radolan_grid_ll = wrl.georef.get_radolan_grid(900,900, wgs84=True)

linearized_grid = []
for lon in radolan_grid_ll:
    for lat in lon:
        linearized_grid.append(lat)

cursor = collection.find({})
for document in cursor:
    print(cursor)
    lat = document["lat"]
    lat = document["lon"]
    uuid = document["uuid"]

    result = closest_node((lat, lon), linearized_grid)
    xy = (int(result / 900), int(result % 900))
    if data[0][xy[0]][xy[1]] > 20:
        print(">20 at %s" % latlon)
        if document.source == "browser":
            requests.get(browser_notify_url)
        elif document.source == "ios":
            print("iOS push not implemented!")
        else:
            print("unknown source type")
