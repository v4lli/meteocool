#!/usr/bin/python3

# this thing is a huge mess XXX
# rename me!

import wradlib
import geojson_utils
from geojson_utils import number2radius, number2degree
import sys
import math
from geojson import Point, Polygon, FeatureCollection, Feature
from PIL import Image
import colorsys

def scale(r, g, b, num, idx, alpha=False, lightToDark=True):
    threshold = 0.2
    hls = colorsys.rgb_to_hls(r/255, g/255, b/255)
    if lightToDark:
        result = colorsys.hls_to_rgb(hls[0], 1-(hls[1]+(1-hls[1]-threshold)*(1/num)*idx), hls[2])
    else:
        result = colorsys.hls_to_rgb(hls[0], hls[1]+(1-hls[1]-threshold)*(1/num)*idx, hls[2])

    if alpha:
        a = 150 + int(105/(num+2)*(idx+1))
    else:
        a = 255

    return (int(result[0]*255), int(result[1]*255), int(result[2]*255), a)

def dbz2color(dbz):
    factor = (dbz % 5) + 1
    s = 0
    if dbz >= 170-s:
        return (0, 0, 0, 0)
    if dbz >= 74-s:
        return scale(0xFE, 0xFC, 0xFD, 93-s, dbz % (74-s))
    if dbz >= 71-s:
        return scale(0xFE, 0xFC, 0xFD, 3-s, dbz % (71-s))
    if dbz >= 65-s:
        return scale(0x98, 0x58, 0xC4, 6-s, dbz % (65-s))
    if dbz >= 50-s:
        return scale(0xF6, 0x28, 0xF6, 15-s, dbz % (50-s))
    #if dbz >= 60-s:
    #    return scale(0xB8, 0x07, 0x11, 5-s, dbz % (60-s))
    # redundant color
    #if dbz >= 55-s:
    #    return scale(0xC9, 0x0B, 0x13, 5-s, dbz % (55-s))
    if dbz >= 35-s:
        return scale(117, 0, 0, 15-s, dbz % (35-s), False, False)
    #if dbz >= 45-s:
    #    return scale(0xFA, 0x93, 0x26, 5-s, dbz % (45-s))
    # ugly color
    #if dbz >= 40-s:
    #    return scale(0xE3, 0xBB, 0x2A, 5-s, dbz % (40-s))
    if dbz >= 32-s:
        #gelb
        return scale(87, 74, 0, 3-s, dbz % (32-s))
    if dbz >= 30-s:
        # gruen
        return scale(0x12, 0x8C, 0x15, 2-s, dbz % (30-s), True)
    # also redundant
    #if dbz >= 25-s:
    #    return scale(0x1E, 0xC4, 0x22, 5-s, dbz % (25-s))
    if dbz >= 25-s:
        #return scale(0x2A, 0xFC, 0x30, 5-s, dbz % (20-s))
        # the redundant color looks nicer though...
        return scale(0x1E, 0xC4, 0x22, 5-s, dbz % (25-s))
    if dbz >= 20:
        return scale(0x0E, 0x22, 0xEE, 10+s, dbz % 20)
    if dbz >= 10:
        return scale(0x0E, 0x22, 0xEE, 10, dbz % 10, True)
    if dbz >= 0:
        return (64, 64, 64, int(115/5*factor))
    if dbz < 0:
        return (0x00, 0x00, 0x00, 0)

if __name__ == "__main__":
    start = (46.9526, 3.5889)

    img = Image.new( 'RGBA', (900,1100)) # Create a new black image
    pixels = img.load() # Create the pixel map

    data = wradlib.io.radolan.read_radolan_composite(sys.argv[1])
    # data is mm/5m, we convert it to dbz here: https://plot.ly/~ToniBois/1783.embed
    # https://www.dwd.de/DE/leistungen/radarniederschlag/rn_info/download_niederschlagsbestimmung.pdf?__blob=publicationFile&v=4


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

    #img.show()
    img.save(sys.argv[2])
