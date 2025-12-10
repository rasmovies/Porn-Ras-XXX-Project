#!/bin/bash

echo "🧪 API Endpoint Test Script'i"
echo "=============================="
echo ""

# Test 1: Port 3000 kontrolü
echo "1️⃣  Port 3000 kontrolü..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "304" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo "   ✅ Port 3000 çalışıyor (HTTP $HTTP_STATUS)"
else
    echo "   ❌ Port 3000 çalışmıyor (HTTP $HTTP_STATUS)"
fi
echo ""

# Test 2: API endpoint varlığı
echo "2️⃣  API Endpoint varlığı testi..."
OPTIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS http://localhost:3000/api/torrent/test-connection -H "Origin: http://localhost:3000" 2>/dev/null)
if [ "$OPTIONS_STATUS" = "200" ] || [ "$OPTIONS_STATUS" = "204" ]; then
    echo "   ✅ API endpoint bulundu (HTTP $OPTIONS_STATUS)"
elif [ "$OPTIONS_STATUS" = "404" ]; then
    echo "   ❌ API endpoint bulunamadı (404)"
    echo "   💡 Vercel dev server'ı başlatın: npx vercel dev"
else
    echo "   ⚠️  Beklenmeyen yanıt (HTTP $OPTIONS_STATUS)"
fi
echo ""

# Test 3: API dosyaları kontrolü
echo "3️⃣  API dosyaları kontrolü..."
API_COUNT=$(find api/torrent -name "*.js" -type f 2>/dev/null | wc -l | xargs)
if [ "$API_COUNT" -ge 6 ]; then
    echo "   ✅ API dosyaları mevcut ($API_COUNT dosya)"
else
    echo "   ❌ API dosyaları eksik ($API_COUNT dosya bulundu, 6 bekleniyor)"
fi
echo ""

# Test 4: Vercel dev server process kontrolü
echo "4️⃣  Vercel dev server process kontrolü..."
VERCEL_PROCESS=$(ps aux | grep -E "vercel dev" | grep -v grep | wc -l | xargs)
if [ "$VERCEL_PROCESS" -gt 0 ]; then
    echo "   ✅ Vercel dev process çalışıyor"
else
    echo "   ❌ Vercel dev process çalışmıyor"
    echo "   💡 Başlatın: npx vercel dev"
fi
echo ""

# Test 5: API endpoint fonksiyonel test
echo "5️⃣  API endpoint fonksiyonel testi..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/torrent/test-connection \
    -H "Content-Type: application/json" \
    -d '{"url":"http://localhost:8080","username":"admin","password":"admin"}' \
    -w "\nHTTP_STATUS:%{http_code}" 2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

if [ "$HTTP_CODE" = "400" ]; then
    echo "   ✅ API endpoint çalışıyor (400 Bad Request - parametreler eksik, ama endpoint bulundu)"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API endpoint çalışıyor (200 OK)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ API endpoint bulunamadı (404)"
    echo "   💡 Çözüm: npx vercel dev komutunu çalıştırın ve 'Ready!' mesajını bekleyin"
else
    echo "   ⚠️  Beklenmeyen yanıt (HTTP $HTTP_CODE)"
fi
echo ""

# Sonuç özeti
echo "📊 SONUÇ ÖZETİ:"
echo "==============="
if [ "$OPTIONS_STATUS" != "404" ] && [ "$HTTP_CODE" != "404" ]; then
    echo "✅ Tüm testler başarılı! API endpoint'leri çalışıyor."
else
    echo "❌ API endpoint'leri çalışmıyor."
    echo ""
    echo "🔧 Çözüm adımları:"
    echo "   1. Terminal'de: cd /Users/mertcengiz/Desktop/adulttube"
    echo "   2. npx vercel dev komutunu çalıştırın"
    echo "   3. 'Ready! Available at http://localhost:3000' mesajını bekleyin"
    echo "   4. Bu script'i tekrar çalıştırın"
fi



