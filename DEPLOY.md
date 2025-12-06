# Deployment Talimatları

## GitHub'a Push Etme

### Otomatik (Script ile)
```bash
./quick-deploy.sh
```

### Manuel
1. GitHub'da yeni bir repository oluşturun: https://github.com/new
2. Repository adını belirleyin (örn: `ftp-uploader`)
3. Aşağıdaki komutları çalıştırın:

```bash
git remote add origin https://github.com/KULLANICI_ADINIZ/ftp-uploader.git
git branch -M main
git push -u origin main
```

## Vercel'e Deploy Etme

### ⚠️ ÖNEMLİ UYARI

Bu uygulama **sürekli çalışan bir sunucu** gerektirir. Vercel serverless functions kullandığı için:

- ✅ API endpoint'leri çalışır
- ❌ Dosya izleme (chokidar) çalışmaz
- ❌ Otomatik yükleme özelliği çalışmaz
- ❌ Socket.io real-time özellikleri sınırlı olabilir

### Vercel Deployment Adımları

1. Vercel hesabınıza giriş yapın: https://vercel.com
2. "New Project" butonuna tıklayın
3. GitHub repository'nizi seçin
4. Ayarlar:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (boş bırakın)
   - Output Directory: (boş bırakın)
5. "Deploy" butonuna tıklayın

### Alternatif Platformlar (Önerilen)

Bu uygulama için daha uygun platformlar:

#### Railway.app
```bash
railway login
railway init
railway up
```

#### Render.com
1. https://render.com adresine gidin
2. "New Web Service" seçin
3. GitHub repository'nizi bağlayın
4. Build Command: `npm install`
5. Start Command: `npm start`

#### Heroku
```bash
heroku create ftp-uploader
git push heroku main
```

## Environment Variables

Eğer FTP bilgilerini environment variable olarak kullanmak isterseniz:

```bash
# Vercel
vercel env add FTP_HOST
vercel env add FTP_USER
vercel env add FTP_PASSWORD

# Railway
railway variables set FTP_HOST=ftp.streamtape.com
railway variables set FTP_USER=e3eddd5f523e3391352b
railway variables set FTP_PASSWORD=4Av234M6QRtK30j
```

