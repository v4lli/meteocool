#!/bin/sh
. /etc/environment
if ! [ -e "/tmp/.dwdlock" ] ; then
	date > /tmp/.dwdlock
	cd /usr/src/app
	make update api OUT=/data/
	wait
	rm -f /tmp/.dwdlock
fi
