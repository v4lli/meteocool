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

def scale_dark(r, g, b, num, idx, alpha=False, lightToDark=True, threshold = 0.2):
    hls = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    result = colorsys.hls_to_rgb(
        hls[0], 1 - (hls[1] + (1-hls[1])/num*idx), hls[2]
    )

    a = 255

    return (int(result[0] * 255), int(result[1] * 255), int(result[2] * 255), a)


def dbz2color(dbz):
    if dbz >= 100:
        return (0, 0, 0, 0)
    if dbz >= 62:
        return scale_dark(0xFE, 0xFC, 0xFD, 31, dbz % (62), False, False)
    #if dbz >= 47:
    #    # deep purple(TM)
    #    return scale(0xFE, 0xFC, 0xFD, 10, dbz % (47), False, True, 0.5)
    if dbz >= 42:
        # purple
        return scale_dark(0xF6, 0x28, 0xF6, 20, dbz % (42))
    if dbz >= 31:
        # red
        return scale(117, 0, 0, 11, dbz % (31), False, True)
    #if dbz >= 26:
    #    # yellow
    #    return scale(87, 74, 0, 6, dbz % (26), threshold=0.5)
    if dbz >= 23:
        # green
        return scale(0x1E, 0xC4, 0x22, 8, dbz % (23))
    if dbz >= 13:
        # blau
        return scale(0x0E, 0x22, 0xEE, 10, dbz % 13, True)
    if dbz >= 0:
        # grey
        return (0, 0, 0, int(105 / 12 * (dbz+1))%255)
    if dbz < 0:
        return (0x00, 0x00, 0x00, 0)
