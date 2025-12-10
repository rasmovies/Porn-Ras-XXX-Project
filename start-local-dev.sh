#!/bin/bash

# Local Development Server Başlatma Script'i
# Vercel dev server'ı başlatır

echo "🚀 Local Development Server Başlatılıyor..."
echo ""
echo "📁 Çalışma dizini: $(pwd)"
echo ""

# Port kontrolü
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 zaten kullanımda!"
    echo ""
    echo "Mevcut process'i görmek için:"
    echo "  lsof -i:3000"
    echo ""
    echo "Process'i durdurmak için:"
    echo "  lsof -ti:3000 | xargs kill"
    echo ""
    read -p "Devam etmek istiyor musunuz? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Vercel dev server başlatılıyor..."
echo ""
echo "📝 Notlar:"
echo "  - İlk çalıştırmada Vercel hesabınıza giriş yapmanız istenebilir"
echo "  - Proje bağlantısı sorulabilir (mevcut projeyi seçin)"
echo "  - Server başladığında: http://localhost:3000"
echo ""
echo "🛑 Durdurmak için: Ctrl+C"
echo ""

# Vercel dev server'ı başlat
npx vercel dev



