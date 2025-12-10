#!/bin/bash
echo "🚀 Development Server Başlatılıyor..."
echo ""

cd "$(dirname "$0")/client"

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo "❌ Node.js bulunamadı!"
    echo "Lütfen Node.js'i kurun: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js bulundu: $(node --version)"
echo "✅ npm bulundu: $(npm --version)"
echo ""

# Dependencies kontrolü
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules bulunamadı. Dependencies yükleniyor..."
    npm install
    echo ""
fi

echo "✅ Server başlatılıyor..."
echo "⏳ İlk başlatma 30-60 saniye sürebilir..."
echo "📱 Browser'da http://localhost:3000 adresini açın"
echo ""

npm start
