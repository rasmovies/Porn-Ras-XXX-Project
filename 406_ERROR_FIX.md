# 🔧 406 Not Acceptable Hatası - Çözüm

## ❌ Sorun

```
[Error] Failed to load resource: the server responded with a status of 406 () (profiles, line 0)
[Error] Failed to load resource: the server responded with a status of 406 () (admin_users, line 0)
```

## 🔍 Neden Oluyor?

406 Not Acceptable hatası genellikle:
- **Accept header** desteklenmiyor
- **Content-Type** uyumsuzluğu
- API formatı beklentileri karşılanmıyor

Bu endpoint'ler (`profiles`, `admin_users`) Supabase REST API'den direkt çekiliyor ve header'lar yanlış olabilir.

## ✅ Çözüm

Supabase client'a doğru header'lar eklendi:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});
```

## 📋 Yapılan Değişiklikler

1. **Accept header eklendi**: `application/json`
2. **Content-Type header eklendi**: `application/json`
3. **Supabase client yapılandırması iyileştirildi**

## 🚨 Sertifika Hatası

Ayrıca sertifika hatası görüyorsunuz:
```
[Error] Failed to load resource: Bu sunucu için olan sertifika geçersiz. (ffffff, line 0)
```

Bu muhtemelen:
- Eski bir endpoint'e (VPS) istek gönderiliyor
- Veya bir resource URL'i (image, font, vs.) HTTP yerine HTTPS gerektiriyor

**Kontrol edin:**
1. Browser Network tab'ında hangi URL'e istek gittiğini görün
2. Eğer `http://` ile başlıyorsa → `https://` olmalı
3. Veya o URL artık çalışmıyor olabilir

## 🧪 Test

Deploy sonrası test edin:
1. Admin sayfasını açın
2. Profiles yüklenmeli
3. Admin users yüklenmeli
4. Console'da 406 hatası görünmemeli

## 📝 Notlar

- Supabase client default olarak header'ları gönderiyor ama bazen yeterli olmayabiliyor
- Eğer hala 406 hatası alıyorsanız, Supabase dashboard'da RLS (Row Level Security) ayarlarını kontrol edin
- Veya Supabase API rate limit'ine takılmış olabilirsiniz

