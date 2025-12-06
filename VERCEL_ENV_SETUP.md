# Vercel Environment Variables Setup

## 🔧 Gerekli Environment Variables

Verification email göndermek için Vercel'de aşağıdaki environment variables'ları ayarlamanız gerekiyor:

### Spacemail SMTP Ayarları

```
SPACEMAIL_SMTP_HOST=mail.spacemail.com
SPACEMAIL_SMTP_PORT=465
SPACEMAIL_SMTP_SECURE=true
SPACEMAIL_SMTP_USERNAME=info@pornras.com
SPACEMAIL_SMTP_PASSWORD=your-spacemail-password
SPACEMAIL_FROM_EMAIL=info@pornras.com
SPACEMAIL_FROM_NAME=PORNRAS
```

### Supabase Ayarları (Email Verification için)

```
SUPABASE_URL=https://xgyjhofakpatrqgvleze.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Vercel'de Ayarlama Adımları

1. Vercel Dashboard'a gidin
2. Projenizi seçin
3. **Settings** > **Environment Variables** bölümüne gidin
4. Her bir variable'ı ekleyin:
   - **Name:** Variable adı (örn: `SPACEMAIL_SMTP_USERNAME`)
   - **Value:** Variable değeri (örn: `info@pornras.com`)
   - **Environment:** Production, Preview, Development (hepsini seçin)

5. **Save** butonuna tıklayın
6. Yeni bir deployment yapın (değişikliklerin aktif olması için)

## ⚠️ Önemli Notlar

- `SPACEMAIL_SMTP_PASSWORD` değeri Spacemail hesabınızın şifresi veya uygulama şifresi olmalıdır
- Eğer 2FA aktifse, uygulama şifresi kullanmanız gerekebilir
- Environment variables eklendikten sonra **mutlaka yeni bir deployment yapın**
- Production, Preview ve Development ortamları için ayrı ayrı ayarlayabilirsiniz

## 🧪 Test

Environment variables eklendikten sonra:
1. Yeni bir deployment yapın
2. Register sayfasından yeni bir kullanıcı oluşturun
3. Verification email'inin gönderildiğini kontrol edin

## ❌ Hata Durumları

### "Email servisi yapılandırma hatası"
- Environment variables eksik veya yanlış
- `SPACEMAIL_SMTP_USERNAME` veya `SPACEMAIL_SMTP_PASSWORD` eksik

### "Email servisi kimlik doğrulama hatası"
- SMTP şifresi yanlış
- 2FA aktifse uygulama şifresi kullanılmalı

### "Email servisi şu anda kullanılamıyor"
- SMTP sunucusuna bağlanılamıyor
- Port veya host ayarları yanlış olabilir

