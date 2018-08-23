#!/usr/bin/python3

# this thing is a huge mess XXX

import wradlib
import geojson_utils
from geojson_utils import number2radius, number2degree
import sys
import math
from geojson import Point, Polygon, FeatureCollection, Feature
from PIL import Image
import colorsys

start = (46.9526, 3.5889)

img = Image.new( 'RGBA', (900,1100)) # Create a new black image
pixels = img.load() # Create the pixel map

data = wradlib.io.radolan.read_radolan_composite(sys.argv[1])
# data is mm/5m, we convert it to dbz here: https://plot.ly/~ToniBois/1783.embed
# https://www.dwd.de/DE/leistungen/radarniederschlag/rn_info/download_niederschlagsbestimmung.pdf?__blob=publicationFile&v=4

def scale(r, g, b, num, idx):
    threshold = 0.2
    hls = colorsys.rgb_to_hls(r/255, g/255, b/255)
    result = colorsys.hls_to_rgb(hls[0], hls[1]+(1-hls[1]-threshold)*(1/num)*idx, hls[2])
    return (int(result[0]*255), int(result[1]*255), int(result[2]*255))

def dbz2color(dbz):
    factor = (dbz % 5) + 1
    if dbz >= 170:
        return (0, 0, 0, 0)
    if dbz >= 75:
        return scale(0xFE, 0xFC, 0xFD, 95, dbz % 75)
    if dbz >= 70:
        return scale(0x98, 0x58, 0xC4, 5, dbz % 70)
    if dbz >= 65:
        return scale(0xF6, 0x28, 0xF6, 5, dbz % 65)
    if dbz >= 60:
        return scale(0xB8, 0x07, 0x11, 5, dbz % 60)
    if dbz >= 55:
        return scale(0xC9, 0x0B, 0x13, 5, dbz % 55)
    if dbz >= 50:
        return scale(0xFA, 0x0D, 0x1C, 5, dbz % 50)
    if dbz >= 45:
        return scale(0xFA, 0x93, 0x26, 5, dbz % 45)
    if dbz >= 40:
        return scale(0xE3, 0xBB, 0x2A, 5, dbz % 40)
    if dbz >= 35:
        return scale(0xFC, 0xF3, 0x36, 5, dbz % 35)
    if dbz >= 30:
        return scale(0x12, 0x8C, 0x15, 5, dbz % 30)
    if dbz >= 25:
        return scale(0x1E, 0xC4, 0x22, 5, dbz % 25)
    if dbz >= 20:
        return scale(0x2A, 0xFC, 0x30, 5, dbz % 20)
    if dbz >= 15:
        return scale(0x0E, 0x22, 0xEE, 5, dbz % 15)
    if dbz >= 5:
        return scale(0x1B, 0xA0, 0xF0, 10, dbz % 5)
    if dbz >= 0:
        return (64, 64, 64, int(50/5*factor))
    if dbz < 0:
        return (0x00, 0x00, 0x00, 0)

feature_list = []
rows = 0
for row in reversed(data[0]):
    cols = 0
    for pixel in row:
        cols = cols + 1
        if pixel == -9999:
            # this means no data
            continue

        try:
            pixels[cols-1,rows] = dbz2color(wradlib.trafo.rvp_to_dbz(pixel))
        except IndexError:
            print("okay but why wtf IndexError cols=%d rows=%d" % (cols, rows))
            continue

    rows = rows + 1

print("biggest index row=%d col=%d" % (rows, cols))

img.show()
img.save(sys.argv[2])
