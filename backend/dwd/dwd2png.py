#!/usr/bin/python3

# this thing is a huge mess XXX
# rename me!

import wradlib
import sys
from PIL import Image
from dbz2color import dbz2color


if __name__ == "__main__":
    start = (46.9526, 3.5889)

    img = Image.new("RGBA", (900, 1100))  # Create a new black image
    pixels = img.load()  # Create the pixel map

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
                pixels[cols - 1, rows] = dbz2color(wradlib.trafo.rvp_to_dbz(pixel))
            except IndexError:
                print("okay but why wtf IndexError cols=%d rows=%d" % (cols, rows))
                continue

        rows = rows + 1

    print("biggest index row=%d col=%d" % (rows, cols))

    # img.show()
    img.save(sys.argv[2])
