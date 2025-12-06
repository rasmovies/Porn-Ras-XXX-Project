# Streamtape FTP Otomatik Yükleme Uygulaması

Streamtape FTP sunucusuna otomatik dosya yükleme web uygulaması.

## Özellikler

- 📁 Ana dizindeki video dosyalarını otomatik izleme
- 🚀 Otomatik FTP yükleme
- ✅ Başarılı yüklemeleri "gönderilenler" klasörüne taşıma
- 🎨 Modern, koyu temalı arayüz
- 🔔 Web içi bildirim sistemi
- 🔊 Başarılı işlemler ve hatalar için ses bildirimleri

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Sunucuyu başlatın:
```bash
npm start
```

3. Tarayıcıda açın:
```
http://localhost:3000
```

## Kullanım

1. Video dosyalarınızı `yuklenecekler` klasörüne kopyalayın
2. Uygulama otomatik olarak dosyaları tespit edip FTP'ye yükler
3. Başarılı yüklemeler `gönderilenler` klasörüne taşınır

## Desteklenen Formatlar

- MP4
- AVI
- MOV
- MKV
- WMV
- FLV
- WebM
- M4V

