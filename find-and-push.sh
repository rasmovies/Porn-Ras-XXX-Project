#!/bin/bash

echo "🔍 Mevcut GitHub repository'leri aranıyor..."

# Desktop'taki diğer projelerde GitHub remote'larını bul
FOUND_REPO=""
for dir in ~/Desktop/*/; do
    if [ -d "$dir/.git" ]; then
        REMOTE=$(cd "$dir" && git remote get-url origin 2>/dev/null)
        if [[ "$REMOTE" == *"github.com"* ]]; then
            echo "✅ Bulundu: $dir"
            echo "   Remote: $REMOTE"
            # GitHub kullanıcı adını çıkar
            if [[ "$REMOTE" =~ github.com[:/]([^/]+) ]]; then
                GITHUB_USER="${BASH_REMATCH[1]}"
                echo "   GitHub kullanıcı adı: $GITHUB_USER"
                FOUND_REPO="$REMOTE"
                break
            fi
        fi
    fi
done

if [ -z "$FOUND_REPO" ]; then
    echo "⚠️  Mevcut GitHub repository bulunamadı."
    echo ""
    echo "Lütfen mevcut repository URL'inizi girin:"
    read -p "GitHub repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo "❌ Repository URL gerekli!"
        exit 1
    fi
    
    # URL'den kullanıcı adını çıkar
    if [[ "$REPO_URL" =~ github.com[:/]([^/]+) ]]; then
        GITHUB_USER="${BASH_REMATCH[1]}"
    else
        echo "❌ Geçersiz GitHub URL formatı!"
        exit 1
    fi
else
    # URL'den kullanıcı adını çıkar
    if [[ "$FOUND_REPO" =~ github.com[:/]([^/]+) ]]; then
        GITHUB_USER="${BASH_REMATCH[1]}"
    fi
fi

echo ""
echo "📦 Repository'ye ekleniyor..."

# Mevcut remote varsa kaldır
cd /Users/mertcengiz/Desktop/ftp
if git remote get-url origin &> /dev/null; then
    echo "Mevcut remote kaldırılıyor..."
    git remote remove origin
fi

# Repository adını sor veya varsayılan kullan
read -p "Repository adı (varsayılan: ftp-uploader): " REPO_NAME
REPO_NAME=${REPO_NAME:-ftp-uploader}

# Remote ekle
REPO_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"
echo "Remote ekleniyor: $REPO_URL"
git remote add origin "$REPO_URL"

# Push et
echo ""
echo "📤 GitHub'a push ediliyor..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Başarılı! Repository: https://github.com/$GITHUB_USER/$REPO_NAME"
else
    echo ""
    echo "⚠️  Push başarısız. Repository mevcut değilse önce oluşturmanız gerekiyor:"
    echo "   https://github.com/new"
    echo "   Repository adı: $REPO_NAME"
fi

