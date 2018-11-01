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
    factor = (dbz % 5) + 1
    if dbz >= 170:
        return (0, 0, 0, 0)
    if dbz >= 74:
        return scale(0xFE, 0xFC, 0xFD, 93, dbz % (74))
    if dbz >= 71:
        return scale(0xFE, 0xFC, 0xFD, 3, dbz % (71))
    if dbz >= 65:
        return scale(0x98, 0x58, 0xC4, 6, dbz % (65))
    if dbz >= 50:
        return scale(0xF6, 0x28, 0xF6, 15, dbz % (50))
    # if dbz >= 60:
    #    return scale(0xB8, 0x07, 0x11, 5, dbz % (60))
    # redundant color
    # if dbz >= 55:
    #    return scale(0xC9, 0x0B, 0x13, 5, dbz % (55))
    if dbz >= 35:
        return scale(117, 0, 0, 15, dbz % (35), False, True)
    # if dbz >= 45:
    #    return scale(0xFA, 0x93, 0x26, 5, dbz % (45))
    # ugly color
    # if dbz >= 40:
    #    return scale(0xE3, 0xBB, 0x2A, 5, dbz % (40))
    if dbz >= 32:
        # gelb
        return scale(87, 74, 0, 3, dbz % (32))
    if dbz >= 30:
        # gruen
        return scale(0x12, 0x8C, 0x15, 2, dbz % (30), True)
    # also redundant
    # if dbz >= 25:
    #    return scale(0x1E, 0xC4, 0x22, 5, dbz % (25))
    if dbz >= 25:
        # return scale(0x2A, 0xFC, 0x30, 5, dbz % (20))
        # the redundant color looks nicer though...
        return scale(0x1E, 0xC4, 0x22, 5, dbz % (25))
    if dbz >= 20:
        return scale(0x0E, 0x22, 0xEE, 10, dbz % 20)
    if dbz >= 10:
        return scale(0x0E, 0x22, 0xEE, 10, dbz % 10, True)
    if dbz >= 0:
        return (64, 64, 64, int(115 / 5 * factor))
    if dbz < 0:
        return (0x00, 0x00, 0x00, 0)
