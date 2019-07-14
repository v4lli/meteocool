import colorsys


def scale(r, g, b, num, idx, alpha=False, lightToDark=True, threshold = 0.2):
    hls = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    if lightToDark:
        result = colorsys.hls_to_rgb(
            hls[0], 1 - (hls[1] + (1 - hls[1] - threshold) * (1 / num) * idx), hls[2]
        )
    else:
        result = colorsys.hls_to_rgb(
            hls[0], hls[1] + (1 - hls[1] - threshold) * (1 / num) * idx, hls[2]
        )

    if alpha:
        a = 200 + int(55 / (num + 2) * (idx + 1))
    else:
        a = 255

    return (int(result[0] * 255), int(result[1] * 255), int(result[2] * 255), a)


def dbz2color(dbz):
    if dbz >= 170:
        return (0, 0, 0, 0)
    if dbz >= 62:
        return scale(0xFE, 0xFC, 0xFD, 10, dbz % (62), False, True)
    if dbz >= 47:
        return scale(0xFE, 0xFC, 0xFD, 15, dbz % (47))
    if dbz >= 40:
        # purple
        return scale(0xF6, 0x28, 0xF6, 5, dbz % (40))
    if dbz >= 32:
        # red
        return scale(117, 0, 0, 5, dbz % (32), False, True)
    if dbz >= 26:
        # yellow
        return scale(87, 74, 0, 4, dbz % (26), threshold=0.5)
    if dbz >= 20:
        # green
        return scale(0x1E, 0xC4, 0x22, 5, dbz % (20))
    if dbz >= 13:
        # blau
        return scale(0x0E, 0x22, 0xEE, 6, dbz % 13, True)
    if dbz >= 0:
        # grey
        return (0, 0, 0, int(105 / 12 * (dbz+1))%255)
    if dbz < 0:
        return (0x00, 0x00, 0x00, 0)
