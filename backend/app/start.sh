#!/bin/sh
set -x

FLAGS=""
if [ "$RECORDING" = "true" ]; then
    FLAGS="-r"
fi

while true; do
    echo Starting app.py
    python3 app.py $FLAGS
    sleep 1
done
