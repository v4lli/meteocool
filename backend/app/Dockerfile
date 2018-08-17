FROM ubuntu:latest

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y python3 python3-dev python3-pip
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN pip3 install -r requirements.txt
EXPOSE 5000
CMD env LC_ALL=C.UTF-8 LANG=C.UTF-8 FLASK_APP=app.py flask run -h 0.0.0.0
