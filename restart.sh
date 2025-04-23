#!/bin/bash

cd velesio

docker compose down
docker build -t teocholakov/velesio-aiserver .
docker compose up -d