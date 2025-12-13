# imgbb Image Hosting Setup

Thumbnail'ların direkt kullanıcının tarayıcısından imgbb'ye yüklenmesi için gerekli setup.

## 1. imgbb API Key Alma

1. imgbb.com'a gidin: https://imgbb.com
2. Ücretsiz hesap oluşturun (veya giriş yapın)
3. API sayfasına gidin: https://api.imgbb.com/
4. "Get API Key" butonuna tıklayın
5. API Key'inizi kopyalayın (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

## 2. API Key'i Ayarlama

### Seçenek 1: Vercel Environment Variable (Önerilen)
- Vercel Dashboard → Project → Settings → Environment Variables
- Key: `REACT_APP_IMGBB_API_KEY`
- Value: imgbb'den aldığınız API key
- Environment: Production, Preview, Development (hepsine ekleyin)

### Seçenek 2: localStorage (Development için)
- Browser console'da: `localStorage.setItem('imgbb_api_key', 'your-api-key-here')`

## 3. Nasıl Çalışıyor?

1. Kullanıcı Admin sayfasında thumbnail seçer
2. Dosya direkt kullanıcının tarayıcısından imgbb API'sine gönderilir
3. imgbb direct link döner
4. Bu link Supabase database'e kaydedilir
5. **Vercel veya Supabase Storage kullanılmaz!**

## 4. Avantajlar

- ✅ Vercel bandwidth kullanılmıyor
- ✅ Supabase Storage kullanılmıyor
- ✅ Direkt kullanıcının tarayıcısından imgbb'ye upload
- ✅ Ücretsiz imgbb planı: Aylık 32 MB upload limiti
- ✅ Direct link'ler hızlı ve güvenilir

## 5. imgbb Limitleri

- **Ücretsiz Plan**: 32 MB/ay upload limiti
- **Pro Plan**: $5/ay - 500 MB/ay upload limiti
- Direct link'ler süresiz saklanır

## 6. Test

1. Admin sayfasına gidin
2. Yeni bir category/model/channel ekleyin
3. Thumbnail olarak bir dosya seçin
4. Upload işlemi direkt imgbb'ye yapılacak
5. Direct link Supabase database'e kaydedilecek

