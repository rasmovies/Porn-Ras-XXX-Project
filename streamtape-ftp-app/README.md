# Streamtape FTP Client

FileZilla benzeri macOS FTP uygulaması - Streamtape FTP sunucusuna bağlanmak için.

## Özellikler

- ✅ Streamtape FTP'ye otomatik bağlantı
- ✅ Yerel ve uzak dosya yönetimi
- ✅ Drag & drop dosya yükleme
- ✅ Yükleme kuyruğu ve ilerleme takibi
- ✅ Klasör navigasyonu (breadcrumb)
- ✅ macOS native görünüm

## Kurulum

```bash
cd streamtape-ftp-app
npm install
```

## Çalıştırma

```bash
npm start
```

## Build (macOS .app ve .dmg)

```bash
npm run build:mac
```

Build edilen dosyalar `dist/` klasöründe olacak.

## Kullanım

1. Uygulamayı başlatın
2. "🔌 Bağlan" butonuna tıklayın
3. Sol panelden yerel dosyaları seçin
4. "⬆️ Yükle" butonuna tıklayın veya dosyaları sağ panele sürükleyin
5. Yükleme kuyruğunda ilerlemeyi takip edin

## Teknik Detaylar

- **Framework**: Electron
- **FTP Library**: basic-ftp
- **Platform**: macOS

## Notlar

- Streamtape FTP bilgileri `main.js` içinde hardcoded olarak tanımlıdır
- Güvenlik için production'da environment variables kullanılmalıdır

