#!/bin/sh

echo $MC_TOKEN > /tmp/.token

cron -f
