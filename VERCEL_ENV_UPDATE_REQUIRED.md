# ⚠️ VERCEL ENVIRONMENT VARIABLES GÜNCELLEME GEREKLİ

## 🔴 ÖNEMLİ: Vercel'de Environment Variables Güncellemesi Yapın!

Yeni Supabase projesi bilgileri:

### 📋 Güncel Bilgiler

**Supabase URL:**
```
https://rjjzviliwwlbjxfnpxsi.supabase.co
```

**Supabase Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqanp2aWxpd3dsYmp4Zm5weHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTE0OTMsImV4cCI6MjA3NDQ2NzQ5M30.Mz1QxAZZz6POk7M5B8n9oM0-Pi2jSFJDLzhTT7cwPPE
```

## ✅ Vercel'de Yapılacaklar

### 1. Vercel Dashboard'a Git
- https://vercel.com/dashboard
- Projenizi seçin
- **Settings** → **Environment Variables**

### 2. Şu Variable'ları Güncelle

#### Frontend için:
1. **REACT_APP_SUPABASE_URL**
   - Eski: `https://xgyjhofakpatrqgvleze.supabase.co`
   - **YENİ:** `https://rjjzviliwwlbjxfnpxsi.supabase.co`
   - Edit → Value'yu güncelle → Save

2. **REACT_APP_SUPABASE_ANON_KEY**
   - Key değeri aynı (zaten doğru)
   - Kontrol et, yanlışsa güncelle

#### Backend için:
1. **SUPABASE_URL**
   - Eski: `https://xgyjhofakpatrqgvleze.supabase.co`
   - **YENİ:** `https://rjjzviliwwlbjxfnpxsi.supabase.co`
   - Edit → Value'yu güncelle → Save

2. **SUPABASE_ANON_KEY**
   - Key değeri aynı (zaten doğru)
   - Kontrol et, yanlışsa güncelle

### 3. Redeploy Yap

**MUTLAKA** redeploy yapın:

1. **Deployments** sekmesine git
2. En üstteki deployment'ın yanındaki **"..."** menüsüne tıkla
3. **"Redeploy"** seç
4. **"Use existing Build Cache"** seçeneğini **KAPAT** ⚠️
5. **"Redeploy"** butonuna tıkla

## 🧪 Test

Deployment sonrası:
1. Siteyi yenile (Ctrl+Shift+R veya Cmd+Shift+R)
2. Console'u aç (F12)
3. Hataların kaybolduğunu kontrol et:
   - ❌ "Invalid API key" → ✅ Kaybolmalı
   - ❌ "Failed to load videos" → ✅ Kaybolmalı
   - ❌ "Failed to load models" → ✅ Kaybolmalı

## 📝 Not

Kod tarafında tüm URL'ler güncellendi ve GitHub'a push edildi. 
Ancak Vercel'de environment variable'ları manuel olarak güncellemeniz gerekiyor.

