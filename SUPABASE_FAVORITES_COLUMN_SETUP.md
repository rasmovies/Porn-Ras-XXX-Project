# Supabase'e `favorites` Kolonu Ekleme Rehberi

Bu rehber, Supabase'de `videos` tablosuna `favorites` kolonu ekleme işlemini adım adım açıklar.

## Yöntem 1: Supabase Dashboard (Önerilen - En Kolay)

### Adım 1: Supabase Dashboard'a Giriş
1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenize giriş yapın
3. Sol menüden **"Table Editor"** veya **"SQL Editor"** seçeneğini seçin

### Adım 2: SQL Editor ile Kolon Ekleme
1. Sol menüden **"SQL Editor"** seçeneğine tıklayın
2. Yeni bir query oluşturun (veya mevcut bir query'i kullanın)
3. Aşağıdaki SQL komutunu yapıştırın:

```sql
-- videos tablosuna favorites kolonu ekle
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS favorites INTEGER DEFAULT 0;

-- Mevcut videolar için favorites değerini 0 olarak ayarla (eğer NULL ise)
UPDATE videos 
SET favorites = 0 
WHERE favorites IS NULL;

-- favorites kolonunun NULL olamayacağını garanti et
ALTER TABLE videos 
ALTER COLUMN favorites SET DEFAULT 0,
ALTER COLUMN favorites SET NOT NULL;
```

4. **"Run"** veya **"Execute"** butonuna tıklayın
5. Başarılı mesajını görmelisiniz

### Adım 3: Doğrulama
1. Sol menüden **"Table Editor"** seçeneğine gidin
2. **"videos"** tablosunu seçin
3. Tablonun kolonlarını kontrol edin
4. `favorites` kolonunun eklendiğini ve varsayılan değerinin `0` olduğunu doğrulayın

## Yöntem 2: Table Editor ile Manuel Ekleme

### Adım 1: Table Editor'a Giriş
1. Supabase Dashboard'da sol menüden **"Table Editor"** seçeneğine tıklayın
2. **"videos"** tablosunu seçin

### Adım 2: Yeni Kolon Ekleme
1. Tablonun sağ üst köşesindeki **"Add Column"** veya **"+"** butonuna tıklayın
2. Aşağıdaki bilgileri girin:
   - **Column Name:** `favorites`
   - **Type:** `int8` veya `integer`
   - **Default Value:** `0`
   - **Is Nullable:** ❌ (işaretli OLMAMALI - NOT NULL olmalı)
3. **"Save"** veya **"Add Column"** butonuna tıklayın

### Adım 3: Mevcut Kayıtları Güncelleme
1. SQL Editor'a gidin
2. Aşağıdaki komutu çalıştırın:

```sql
-- Mevcut videolar için favorites değerini 0 olarak ayarla
UPDATE videos 
SET favorites = 0 
WHERE favorites IS NULL;
```

## Yöntem 3: Migration Script (Gelişmiş)

Eğer migration script kullanmak istiyorsanız:

1. Supabase Dashboard'da **"SQL Editor"** seçeneğine gidin
2. Aşağıdaki migration script'ini çalıştırın:

```sql
-- Migration: Add favorites column to videos table
-- Created: 2025-01-XX
-- Description: Adds favorites count column to track video favorites

BEGIN;

-- Add favorites column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'videos' 
        AND column_name = 'favorites'
    ) THEN
        ALTER TABLE videos 
        ADD COLUMN favorites INTEGER NOT NULL DEFAULT 0;
        
        -- Update existing records
        UPDATE videos 
        SET favorites = 0 
        WHERE favorites IS NULL;
        
        RAISE NOTICE 'favorites column added successfully';
    ELSE
        RAISE NOTICE 'favorites column already exists';
    END IF;
END $$;

COMMIT;
```

## Doğrulama ve Test

### 1. Kolonun Eklendiğini Kontrol Etme
```sql
-- videos tablosunun yapısını kontrol et
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'videos'
AND column_name = 'favorites';
```

Bu sorgu şu sonucu vermeli:
```
column_name | data_type | column_default | is_nullable
------------|-----------|----------------|-------------
favorites   | integer   | 0              | NO
```

### 2. Mevcut Videoları Kontrol Etme
```sql
-- Tüm videoların favorites değerlerini kontrol et
SELECT id, title, favorites 
FROM videos 
LIMIT 10;
```

### 3. Test Verisi Ekleme
```sql
-- Bir videonun favorites sayısını artır (test için)
UPDATE videos 
SET favorites = favorites + 1 
WHERE id = 'your-video-id-here';
```

## Sorun Giderme

### Hata: "column already exists"
- Bu hata, kolon zaten eklenmiş demektir
- Devam edebilirsiniz, herhangi bir işlem yapmanıza gerek yok

### Hata: "permission denied"
- Supabase projenizde yeterli yetkiniz olmayabilir
- Proje sahibi veya admin yetkisine sahip bir hesapla giriş yapın

### Hata: "relation videos does not exist"
- `videos` tablosu henüz oluşturulmamış
- Önce tabloyu oluşturmanız gerekiyor

## Önemli Notlar

1. **Backup Alın:** Büyük bir production veritabanında çalışıyorsanız, önce backup alın
2. **Downtime:** Bu işlem genellikle çok hızlıdır (< 1 saniye), ancak büyük tablolarda daha uzun sürebilir
3. **Default Value:** Tüm yeni videolar otomatik olarak `favorites = 0` ile oluşturulacak
4. **Existing Data:** Mevcut videolar için `favorites` değeri `0` olarak ayarlanacak

## Sonraki Adımlar

Kolon eklendikten sonra:
1. Uygulamanızı yeniden deploy edin (Vercel)
2. Yeni videolar otomatik olarak `favorites = 0` ile oluşturulacak
3. Kullanıcılar videolara kalp verebilecek ve sayı artacak

## SQL Komutları Özeti

```sql
-- 1. Kolon ekle
ALTER TABLE videos ADD COLUMN IF NOT EXISTS favorites INTEGER DEFAULT 0;

-- 2. Mevcut kayıtları güncelle
UPDATE videos SET favorites = 0 WHERE favorites IS NULL;

-- 3. NOT NULL constraint ekle
ALTER TABLE videos ALTER COLUMN favorites SET NOT NULL;

-- 4. Doğrula
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'videos' AND column_name = 'favorites';
```

