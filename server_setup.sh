#!/bin/bash

version=v1.1.10

mkdir -p server
cd server

wget https://github.com/undreamai/LlamaLib/releases/download/$version/undreamai-$version-llamacpp-full.zip
wget https://github.com/undreamai/LlamaLib/releases/download/$version/undreamai-$version-llamacpp.zip
wget https://github.com/undreamai/LlamaLib/releases/download/$version/undreamai-$version-server.zip

unzip undreamai-$version-llamacpp.zip
unzip undreamai-$version-server.zip