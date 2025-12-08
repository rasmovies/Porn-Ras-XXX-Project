# 🔐 Vercel Environment Variable: DATABASE_URL

## PostgreSQL Connection String

Vercel Dashboard'da şu environment variable'ı ekleyin:

### Key:
```
DATABASE_URL
```

### Value:
```
postgresql://postgres:Oyunbozan*fb35*1907@db.xgyjhofakpatrqgvleze.supabase.co:5432/postgres
```

### Environment:
- ✅ Production
- ✅ Preview  
- ✅ Development

---

## 📝 Notlar

1. **Güvenlik:** Bu şifre hassas bilgidir. Sadece Vercel environment variables'da saklanmalıdır.
2. **Kullanım:** Bu connection string direkt PostgreSQL bağlantısı için kullanılır (migration scriptleri, özel sorgular vb.)
3. **Supabase Client:** Normal uygulama işlemleri için Supabase client kullanılmaya devam edecek.

---

## 🔧 Vercel'de Ekleme Adımları

1. Vercel Dashboard → Projenizi seçin
2. Settings → Environment Variables
3. "Add New" butonuna tıklayın
4. Key: `DATABASE_URL`
5. Value: `postgresql://postgres:Oyunbozan*fb35*1907@db.xgyjhofakpatrqgvleze.supabase.co:5432/postgres`
6. Environment: Production, Preview, Development (hepsini seçin)
7. Save

---

## ⚠️ ÖNEMLİ

- Bu dosya Git'e commit edilmemeli (zaten .gitignore'da)
- Şifre değişirse bu dosyayı ve Vercel environment variable'ı güncelleyin
- Production'da kullanmadan önce test edin

