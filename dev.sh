#!/bin/sh

docker volume create dwd || true

tmux \
  new-session  "cd frontend/ && npm start; $SHELL" \; \
  split-window "cd backend/ && docker build -t meteocool . && docker run -it -v dwd:/usr/src/app/tmp -p 8071:8069 meteocool; $SHELL" \; \
  split-window "docker run --rm --name meteocool-tile -v dwd:/data -p 8070:80 klokantech/tileserver-gl ; $SHELL" \; \
  select-layout even-vertical
