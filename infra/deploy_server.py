#!/usr/bin/env python

# deployment script called by github when a new commit has been pushed.

import time, json, os
import syslog
from flask import Flask, abort

app = Flask(__name__)
app.debug = False

@app.route('/', methods = ['GET', 'POST'])
def trigger():
	syslog.syslog(syslog.LOG_ERR, "Deploying meteocool by request")
	if os.system("cd /home/meteocool/git && git pull && cd frontend && npm run-script build && rm -rf /home/meteocool/dist && mv dist /home/meteocool/dist && cd /home/meteocool/git/ && make mbtiles GDALTOMBTILES=/home/meteocool/.local/bin/gdal2mbtiles OUT=/home/meteocool/mbtiles/ &") == 0:
		return "OK\n"
	else:
		abort(500)

if __name__ == "__main__":
    syslog.syslog(syslog.LOG_ERR, "meteocool deploy hook server started")
    app.run(port=5099, host='127.0.0.1')
