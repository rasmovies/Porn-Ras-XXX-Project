# Channels Verilerini Kontrol Etme Rehberi

## Adım 1: Browser Console'da Verileri Kontrol Edin

1. Sitede `F12` tuşuna basın (Developer Tools)
2. Console sekmesine geçin
3. Aşağıdaki komutu yazın:

```javascript
JSON.parse(localStorage.getItem('adminChannels'))
```

Bu komut size localStorage'da kayıtlı tüm channels'ları gösterecektir.

## Adım 2: Verileri JSON Formatında Kopyalayın

Console'da görünen veriyi kopyalayıp bir JSON dosyasına kaydedin.

## Adım 3: SQL Dosyası Oluşturun

Kopyaladığınız verileri kullanarak `client/import_channels_to_supabase.sql` dosyasını güncelleyin.

Örnek format:

```sql
INSERT INTO channels (name, description, thumbnail, banner, subscriber_count)
VALUES 
  ('Channel Name 1', 'Description 1', 'thumbnail_url', 'banner_url', 1000),
  ('Channel Name 2', 'Description 2', 'thumbnail_url', 'banner_url', 2000)
ON CONFLICT (name) DO NOTHING;
```

## Adım 4: SQL Dosyasını Supabase'de Çalıştırın

1. Supabase SQL Editor'a gidin
2. `import_channels_to_supabase.sql` dosyasının içeriğini yapıştırın
3. Run butonuna tıklayın

## Alternatif: Admin Panelden Yeni Channel Ekleyin

Admin panelden yeni channel eklediğinizde otomatik olarak Supabase'e kaydedilecektir.




