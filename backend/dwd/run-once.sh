#!/bin/sh
. /etc/environment
if ! [ -e "/tmp/.lock" ] ; then
	touch /tmp/.lock
	cd /usr/src/app
	make update api OUT=/data/
	rm -f /tmp/.lock
fi
