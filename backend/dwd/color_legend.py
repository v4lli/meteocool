#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont, ImageOps
import colorsys
import sys
from dbz2color import scale, dbz2color

size = (1036, 250)
image = Image.new("RGBA", size, "white")
draw = ImageDraw.Draw(image)

# for dbz labels
fontsize = 24
font = ImageFont.truetype("./raleway-medium.ttf", fontsize, encoding="unic")

count = 0
for color in range(0, 65 * 2):
    draw.line((count, 0, count, image.size[1]-100), fill=dbz2color(color / 2.0), width=8)
    # small legend line
    if color % 2 == 0:
        draw.line((count-3, image.size[1]-99, count-3, image.size[1]-89), fill=(200, 200, 200, 255), width=1)
    if color % 10 == 0:
        draw.line((count-3, image.size[1]-94, count-3, image.size[1]-94), fill=(200, 200, 200, 255), width=2)
    count = count + 8

count = 0
for color in range(0, 70 * 2):
    if color % 10 == 0 and color != 0:
        #draw.text((x, size[1]-fontsize-12), str(x/2.0) + " dbZ", (255,255,255), font=font)
        txt=Image.new('L', (200,50))
        d = ImageDraw.Draw(txt)
        d.text((0, 0), str(int(color/2.0)) + " dbZ", font=font, fill=50)
        w = txt.rotate(50, expand=1, resample=Image.BILINEAR)
        image.paste(ImageOps.colorize(w, (0,0,0), (100,100,100)), (count-137, 80),  w)
    count = count + 8

draw.line((count + 1, 0, count + 1, image.size[0]), fill=(0xFF, 0xFF, 0xFF, 0), width=8)
image.save(sys.argv[1])
