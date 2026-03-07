#!/bin/bash

set -e
cd "$(dirname "$0")"

echo "[1/3] Sanal ortam (venv)..."
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "    venv oluşturuldu."
else
  echo "    venv zaten var."
fi

echo "[2/3] venv aktive ediliyor + paketler yükleniyor..."
source venv/bin/activate
pip install -r requirements.txt

echo "[3/3] Tüm servisler başlatılıyor..."
python run_all.py
