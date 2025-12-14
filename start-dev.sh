#!/bin/bash

# Development Server Başlatma Scripti
# Kullanım: ./start-dev.sh

echo "🚀 Development Server Başlatılıyor..."
echo ""

cd "$(dirname "$0")"

# Frontend başlat
echo "📦 Frontend başlatılıyor..."
cd client

# Dependencies kontrolü
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules bulunamadı. Dependencies yükleniyor..."
    npm install
fi

echo ""
echo "✅ Frontend başlatılıyor - http://localhost:3000"
echo "⏳ İlk başlatma 30-60 saniye sürebilir..."
echo ""

# React dev server başlat
npm start






