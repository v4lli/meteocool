from PIL import Image, ImageDraw
import colorsys
import sys
from dbz2color import scale, dbz2color

size = (1036, 300)
image = Image.new("RGBA", size, "black")
draw = ImageDraw.Draw(image)

count = 0
for color in range(0, 65 * 2):
    draw.line((count, 0, count, image.size[0]), fill=dbz2color(color / 2.0), width=8)
    count = count + 8
draw.line((count + 1, 0, count + 1, image.size[0]), fill=(0xFF, 0xFF, 0xFF, 0), width=8)
image.save(sys.argv[1])
