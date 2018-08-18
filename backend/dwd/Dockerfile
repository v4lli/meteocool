FROM ubuntu:latest

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev libvips python3 python3-dev python3-pip python3-gdal wget python3-tk cron
ADD crontab /etc/cron.d/dwd-cron
RUN chmod 0644 /etc/cron.d/dwd-cron
RUN crontab /etc/cron.d/dwd-cron
RUN touch /var/log/cron.log
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN pip3 install -r requirements.txt
CMD ["cron", "-f"]
