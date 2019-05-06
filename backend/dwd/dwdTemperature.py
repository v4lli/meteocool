"""
N. Loser, loser@hm.edu ,https://github.com/nina2244

based on: marians, https://github.com/marians/dwd-weather
"""


from ftplib import FTP
from io import BytesIO
import re
import math
import os
from zipfile import ZipFile
import time
import pickle

class dwdTemperature():
    # DWD FTP server host name
    server = "ftp-cdc.dwd.de"

    # FTP server path for our files
    serverpath = "/pub/CDC/observations_germany/climate/10_minutes/air_temperature/now/"

    def __init__(self):
        self.nearest_station_id = None

        self.user = "anonymous"
        self.passwd = "guest@example.com"

        self.verbosity = 0

        self.cachepath = "/tmp"

        try:
            self.station_map = pickle.load(open("/tmp/station_map.p", "rb"))
        except IOError:
            self.station_map = {}
            self.station_map["timestamp"] = None
            self.station_map["list"] = []

        try:
            self.temperature_map = pickle.load(open("/tmp/temperatur_map.p", "rb"))
        except IOError:
            self.temperature_map = {}
            self.temperature_map["timestamp"] = time.time()
            self.temperature_map["list"] = []

    def get_stations(self):
        """
        Load station meta data from DWD server every day.
        """
        if (self.station_map["timestamp"] == None or self.station_map["timestamp"] + 86400 < time.time() ):
            print ("station refresh...")
            self.station_map["list"] = []
            # new timestamp
            self.station_map["timestamp"] = time.time()

            if self.verbosity > 0:
                print("Importing stations data from FTP server")
            ftp = FTP(self.server)
            ftp.login(self.user, self.passwd)

            ftp.cwd(self.serverpath)

            # get directory contents
            serverfiles = []
            ftp.retrlines('NLST', serverfiles.append)
            for filename in serverfiles:
                if "Beschreibung_Stationen" not in filename:
                    continue
                if self.verbosity > 1:
                    print("Reading file %s/%s" % (self.serverpath, filename))
                f = BytesIO()

                ftp.retrbinary(("RETR %s" % filename), f.write)
                self.extrakt_importatnt_station_data(f.getvalue())
                f.close()

    def extrakt_importatnt_station_data(self, content):
        """
        Takes the content of one station metadata file
        and imports it into the database
        """
        content = content.decode("latin1")
        content = content.strip()
        content = content.replace('\r', '')
        content = content.replace('\n\n', '\n')


        linecount = 0
        for line in content.split("\n"):
            linecount += 1
            line = line.strip()
            if line == "" or line == u'\x1a':
                continue
                # print linecount, line
            if linecount > 2:
                # frist 7 fields
                parts = re.split(r"\s+", line, 6)
                (name, bundesland) = parts[6].rsplit(" ", 1)
                name = name.strip()
                del parts[6]
                parts.append(name)
                parts.append(bundesland)
                # print parts
                for n in range(len(parts)):
                    parts[n] = parts[n].strip()
                station_id = int(parts[0])
                station_height = int(parts[3])
                station_lat = float(parts[4])
                station_lon = float(parts[5])
                station_start = int(parts[1])
                station_end = int(parts[2])
                station_name = parts[6]
                station_state = parts[7]

                self.station_map["list"].append([station_id,station_lat,station_lon])

                #print (station_name + ", " + str(station_id) + ": " + str(station_lat) + ", " + str(station_lon))

        pickle.dump(self.station_map,open("/tmp/station_map.p", "wb"))

    def find_next_station(self, lat, lon):
        closest = None
        closest_distance = 99999999999
        for n in range(self.station_map["list"].__len__()):
            d = self.haversine_distance((lat, lon),
                                    (self.station_map["list"][n][1], self.station_map["list"][n][2]))
            if d < closest_distance:
                closest = self.station_map["list"][n][0]
                #print(self.station_map["list"][n][0])
                #print(str(self.station_map["list"][n][1]) + ";" + str(self.station_map["list"][n][2]))
                closest_distance = d

        return closest

    def haversine_distance(self, origin, destination):
        lat1, lon1 = origin
        lat2, lon2 = destination
        radius = 6371000  # meters

        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2) * math.sin(dlat / 2) + math.cos(math.radians(lat1)) \
            * math.cos(math.radians(lat2)) * math.sin(dlon / 2) * math.sin(dlon / 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        d = radius * c
        return d

    def get_current_temperatur_data(self, station_id):
        """
        GET new temperature meta data from DWD server.
        """
        print ("temperature refresh...")

        self.temperature_map["timestamp"] = time.time()

        if self.temperature_map["list"] != None:
            for n in range(self.temperature_map["list"].__len__() - 1):
                if station_id == self.temperature_map["list"][n][0]:
                    self.temperature_map["list"].remove(self.temperature_map["list"][n])

        if self.verbosity > 0:
            print("Importing stations data from FTP server")
        ftp = FTP(self.server)
        ftp.login(self.user, self.passwd)

        ftp.cwd(self.serverpath)

        # get directory contents
        serverfiles = []
        importfiles = []
        ftp.retrlines('NLST', serverfiles.append)
        for filename in serverfiles:
            output_path = self.cachepath + os.sep + filename
            data_filename = "data_%s.txt" % (station_id)
            if str(station_id) not in filename:
                continue
            if self.verbosity > 1:
                print("Reading file %s/%s" % (self.serverpath, filename))
            ftp.retrbinary('RETR ' + filename, open(output_path, 'wb').write)

            #Extrakt form zip-File
            with ZipFile(output_path) as myzip:
                for f in myzip.infolist():

                    # This is the data file
                    if f.filename.startswith('produkt_'):
                        if self.verbosity > 1:
                            print("Reading from Zip: %s" % (f.filename))
                        myzip.extract(f, self.cachepath + os.sep)
                        os.rename(self.cachepath + os.sep + f.filename,
                                  self.cachepath + os.sep + data_filename)

                        importfiles.append([self.cachepath + os.sep + data_filename])
            os.remove(output_path)

            #read temperatur data file
            temperature_data_document = open(importfiles[0][0], "r")
            content = temperature_data_document.readlines()
            temperature_data_document.close()

            #scip the first line (only the heads of the list)
            content.pop(0)

            #get last line (current data)
            line = content[content.__len__() - 1]

            # for line in content:
            line = line.replace("\r", "")
            line = line.replace("\n\n", "\n")

            # split line in to parts
            parts = re.split(r";", line, 8)
            # print parts
            for n in range(len(parts)):
                parts[n] = parts[n].strip()
                # print parts[n]
                mess_datum = int(parts[1])  # UTC
                pressure = float(parts[3])
                temperature = float(parts[4])
                dew = float(parts[7])  # Taupunkt

            self.temperature_map["list"].append([station_id, temperature])

            pickle.dump(self.temperature_map,open("/tmp/temperature_map.p", "wb"))

            return temperature

    def get_current_temperature(self, station_id):
        if self.temperature_map["list"] != None:
            for n in range(self.temperature_map["list"].__len__()):
                if (station_id == self.temperature_map["list"][n][0] and (self.temperature_map["timestamp"] + 60) > time.time()):
                    return self.temperature_map["list"][n][1]

        return self.get_current_temperatur_data(station_id)


if __name__ == "__main__":
    d = dwdTemperature()
    timestamp = time.time()
    print ("start time: " + str(timestamp))
    while True:
        lat = float(input("Latitude(Breitengrad):\n"))
        lon = float(input("Longitude(Laengengrad):\n"))
        timestamp = time.time()
        print ("time: " + str(timestamp))
        d.get_stations()
        station_id = d.find_next_station(lat, lon)
        #station_id = d.find_next_station(48.140458,11.557766)#Muenchen-Stadt
        print(station_id)
        currend_temperature = d.get_current_temperature(station_id)
        print(currend_temperature)
