#!/bin/sh
set -eux

finish() {
	rm -f /tmp/.dwdlock || true
}
no() {
	true
}
trap finish EXIT

. /etc/environment
if ! [ -e "/tmp/.dwdlock" ] ; then
	date > /tmp/.dwdlock
	cd /usr/src/app
	make update api OUT=/data/
	wait
	rm -f /tmp/.dwdlock
fi
# XXX
trap no EXIT
