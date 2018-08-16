#!/bin/sh

docker volume create dwd || true

tmux \
  new-session  "cd frontend/ && npm start; $SHELL" \; \
  split-window "cd backend/ && docker build -t meteocool . && docker run -it --rm -v dwd:/usr/src/app/tmp meteocool && docker run --rm --name meteocool-tile -v dwd:/data -p 8080:80 klokantech/tileserver-gl ; $SHELL" \; \
  split-window "echo hier muss der docker mit der backend ws app rein... ; read" \; \
  select-layout even-vertical
