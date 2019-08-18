#!/bin/sh

echo "FCM_API_KEY=$FCM_API_KEY" > /etc/environment
echo "RECORDING=$RECORDING" >> /etc/environment
cron -f
