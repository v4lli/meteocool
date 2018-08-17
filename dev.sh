#!/bin/sh

make docker

docker volume create dwd || true

tmux \
  new-session  "cd frontend/ && npm start; $SHELL" \; \
  split-window "docker run --rm -it -v dwd:/usr/src/app/tmp -p 8071:5000 meteocool_app $SHELL" \; \
  split-window "docker run --rm --name meteocool-tile -v dwd:/data -p 8070:80 klokantech/tileserver-gl ; $SHELL" \; \
  select-layout even-vertical
