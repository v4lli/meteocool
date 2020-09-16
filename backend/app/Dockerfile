FROM python:3.6-alpine

ADD requirements.txt /usr/src/app/requirements.txt
WORKDIR /usr/src/app
RUN apk --update add --virtual build-dependencies build-base \
    && pip install --no-cache-dir -r requirements.txt \
    && apk del build-dependencies && apk add vim bash \
    && rm -rf /var/cache/apk/*
COPY . /usr/src/app
EXPOSE 5000
CMD ["sh", "/usr/src/app/start.sh"]
