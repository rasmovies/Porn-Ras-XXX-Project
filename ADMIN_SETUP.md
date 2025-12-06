# 🔐 Admin Kullanıcı Kurulumu

## Admin Bilgileri
- **Username:** `Pornras Admin`
- **Email:** `admin@pornras.com`
- **Password:** `1qA2ws3ed*`

## Kurulum Yöntemleri

### Yöntem 1: API Endpoint (Önerilen)
Deployment sonrası şu endpoint'i çağırın:
```
POST https://www.pornras.com/api/auth/create-admin
```

Body:
```json
{
  "username": "Pornras Admin",
  "email": "admin@pornras.com",
  "password": "1qA2ws3ed*"
}
```

### Yöntem 2: Node.js Script
```bash
cd /Users/mertcengiz/Desktop/ftp
node scripts/create-admin-user.js
```

### Yöntem 3: Supabase Dashboard (Manuel)
1. **Supabase Dashboard** → **Authentication** → **Users**
2. **Add User** → **Create new user**
3. Email: `admin@pornras.com`
4. Password: `1qA2ws3ed*`
5. **Auto Confirm User**: ✅ (işaretle)
6. **Create user**

Sonra **Table Editor** → **profiles** tablosunda:
- `user_name`: `Pornras Admin`
- `email`: `admin@pornras.com`
- Diğer alanları doldurun

**Table Editor** → **admin_users** tablosunda:
- `user_name`: `Pornras Admin`
- `is_admin`: `true`

## Kontrol

Admin kullanıcısı oluşturulduktan sonra:
1. Siteye giriş yapın: `Pornras Admin` / `1qA2ws3ed*`
2. **Upload** ve **Admin** sekmeleri görünmeli
3. `/admin` ve `/upload` sayfalarına erişebilmelisiniz

## Notlar

- Upload ve Admin sekmeleri sadece admin kullanıcısına gösterilir
- Admin kontrolü `admin_users` tablosundan yapılır
- `Layout/index.tsx` dosyasında `isAdmin` kontrolü var
- `ProtectedRoute` component'i admin kontrolü yapar

