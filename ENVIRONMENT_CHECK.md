# 🔍 Environment Variables Kontrol Listesi

## Vercel'de Kontrol Edilmesi Gerekenler

### ✅ Backend Environment Variables (Serverless Functions)

Aşağıdaki değişkenlerin Vercel'de olup olmadığını kontrol edin:

1. **SUPABASE_URL**
   - Key: `SUPABASE_URL`
   - Value: `https://xgyjhofakpatrqgvleze.supabase.co`
   - Environment: Production, Preview, Development

2. **SUPABASE_ANON_KEY**
   - Key: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ`
   - Environment: Production, Preview, Development

### ✅ Frontend Environment Variables (React App)

Aşağıdaki değişkenlerin Vercel'de olup olmadığını kontrol edin:

1. **REACT_APP_SUPABASE_URL**
   - Key: `REACT_APP_SUPABASE_URL`
   - Value: `https://xgyjhofakpatrqgvleze.supabase.co`
   - Environment: Production, Preview, Development

2. **REACT_APP_SUPABASE_ANON_KEY**
   - Key: `REACT_APP_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ`
   - Environment: Production, Preview, Development

## 📋 Kontrol Adımları

1. **Vercel Dashboard'a gidin:**
   - https://vercel.com/dashboard
   - Projenizi seçin

2. **Settings → Environment Variables:**
   - Sol menüden "Settings" seçin
   - "Environment Variables" sekmesine tıklayın

3. **Her bir değişkeni kontrol edin:**
   - Yukarıdaki 4 değişkenin hepsinin listede olduğundan emin olun
   - Her birinin doğru value'ya sahip olduğunu kontrol edin
   - Environment'ların (Production, Preview, Development) seçili olduğunu kontrol edin

4. **Eksik olanları ekleyin:**
   - "Add New" butonuna tıklayın
   - Key ve Value'yu girin
   - Environment'ları seçin
   - "Save" butonuna tıklayın

5. **Redeploy yapın:**
   - Deployments → En üstteki deployment → "..." → "Redeploy"
   - "Use existing Build Cache" seçeneğini KAPATIN
   - "Redeploy" butonuna tıklayın

## ✅ Test

Deployment tamamlandıktan sonra:

```bash
# Test endpoint'ini kontrol edin
curl https://www.pornras.com/api/test-supabase
```

Bu endpoint Supabase bağlantısını test eder ve environment variable'ların doğru çalışıp çalışmadığını gösterir.

