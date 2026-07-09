#!/bin/bash

# 1. Jalankan Backend Python di background (&)
echo "Menjalankan Backend Python..."
python api_klinik.py &

# 2. Jalankan Frontend Node.js (biarkan jalan di foreground)
echo "Menjalankan Frontend Node..."
node .output/server/index.mjs