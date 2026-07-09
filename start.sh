#!/bin/bash

echo "Menjalankan Backend Python..."
python3 api_klinik.py &

echo "Menjalankan Frontend Node..."
node .output/server/index.mjs