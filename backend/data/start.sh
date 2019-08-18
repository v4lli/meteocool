#!/bin/sh
set -x

FLAGS=""
if [ "$RECORDING" = "true" ]; then
    FLAGS="-r"
fi

while true; do
    echo Starting data.py
    python3 data.py $FLAGS
    sleep 1
done
