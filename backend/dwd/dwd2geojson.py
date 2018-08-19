#!/usr/bin/python3

import wradlib
import geojson_utils
from geojson_utils import number2radius, number2degree
import sys
import math
from geojson import Point, Polygon, FeatureCollection, Feature
from PIL import Image


def destination_point_coords(point, brng, dist):
    """
    Calculate a destination Point base on a base point and a distance
    Keyword arguments:
    pt   -- polygon geojson object
    brng -- an angle in degrees
    dist -- distance in Kilometer between destination and base point
    return destination point object
    """
    dist = float(dist) / 6371  # convert dist to angular distance in radians
    brng = number2radius(brng)

    lon1 = number2radius(point[0])
    lat1 = number2radius(point[1])

    lat2 = math.asin(math.sin(lat1) * math.cos(dist) +
                     math.cos(lat1) * math.sin(dist) * math.cos(brng))
    lon2 = lon1 + math.atan2(math.sin(brng) * math.sin(dist) *
                             math.cos(lat1), math.cos(dist) - math.sin(lat1) * math.sin(lat2))
    lon2 = (lon2 + 3 * math.pi) % (2 * math.pi) - math.pi  # normalise to -180 degree +180 degree

    return (number2degree(lon2), number2degree(lat2))

start = (46.9526, 3.5889)

img = Image.new( 'RGBA', (900,1100)) # Create a new black image
pixels = img.load() # Create the pixel map

data = wradlib.io.radolan.read_radolan_composite(sys.argv[1])
# data is mm/5m, we convert it to dbz here: https://plot.ly/~ToniBois/1783.embed
# https://www.dwd.de/DE/leistungen/radarniederschlag/rn_info/download_niederschlagsbestimmung.pdf?__blob=publicationFile&v=4

def dbz2color(dbz):
    if dbz >= 170:
        return (0, 0, 0, 0)
    if dbz >= 75:
        return (0xFE, 0xFC, 0xFD, 255)
    if dbz >= 70:
        return (0x98, 0x58, 0xC4, 255)
    if dbz >= 65:
        return (0xF6, 0x28, 0xF6, 255)
    if dbz >= 60:
        return (0xB8, 0x07, 0x11, 255)
    if dbz >= 55:
        return (0xC9, 0x0B, 0x13, 255)
    if dbz >= 50:
        return (0xFA, 0x0D, 0x1C, 255)
    if dbz >= 45:
        return (0xFA, 0x93, 0x26, 255)
    if dbz >= 40:
        return (0xE3, 0xBB, 0x2A, 255)
    if dbz >= 35:
        return (0xFC, 0xF3, 0x36, 255)
    if dbz >= 30:
        return (0x12, 0x8C, 0x15, 255)
    if dbz >= 25:
        return (0x1E, 0xC4, 0x22, 255)
    if dbz >= 20:
        return (0x2A, 0xFC, 0x30, 255)
    if dbz >= 15:
        return (0x0E, 0x22, 0xEE, 255)
    if dbz >= 10:
        return (0x1B, 0xA0, 0xF0, 255)
    if dbz >= 5:
        return (0x1B, 0xA0, 0xF2, 255)
    if dbz >= 0:
        return (0x00, 0xE7, 0xE7, 255)
    if dbz < 0:
        return (0x00, 0x00, 0x00, 0)

cursor = tuple(start)
feature_list = []
rows = 0
for row in reversed(data[0]):
    cols = 0
    for pixel in row:
        cols = cols + 1
        if pixel == -9999:
            continue
        if pixel < -31.9:
            continue
        if pixel > 172.6:
            continue

        # Z = 256 * r^(1.42)
        # z= reflectivity
        # r = mm/h
        try:
            pixels[cols-1,rows] = dbz2color(pixel**(1.42)*256)
        except IndexError:
            print("okay but why wtf IndexError cols=%d rows=%d" % (cols, rows))
            continue
        # create a 1x1 square at cursor
        #feature_list.append(
        #        Feature(
        #            geometry=Polygon([[cursor] +
        #                [destination_point_coords(cursor, 45*x, round(math.sqrt(2),2) if x == 1 else 1) for x in range(0,3)] + [cursor]])))
        cursor = destination_point_coords(cursor, 90, 1)

    rows = rows + 1
    #print("Done with row=%d"%rows)
    # "carriage return"
    #cursor = destination_point_coords(start, 270, 1*cols)
    # "newline"
    #cursor = destination_point_coords(start, 0, 1*rows)

print("biggest index row=%d col=%d" % (rows, cols))

#boo = FeatureCollection(feature_list)
img.show()
img.save(sys.argv[2])
