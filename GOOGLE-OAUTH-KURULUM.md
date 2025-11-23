# Google OAuth Kurulum Kılavuzu

## ✅ Yapılan İşlemler

1. **Paket Yüklendi**: `@react-oauth/google` paketi yüklendi
2. **App.tsx Güncellendi**: `GoogleOAuthProvider` eklendi
3. **LoginModal.tsx**: Google Sign-In butonu aktif edildi
4. **Login.tsx**: Google Sign-In butonu aktif edildi
5. **RegisterModal.tsx**: Google Sign-In butonu aktif edildi

## 🔧 Gerekli Yapılandırma

### 1. Google Cloud Console'da OAuth 2.0 Client ID Oluşturma

1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
2. Yeni bir proje oluşturun veya mevcut projeyi seçin
3. **APIs & Services** > **Credentials** bölümüne gidin
4. **Create Credentials** > **OAuth client ID** seçin
5. **Application type** olarak **Web application** seçin
6. **Authorized JavaScript origins** kısmına şunları ekleyin:
   - `http://localhost:3000` (development - local test için)
   - `https://www.pornras.com` (production - canlı site için)
   - `https://pornras.com` (production - www olmadan erişim için, opsiyonel)
   
   **ÖNEMLİ:** Her iki URL'yi de eklemelisiniz çünkü:
   - `http://localhost:3000` → Local development'ta test etmek için
   - `https://www.pornras.com` → Production'da kullanıcıların Google ile giriş yapabilmesi için
   
7. **Authorized redirect URIs** kısmına şunları ekleyin:
   - `http://localhost:3000` (development)
   - `https://www.pornras.com` (production)
   - `https://pornras.com` (production - opsiyonel)
8. **Create** butonuna tıklayın
9. **Client ID**'yi kopyalayın

### 2. Environment Variable Ekleme

#### Local Development (.env dosyası)
```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

#### Vercel Deployment
1. Vercel Dashboard'a gidin
2. Projenizi seçin
3. **Settings** > **Environment Variables** bölümüne gidin
4. Yeni variable ekleyin:
   - **Name**: `REACT_APP_GOOGLE_CLIENT_ID`
   - **Value**: Google Client ID'niz
   - **Environment**: Production, Preview, Development (hepsini seçin)
5. **Save** butonuna tıklayın
6. Projeyi yeniden deploy edin

### 3. Test Etme

1. Development server'ı başlatın: `npm start`
2. Login veya Register sayfasına gidin
3. "Continue with Google" butonuna tıklayın
4. Google hesabınızla giriş yapın
5. Başarılı giriş sonrası kullanıcı bilgileri localStorage'a kaydedilir

## 📝 Notlar

- **Her iki URL de eklenmelidir:**
  - `http://localhost:3000` → Development için (local test)
  - `https://www.pornras.com` → Production için (canlı site)
- Google OAuth Client ID yoksa, butonlar çalışmayacaktır
- Production'da mutlaka HTTPS kullanılmalıdır
- Google OAuth, kullanıcı bilgilerini (email, name, picture) alır
- Kullanıcı bilgileri localStorage'a kaydedilir ve `AuthProvider` tarafından yönetilir
- Development ve production farklı ortamlar olduğu için her ikisi de ayrı ayrı eklenmelidir

## 🔒 Güvenlik

- Client ID'yi asla public repository'de commit etmeyin
- Environment variables kullanın
- Production'da HTTPS zorunludur
- Google OAuth scopes sadece gerekli izinleri isteyecek şekilde yapılandırılmıştır

