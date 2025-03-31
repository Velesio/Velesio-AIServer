#!/bin/bash

cd "$(dirname "$0")/shared"

mkdir -p models

docker compose -f docker-compose.yml down
docker compose -f docker-compose.yml up --build -d