import colorsys


def scale(r, g, b, num, idx, alpha=False, lightToDark=True):
    threshold = 0.2
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
        a = 150 + int(105 / (num + 2) * (idx + 1))
    else:
        a = 255

    return (int(result[0] * 255), int(result[1] * 255), int(result[2] * 255), a)


def dbz2color(dbz):
    if dbz >= 170:
        return (0, 0, 0, 0)
    if dbz >= 61:
        return scale(0xFE, 0xFC, 0xFD, 10, dbz % (61), False, True)
    if dbz >= 46:
        return scale(0xFE, 0xFC, 0xFD, 15, dbz % (51))
    if dbz >= 36:
        return scale(0x98, 0x58, 0xC4, 10, dbz % (36))
    if dbz >= 31:
        return scale(0xF6, 0x28, 0xF6, 5, dbz % (31))
    # if dbz >= 60:
    #    return scale(0xB8, 0x07, 0x11, 5, dbz % (60))
    # redundant color
    # if dbz >= 55:
    #    return scale(0xC9, 0x0B, 0x13, 5, dbz % (55))
    if dbz >= 28:
        # red
        return scale(117, 0, 0, 5, dbz % (28), False, True)
    # if dbz >= 45:
    #    return scale(0xFA, 0x93, 0x26, 5, dbz % (45))
    # ugly color
    # if dbz >= 40:
    #    return scale(0xE3, 0xBB, 0x2A, 5, dbz % (40))
    if dbz >= 23:
        # yellow
        return scale(87, 74, 0, 4, dbz % (23))
    # also redundant
    # if dbz >= 25:
    #    return scale(0x1E, 0xC4, 0x22, 5, dbz % (25))
    if dbz >= 18:
        # return scale(0x2A, 0xFC, 0x30, 5, dbz % (20))
        # the redundant color looks nicer though...
        # green
        return scale(0x1E, 0xC4, 0x22, 5, dbz % (17))
    if dbz >= 12:
        # blau
        return scale(0x0E, 0x22, 0xEE, 6, dbz % 12)
    if dbz >= 0:
        # grey
        return (70, 70, 70, int(105 / 12 * (dbz+1))%255)
    if dbz < 0:
        return (0x00, 0x00, 0x00, 0)
