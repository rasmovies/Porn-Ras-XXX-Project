# Supabase Storage Setup

Thumbnail'ların direkt Supabase Storage'a yüklenmesi için gerekli setup.

## 1. Supabase Dashboard'da Storage Bucket Oluşturma

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **Storage** → **Buckets** seçin
4. **New bucket** butonuna tıklayın
5. Bucket adı: `thumbnails`
6. **Public bucket** seçeneğini işaretleyin (önemli!)
7. **Create bucket** butonuna tıklayın

## 2. Storage Policies (RLS) Ayarları

Storage bucket'ı oluşturduktan sonra, public erişim için policy ekleyin:

### Supabase SQL Editor'de çalıştırın:

```sql
-- Allow public read access to thumbnails bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- Allow public insert (upload) to thumbnails bucket
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thumbnails');

-- Allow public update to thumbnails bucket
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'thumbnails');

-- Allow public delete to thumbnails bucket
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'thumbnails');
```

## 3. Folder Yapısı

Bucket içinde şu folder yapısı otomatik oluşturulacak:
- `categories/` - Category thumbnail'ları
- `models/` - Model image'ları
- `channels/` - Channel thumbnail'ları

## 4. Test

1. Admin sayfasına gidin
2. Yeni bir category/model/channel ekleyin
3. Thumbnail olarak bir dosya seçin
4. Upload işlemi direkt Supabase Storage'a yapılacak
5. Public URL Supabase database'e kaydedilecek

## Notlar

- ✅ Upload direkt kullanıcının tarayıcısından Supabase Storage'a yapılıyor
- ✅ Vercel'in bandwidth'i kullanılmıyor
- ✅ Base64 string yerine public URL kaydediliyor
- ✅ Daha az database storage kullanımı

