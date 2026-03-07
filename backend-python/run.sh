#!/bin/bash
# Venv aç (aktive et), paketleri yükle, haber.py çalıştır

set -e
cd "$(dirname "$0")"

echo "[1/3] Sanal ortam (venv)..."
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "    venv oluşturuldu."
else
  echo "    venv zaten var."
fi

# Venv'i bu shell'de aktive et; aşağıdaki komutlar hep venv içinde çalışır
echo "[2/3] venv aktive ediliyor + paketler yükleniyor..."
source venv/bin/activate
pip install -r requirements.txt

echo "[3/3] haber.py çalıştırılıyor (venv aktif)..."
python haber.py
