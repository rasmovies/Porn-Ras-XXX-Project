# 🔧 Vercel Environment Variables Kurulumu

## ✅ Gerekli Environment Variables

Vercel Dashboard → Projeniz → Settings → Environment Variables bölümüne şu değişkenleri ekleyin:

### Backend (Serverless Functions) için:

| Key | Value | Environment |
|-----|-------|-------------|
| `SUPABASE_URL` | `https://xgyjhofakpatrqgvleze.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ` | Production, Preview, Development |

### Frontend (React App) için:

| Key | Value | Environment |
|-----|-------|-------------|
| `REACT_APP_SUPABASE_URL` | `https://xgyjhofakpatrqgvleze.supabase.co` | Production, Preview, Development |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ` | Production, Preview, Development |

## 📝 Adım Adım Kurulum

1. **Vercel Dashboard'a gidin:**
   - https://vercel.com/dashboard
   - Projenizi seçin: `porn-ras-xxx-project`

2. **Settings → Environment Variables:**
   - Sol menüden "Settings" seçin
   - "Environment Variables" sekmesine tıklayın

3. **Her bir değişkeni ekleyin:**
   - "Add New" butonuna tıklayın
   - Key ve Value'yu girin
   - Environment'ları seçin (Production, Preview, Development - hepsini seçin)
   - "Save" butonuna tıklayın

4. **Redeploy yapın:**
   - Environment variable ekledikten sonra yeni bir deployment gerekir
   - "Deployments" sekmesine gidin
   - En üstteki deployment'ın yanındaki "..." menüsünden "Redeploy" seçin
   - "Use existing Build Cache" seçeneğini KAPATIN
   - "Redeploy" butonuna tıklayın

## 🔍 Kontrol

Deployment tamamlandıktan sonra:

1. **Test endpoint'ini kontrol edin:**
   ```
   https://www.pornras.com/api/test-supabase
   ```
   Bu endpoint Supabase bağlantısını test eder.

2. **Browser console'u kontrol edin:**
   - Siteyi açın
   - F12 → Console
   - Supabase bağlantı loglarını kontrol edin

## ⚠️ Önemli Notlar

- Environment variable'lar deployment sırasında build'e dahil edilir
- Değişiklik yaptıktan sonra mutlaka redeploy yapın
- `REACT_APP_` prefix'i olan değişkenler frontend'de kullanılır
- Prefix olmayan değişkenler backend (serverless functions) için kullanılır

## 🐛 Sorun Giderme

Eğer hala sorun varsa:

1. **Vercel Logs'u kontrol edin:**
   - Deployments → Son deployment → "View Function Logs"
   - Hata mesajlarını kontrol edin

2. **Environment variable'ların doğru olduğundan emin olun:**
   - Key'ler tam olarak yukarıdaki gibi olmalı
   - Value'lar doğru kopyalanmış olmalı (boşluk yok)

3. **Redeploy yaptığınızdan emin olun:**
   - Environment variable ekledikten sonra mutlaka redeploy yapın
