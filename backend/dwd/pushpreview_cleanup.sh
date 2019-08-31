#!/bin/sh
find /pushpreview/ -mtime +7 -name'*.png' -exec rm {} \;
