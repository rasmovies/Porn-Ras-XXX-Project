#!/bin/bash

GITHUB_USER="rasmovies"
REPO_NAME="ftp-uploader"

echo "📦 GitHub Repository: $GITHUB_USER/$REPO_NAME"
echo ""

# Remote'u ayarla
cd /Users/mertcengiz/Desktop/ftp
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

echo "🔍 Repository kontrol ediliyor..."
# Repository var mı kontrol et
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://github.com/$GITHUB_USER/$REPO_NAME")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Repository mevcut, push ediliyor..."
    git push -u origin main
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Başarılı! https://github.com/$GITHUB_USER/$REPO_NAME"
    else
        echo "❌ Push başarısız!"
    fi
else
    echo "⚠️  Repository bulunamadı: https://github.com/$GITHUB_USER/$REPO_NAME"
    echo ""
    echo "Lütfen önce repository'yi oluşturun:"
    echo "1. https://github.com/new adresine gidin"
    echo "2. Repository adı: $REPO_NAME"
    echo "3. Public veya Private seçin"
    echo "4. 'Create repository' butonuna tıklayın"
    echo ""
    echo "Repository oluşturduktan sonra bu scripti tekrar çalıştırın:"
    echo "   ./create-and-push.sh"
    echo ""
    echo "Veya manuel olarak:"
    echo "   git push -u origin main"
fi

