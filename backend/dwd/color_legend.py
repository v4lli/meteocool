from PIL import Image
import colorsys
from dwd2geojson import scale, dbz2color

size = (2048, 200)
image = Image.new("RGBA", size)
draw = ImageDraw.Draw(image)

count = 0
for color in range(-32, 95):
    draw.line((count, 0, count, image.size[0]), fill=dbz2color(color), width=8)
    count = count + 8
image.save("legend.png")
