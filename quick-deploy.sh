#!/bin/bash

echo "🚀 Hızlı Deployment Başlatılıyor..."
echo ""

# 1. GitHub'a push (eğer remote yoksa)
if ! git remote get-url origin &> /dev/null; then
    echo "📦 GitHub repository bilgisi bulunamadı."
    echo "Lütfen önce GitHub'da repository oluşturun:"
    echo "1. https://github.com/new adresine gidin"
    echo "2. Repository adı: ftp-uploader"
    echo "3. Oluşturduktan sonra şu komutu çalıştırın:"
    echo "   git remote add origin https://github.com/KULLANICI_ADINIZ/ftp-uploader.git"
    echo ""
    read -p "GitHub repository URL'iniz var mı? (y/n): " has_repo
    
    if [ "$has_repo" = "y" ]; then
        read -p "Repository URL'ini girin: " repo_url
        git remote add origin "$repo_url"
        echo "✅ Remote eklendi: $repo_url"
    else
        echo "⚠️  GitHub push atlandı. Manuel olarak yapabilirsiniz."
    fi
fi

# 2. GitHub'a push
if git remote get-url origin &> /dev/null; then
    echo "📤 GitHub'a push ediliyor..."
    git push -u origin main 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ GitHub'a push başarılı!"
    else
        echo "⚠️  GitHub push hatası. Devam ediliyor..."
    fi
fi

echo ""
echo "🌐 Vercel'e deploy ediliyor..."
echo ""

# 3. Vercel deployment
npx vercel --prod --yes 2>&1

echo ""
echo "✅ Deployment işlemleri tamamlandı!"
echo ""
echo "📝 Not: Vercel serverless olduğu için dosya izleme özelliği çalışmayacaktır."
echo "   Tam özellikler için Railway.app veya Render.com kullanmanızı öneririz."

