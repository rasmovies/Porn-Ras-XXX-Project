# 🔑 Supabase Anon Key Nerede Bulunur?

## 📍 1. Kodda (Hardcoded - Şu An Kullanılan)

**Dosya:** `client/src/lib/supabase.ts`

**Satır 9-11:**
```typescript
const supabaseAnonKey = 
  process.env.REACT_APP_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ';
```

**Mevcut Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ
```

**Supabase URL:**
```
https://xgyjhofakpatrqgvleze.supabase.co
```

---

## 📍 2. Supabase Dashboard'da Bulma

### Adım 1: Supabase Dashboard'a Giriş
1. https://supabase.com/dashboard adresine gidin
2. Giriş yapın

### Adım 2: Projenizi Seçin
- Proje listesinden **`xgyjhofakpatrqgvleze`** projesini seçin
- Veya proje adınızı bulun

### Adım 3: Settings → API
1. Sol menüden **"Settings"** (⚙️) seçin
2. **"API"** sekmesine tıklayın

### Adım 4: Anon Key'i Bulun
**"Project API keys"** bölümünde:

- **`anon` `public`** key'i göreceksiniz
- Bu key'i kopyalayın
- **⚠️ ÖNEMLİ:** `service_role` key'ini **ASLA** frontend'de kullanmayın!

---

## 📋 Vercel'de Environment Variable Olarak Ayarlama

### Vercel Dashboard:
1. **Vercel Dashboard** → Projeniz → **Settings** → **Environment Variables**
2. **"Add New"** butonuna tıklayın

### Ekleyeceğiniz Değişkenler:

| Key | Value |
|-----|-------|
| `REACT_APP_SUPABASE_URL` | `https://xgyjhofakpatrqgvleze.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ` |

**Environment:** Production, Preview, Development (hepsini seçin)

---

## 🔍 Anon Key Formatı

Anon key bir JWT (JSON Web Token) formatındadır:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ
```

**Yapısı:**
- 3 bölümden oluşur (nokta ile ayrılmış)
- Base64 encoded JSON
- İlk bölüm: Header
- İkinci bölüm: Payload (project ref, role, expiration vb.)
- Üçüncü bölüm: Signature

---

## ⚠️ Güvenlik Notları

1. **Anon Key Public'tir:**
   - Frontend'de kullanılabilir
   - Row Level Security (RLS) ile korunmalıdır

2. **Service Role Key ASLA Frontend'de Kullanılmamalı:**
   - Bu key tüm güvenlik kontrollerini bypass eder
   - Sadece backend/server-side kodda kullanılmalıdır

3. **Environment Variable Kullanın:**
   - Hardcoded key'ler kodda tutulmamalı
   - Vercel'de environment variable olarak ayarlayın

---

## ✅ Özet

**Mevcut Anon Key (Kodda):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ
```

**Supabase Dashboard'da:**
- Settings → API → Project API keys → `anon` `public` key

**Vercel'de Ayarlama:**
- `REACT_APP_SUPABASE_ANON_KEY` = (yukarıdaki key)


