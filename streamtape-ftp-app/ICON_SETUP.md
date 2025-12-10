# Icon Kurulum Kılavuzu

## Logo Dosyasını Ekleme

1. Gönderdiğiniz resmi `assets/icon.png` olarak kaydedin
2. Terminal'de şu komutu çalıştırın:

```bash
cd streamtape-ftp-app
./create-icon.sh
```

Bu script otomatik olarak macOS için `.icns` dosyası oluşturacak.

## Manuel Kurulum

Eğer script çalışmazsa:

1. Resmi `assets/icon.png` olarak kaydedin (1024x1024 veya daha büyük önerilir)
2. Uygulama PNG'yi de kullanabilir, ancak `.icns` formatı macOS'ta daha iyi görünür

## Icon Boyutları

macOS için önerilen boyutlar:
- 16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024 (ve @2x versiyonları)

Script otomatik olarak tüm boyutları oluşturur.

