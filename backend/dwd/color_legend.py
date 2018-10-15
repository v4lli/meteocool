from PIL import Image, ImageDraw
import colorsys
import sys
from dwd2geojson import scale, dbz2color

#background = Image.open("osm_munich.png")

size = (1536, 300)
image = Image.new("RGBA", size, "black")
draw = ImageDraw.Draw(image)

count = 0
for color in range(0, 96*2):
    draw.line((count, 0, count, image.size[0]), fill=dbz2color(color/2.0), width=8)
    count = count + 8
draw.line((count+1, 0, count+1, image.size[0]), fill=(0xff, 0xff, 0xff, 0), width=8)
image.save(sys.argv[1])

#background.paste(image, (0, 0), image)
#cropped = background.crop((0, 0, size[0], size[1]))
#
#cropped.save(sys.argv[1])
#cropped.show()
