FROM node:8-alpine

RUN apk add --no-cache yarn bash curl
COPY . /tmp/build
RUN cd /tmp/build && yarn && yarn build


FROM alpine:3.7

# install curl
RUN apk add --no-cache ca-certificates
RUN apk add --no-cache --virtual build-dependencies curl \
    && curl -sS 'https://caddyserver.com/download/linux/amd64?plugins=http.ratelimit,http.cors&license=personal&telemetry=off' | tar zxf - -C /tmp/ \
    && mv /tmp/caddy /usr/local/bin/caddy \
    && apk del build-dependencies

RUN test -d /srv || mkdir -p /srv
WORKDIR /srv
COPY --from=0 /tmp/build/dist/ /srv


# expose ports
EXPOSE 80 443

# set caddy entrypoint
ENTRYPOINT ["/usr/local/bin/caddy"]
CMD ["--conf", "/etc/Caddyfile", "--log", "stdout"]
