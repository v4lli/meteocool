#!/bin/sh

echo "FCM_API_KEY=$FCM_API_KEY" > /etc/environment
cron -f
