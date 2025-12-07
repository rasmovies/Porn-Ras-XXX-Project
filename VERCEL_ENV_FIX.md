# 🔧 Vercel Environment Variables Düzeltme Kılavuzu

## ❌ Hata: "Invalid API key"

Bu hata, Supabase API key'inin yanlış veya eksik olduğunu gösterir.

## ✅ Çözüm Adımları

### 1. Vercel Dashboard'a Git
1. https://vercel.com/dashboard adresine git
2. Projenizi seçin: `porn-ras-xxx-project` veya `pornras.com`
3. **Settings** → **Environment Variables** sekmesine git

### 2. Kontrol Et ve Güncelle

Aşağıdaki environment variable'ların **HEPSİNİN** mevcut olduğundan ve **DOĞRU** olduğundan emin ol:

#### Frontend (React App) için:
| Key | Value | Environment |
|-----|-------|-------------|
| `REACT_APP_SUPABASE_URL` | `https://xgyjhofakpatrqgvleze.supabase.co` | Production, Preview, Development |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqanp2aWxpd3dsYmp4Zm5weHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTE0OTMsImV4cCI6MjA3NDQ2NzQ5M30.Mz1QxAZZz6POk7M5B8n9oM0-Pi2jSFJDLzhTT7cwPPE` | Production, Preview, Development |

#### Backend (API Functions) için:
| Key | Value | Environment |
|-----|-------|-------------|
| `SUPABASE_URL` | `https://xgyjhofakpatrqgvleze.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqanp2aWxpd3dsYmp4Zm5weHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTE0OTMsImV4cCI6MjA3NDQ2NzQ5M30.Mz1QxAZZz6POk7M5B8n9oM0-Pi2jSFJDLzhTT7cwPPE` | Production, Preview, Development |

### 3. Eksik veya Yanlış Olanları Düzelt

#### Eğer variable yoksa:
1. **"Add New"** butonuna tıkla
2. Key ve Value'yu gir
3. **Environment'ları seç** (Production, Preview, Development - **HEPSİNİ** seç!)
4. **Save** butonuna tıkla

#### Eğer variable yanlışsa:
1. Variable'ın yanındaki **"..."** menüsüne tıkla
2. **"Edit"** seç
3. Value'yu düzelt
4. **Save** butonuna tıkla

### 4. Redeploy Yap

Environment variable'ları değiştirdikten sonra **MUTLAKA** redeploy yap:

1. **Deployments** sekmesine git
2. En üstteki deployment'ın yanındaki **"..."** menüsüne tıkla
3. **"Redeploy"** seç
4. **"Use existing Build Cache"** seçeneğini **KAPAT** (önemli!)
5. **"Redeploy"** butonuna tıkla

### 5. Kontrol Et

Deployment tamamlandıktan sonra:
1. Siteyi yenile
2. Console'u aç (F12)
3. Hata mesajlarının kaybolduğunu kontrol et

## 🔍 Supabase Key'i Nereden Bulurum?

1. **Supabase Dashboard:** https://supabase.com/dashboard
2. Projenizi seçin
3. **Settings** → **API**
4. **"Project API keys"** bölümünde:
   - **`anon` `public`** key'i kopyala
   - ⚠️ **`service_role`** key'ini **ASLA** frontend'de kullanma!

## ⚠️ Önemli Notlar

1. **Environment'ları Seç:** Her variable için Production, Preview ve Development'ı **HEPSİNİ** seç
2. **Redeploy Gerekli:** Variable değiştirdikten sonra mutlaka redeploy yap
3. **Build Cache'i Kapat:** Redeploy'da "Use existing Build Cache" seçeneğini kapat
4. **Key Formatı:** Key JWT formatında olmalı (3 bölüm, nokta ile ayrılmış)

## 🧪 Test

Deployment sonrası console'da şu hatalar görünmemeli:
- ❌ "Invalid API key"
- ❌ "Failed to load videos"
- ❌ "Failed to load models and channels"
- ❌ "Database error. Please check Supabase connection."

## 📞 Hala Çalışmıyorsa

1. Supabase Dashboard'dan yeni bir `anon` key al
2. Vercel'de tüm environment variable'ları güncelle
3. Redeploy yap
4. Tarayıcı cache'ini temizle (Ctrl+Shift+R veya Cmd+Shift+R)

