#!/bin/bash

# VPS Email Setup Script
# Bu script Proton Mail Bridge'i backend'e bağlar

set -e

echo "🚀 VPS Email Setup Başlatılıyor..."
echo ""

# 1. Proton Mail Bridge durumunu kontrol et
echo "📧 1. Proton Mail Bridge durumu kontrol ediliyor..."
if systemctl is-active --quiet proton-bridge; then
    echo "✅ Proton Mail Bridge çalışıyor"
else
    echo "⚠️  Proton Mail Bridge çalışmıyor, başlatılıyor..."
    sudo systemctl start proton-bridge
    sleep 3
    if systemctl is-active --quiet proton-bridge; then
        echo "✅ Proton Mail Bridge başlatıldı"
    else
        echo "❌ Proton Mail Bridge başlatılamadı!"
        exit 1
    fi
fi

# 2. Bridge SMTP bilgilerini al
echo ""
echo "📋 2. Bridge SMTP bilgileri alınıyor..."
BRIDGE_LOGS=$(sudo journalctl -u proton-bridge -n 100 --no-pager)
SMTP_PORT=$(echo "$BRIDGE_LOGS" | grep -oP 'SMTP.*?listening on \K[0-9]+' | head -1 || echo "1025")
SMTP_HOST=$(echo "$BRIDGE_LOGS" | grep -oP 'SMTP.*?listening on \K[0-9.]+' | head -1 || echo "127.0.0.1")

echo "   SMTP Host: $SMTP_HOST"
echo "   SMTP Port: $SMTP_PORT"

# 3. Bridge config dosyasından username al
BRIDGE_CONFIG="$HOME/.config/protonmail/bridge/prefs.json"
if [ -f "$BRIDGE_CONFIG" ]; then
    BRIDGE_USERNAME=$(grep -oP '"User":\s*"\K[^"]+' "$BRIDGE_CONFIG" | head -1 || echo "")
    if [ -n "$BRIDGE_USERNAME" ]; then
        echo "   Username: $BRIDGE_USERNAME"
    fi
fi

# 4. Backend dizinine git
BACKEND_DIR="/var/www/adulttube-backend/server"
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend dizini bulunamadı: $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"
echo ""
echo "📁 Backend dizini: $(pwd)"

# 5. .env dosyasını kontrol et veya oluştur
echo ""
echo "⚙️  3. .env dosyası kontrol ediliyor..."
if [ ! -f ".env" ]; then
    echo "   .env dosyası bulunamadı, .env.example'dan oluşturuluyor..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env dosyası oluşturuldu"
    else
        echo "⚠️  .env.example bulunamadı, yeni .env oluşturuluyor..."
        cat > .env << EOF
PORT=5000
NODE_ENV=production
PROTON_SMTP_HOST=$SMTP_HOST
PROTON_SMTP_PORT=$SMTP_PORT
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=
PROTON_SMTP_PASSWORD=
PROTON_FROM_EMAIL=
PROTON_FROM_NAME=PORNRAS
EOF
        echo "✅ .env dosyası oluşturuldu"
    fi
else
    echo "✅ .env dosyası mevcut"
fi

# 6. .env dosyasını güncelle
echo ""
echo "📝 4. .env dosyası güncelleniyor..."

# SMTP Host güncelle
sed -i "s|^PROTON_SMTP_HOST=.*|PROTON_SMTP_HOST=$SMTP_HOST|" .env

# SMTP Port güncelle
sed -i "s|^PROTON_SMTP_PORT=.*|PROTON_SMTP_PORT=$SMTP_PORT|" .env

# Username varsa güncelle
if [ -n "$BRIDGE_USERNAME" ]; then
    sed -i "s|^PROTON_SMTP_USERNAME=.*|PROTON_SMTP_USERNAME=$BRIDGE_USERNAME|" .env
    sed -i "s|^PROTON_FROM_EMAIL=.*|PROTON_FROM_EMAIL=$BRIDGE_USERNAME|" .env
fi

echo "✅ .env dosyası güncellendi"

# 7. Kullanıcıdan Bridge password'ü al
echo ""
echo "🔐 5. Bridge Password gerekli"
echo "   Bridge password'ü Bridge GUI'den veya config dosyasından alabilirsiniz."
echo "   Şu anda .env dosyasında PROTON_SMTP_PASSWORD boş."
echo ""
read -p "Bridge password'ü girmek ister misiniz? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -sp "Bridge Password: " BRIDGE_PASSWORD
    echo
    sed -i "s|^PROTON_SMTP_PASSWORD=.*|PROTON_SMTP_PASSWORD=$BRIDGE_PASSWORD|" .env
    echo "✅ Password güncellendi"
fi

# 8. .env dosyasını göster
echo ""
echo "📄 6. Güncel .env içeriği:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat .env
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 9. Backend'i yeniden başlat
echo ""
echo "🔄 7. Backend yeniden başlatılıyor..."
pm2 restart adulttube-backend || pm2 start server.js --name adulttube-backend

sleep 2

# 10. Logları kontrol et
echo ""
echo "📊 8. Backend logları (son 20 satır):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 logs adulttube-backend --lines 20 --nostream
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "✅ Setup tamamlandı!"
echo ""
echo "📧 Email test etmek için:"
echo "   curl -X POST http://localhost:5000/api/email/verification \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"test@example.com\",\"username\":\"TestUser\",\"verifyUrl\":\"https://www.pornras.com/verify?token=test\"}'"
echo ""


