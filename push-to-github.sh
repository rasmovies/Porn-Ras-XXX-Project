#!/bin/bash
GITHUB_USER="rasmovies"
REPO_NAME="ftp-uploader"

echo "📦 GitHub'a push ediliyor: $GITHUB_USER/$REPO_NAME"
echo ""

cd /Users/mertcengiz/Desktop/ftp

# Remote'u ayarla
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

# Push et
echo "📤 Push ediliyor..."
git push -u origin main 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Başarılı! https://github.com/$GITHUB_USER/$REPO_NAME"
else
    echo ""
    echo "⚠️  Repository bulunamadı veya push başarısız!"
    echo ""
    echo "Lütfen önce repository'yi oluşturun:"
    echo "1. https://github.com/new"
    echo "2. Repository adı: $REPO_NAME"
    echo "3. Oluşturduktan sonra bu scripti tekrar çalıştırın"
fi
