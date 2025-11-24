# PORNRAS Email İmzası Kullanım Kılavuzu

## 📧 Email İmzası Versiyonları

### 1. HTML Versiyon (Webmail için)
**Dosya:** `server/emailTemplates/email-signature.html`

**Kullanım:**
- Spacemail webmail arayüzünde kullanmak için HTML kodunu kopyalayın
- Email ayarları > İmza bölümüne yapıştırın

### 2. Plain Text Versiyon (Basit kullanım)
**Dosya:** `server/emailTemplates/email-signature-plain.txt`

**Kullanım:**
- Basit email istemcileri için
- Metin olarak kopyala-yapıştır yapın

## 🎨 Özelleştirme

### Renkler
- Ana Renk: `#ff6b6b` (PORNRAS kırmızısı)
- Metin Rengi: `#333333` (Koyu gri)
- İkincil Metin: `#666666` (Orta gri)
- Alt Bilgi: `#999999` (Açık gri)

### Değiştirilebilir Alanlar
- **İsim:** "PORNRAS Ekibi" → Kendi isminizi yazın
- **Email:** `info@pornras.com` → Kendi email adresinizi yazın
- **Website:** `www.pornras.com` → Website URL'inizi yazın

## 📋 Spacemail'de Kurulum

1. Spacemail webmail'e giriş yapın
2. Ayarlar > İmza bölümüne gidin
3. HTML modunu seçin
4. `email-signature.html` dosyasındaki HTML kodunu kopyalayın
5. İmza alanına yapıştırın
6. Kaydedin

## 💡 İpuçları

- HTML imzaları çoğu modern email istemcisinde çalışır
- Görseller yerine emoji kullanıldı (daha uyumlu)
- Responsive tasarım (mobil uyumlu)
- Profesyonel ve minimal görünüm

## 🔄 Güncelleme

İmzayı güncellemek için:
1. `email-signature.html` dosyasını düzenleyin
2. Değişiklikleri kaydedin
3. Spacemail'deki imzayı güncelleyin

