#!/bin/bash

# GitHub ve Vercel Deployment Script

echo "🚀 Deployment başlatılıyor..."

# GitHub repository oluşturma (eğer gh CLI kuruluysa)
if command -v gh &> /dev/null; then
    echo "📦 GitHub repository oluşturuluyor..."
    gh repo create ftp-uploader --public --source=. --remote=origin --push
else
    echo "⚠️  GitHub CLI bulunamadı. Manuel olarak repository oluşturmanız gerekiyor."
    echo "1. https://github.com/new adresine gidin"
    echo "2. Repository adı: ftp-uploader"
    echo "3. Oluşturduktan sonra şu komutları çalıştırın:"
    echo "   git remote add origin https://github.com/KULLANICI_ADINIZ/ftp-uploader.git"
    echo "   git push -u origin main"
fi

# Vercel deployment
if command -v vercel &> /dev/null; then
    echo "🌐 Vercel'e deploy ediliyor..."
    vercel --prod
else
    echo "⚠️  Vercel CLI bulunamadı. Kurulum yapılıyor..."
    npm install -g vercel
    echo "🌐 Vercel'e deploy ediliyor..."
    vercel --prod
fi

echo "✅ Deployment tamamlandı!"

