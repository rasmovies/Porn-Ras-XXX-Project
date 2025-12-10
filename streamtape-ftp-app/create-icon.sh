#!/bin/bash
# Icon oluşturma scripti
# Kullanıcının gönderdiği resmi icon.png olarak assets/ klasörüne koyun
# Sonra bu script'i çalıştırın

if [ ! -f "assets/icon.png" ]; then
    echo "❌ assets/icon.png bulunamadı!"
    echo "Lütfen icon dosyasını assets/icon.png olarak kaydedin"
    exit 1
fi

# macOS için .icns oluştur
if command -v iconutil &> /dev/null; then
    echo "📦 macOS icon set oluşturuluyor..."
    mkdir -p icon.iconset
    
    # Farklı boyutlarda icon'lar oluştur (sips kullanarak)
    sips -z 16 16 assets/icon.png --out icon.iconset/icon_16x16.png
    sips -z 32 32 assets/icon.png --out icon.iconset/icon_16x16@2x.png
    sips -z 32 32 assets/icon.png --out icon.iconset/icon_32x32.png
    sips -z 64 64 assets/icon.png --out icon.iconset/icon_32x32@2x.png
    sips -z 128 128 assets/icon.png --out icon.iconset/icon_128x128.png
    sips -z 256 256 assets/icon.png --out icon.iconset/icon_128x128@2x.png
    sips -z 256 256 assets/icon.png --out icon.iconset/icon_256x256.png
    sips -z 512 512 assets/icon.png --out icon.iconset/icon_256x256@2x.png
    sips -z 512 512 assets/icon.png --out icon.iconset/icon_512x512.png
    sips -z 1024 1024 assets/icon.png --out icon.iconset/icon_512x512@2x.png
    
    # .icns dosyası oluştur
    iconutil -c icns icon.iconset -o assets/icon.icns
    rm -rf icon.iconset
    
    echo "✅ assets/icon.icns oluşturuldu!"
else
    echo "⚠️ iconutil bulunamadı, sadece PNG kullanılacak"
fi
