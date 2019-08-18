#!/bin/sh

set -x

cd /recording
curl -O http://localhost:5000/lightning_cache
curl -O http://localhost:5000/mesocyclone_cache
