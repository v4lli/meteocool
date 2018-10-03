#!/usr/bin/python4

# very inefficient (we can simply convert between the two coordinate systems
# and get xy directly without two O(n^2) operations). Just a poc! XXX

#from pyproj import Proj, transform
from scipy.spatial import distance
import numpy
import os
import sys
import wradlib as wrl
from pymongo import MongoClient

db_client = MongoClient(os.getenv("DB_CONN", default="mongodb://mongo:27017/"))
# both will be created automatically when the first document is inserted
db = db_client[os.getenv("DB_NAME", default="meteocool")]
collection = db[os.getenv("MONGO_COLLECTION", default="meteocollection")]

data = wrl.io.radolan.read_radolan_composite(sys.argv[1])

def closest_node(node, nodes):
    closest_index = distance.cdist([node], nodes).argmin()
    return closest_index


radolan_grid_ll = wrl.georef.get_radolan_grid(900,900, wgs84=True)

a = []
for lon in radolan_grid_ll:
    for lat in lon:
        a.append(lat)


cursor = collection.find({})
for document in cursor:
    latlon = document.latlon
    result = closest_node(latlon, a)
    xy = (int(result / 900), int(result % 900))
    if data[0][xy[0]][xy[1]] > 20:
        print(">20 at %s" % latlon)
        if document.source == 0:
            # websocket
            requests.get(sys.argv[2])
        else:
            print("unknown source type")
