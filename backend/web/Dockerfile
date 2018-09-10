FROM alpine:3.7

# install curl
RUN apk add --no-cache ca-certificates
RUN apk add --no-cache --virtual build-dependencies curl \
    && curl -sS 'https://caddyserver.com/download/linux/amd64?plugins=http.cors,http.expires,http.filter,http.ratelimit,http.realip,http.upload&license=personal&telemetry=off' | tar zxf - -C /tmp/ \
    && mv /tmp/caddy /usr/local/bin/caddy \
    && apk del build-dependencies

# expose ports
EXPOSE 80 443

# set workdir
WORKDIR /srv

# set caddy entrypoint
ENTRYPOINT ["/usr/local/bin/caddy"]
CMD ["--conf", "/etc/Caddyfile", "--log", "stdout"]
