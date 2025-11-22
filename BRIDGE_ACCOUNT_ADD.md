# Bridge Account Ekleme Talimatları

## Durum
- Username: `pornras@proton.me` ✅
- Password: `MoQL_M-Loyi1fB3b9tKWew` ✅
- Bridge çalışıyor ✅
- Ama Bridge account'una düzgün login olunmamış ❌

## Sorun
Bridge config dosyasında account bilgisi yok ve loglarda account sync mesajı yok.
Bu, Bridge account'una düzgün login olunmadığı anlamına geliyor.

## Çözüm: Bridge Account'unu Manuel Eklemek

### VPS'e SSH ile bağlanın:
```bash
ssh root@72.61.139.145
# Şifre: Oyunbozan1907+
```

### Bridge CLI'yi başlatın:
```bash
protonmail-bridge --cli
```

### Account listesini kontrol edin:
```
account list
```

### Eğer account yoksa veya sorunluysa:

#### 1. Mevcut account'u silin (varsa):
```
account delete pornras
```

#### 2. Yeni account ekleyin:
```
account add
```
Sonra şunları girin:
- **Email**: `pornras@proton.me`
- **Password**: Proton Mail hesabınızın şifresi (Bridge SMTP şifresi değil!)

#### 3. Account eklendikten sonra SMTP şifresini alın:
```
account password pornras
```
Bu komut size SMTP/IMAP şifresini gösterecek (muhtemelen `MoQL_M-Loyi1fB3b9tKWew`).

#### 4. Bridge CLI'den çıkın:
```
quit
```

#### 5. Bridge servisini yeniden başlatın:
```bash
sudo systemctl restart protonmail-bridge
```

#### 6. Sync mesajlarını kontrol edin:
```bash
sudo journalctl -u protonmail-bridge -f
```
Account sync başladığında şu mesajları göreceksiniz:
- `Account pornras was added successfully`
- `A sync has begun for pornras`
- `Sync (pornras): X%`

#### 7. Email'i test edin:
```bash
curl -X POST http://localhost:5000/api/email/verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
```

## Önemli Notlar
1. **Proton Mail Account Password**: Bridge'e account eklerken Proton Mail hesabınızın **normal şifresini** kullanın (Bridge SMTP şifresi değil!).
2. **SMTP Password**: Account eklendikten sonra Bridge'in ürettiği özel SMTP şifresini alın.
3. **Account Sync**: Account eklendikten sonra Bridge email'leri sync etmeye başlar. Bu biraz zaman alabilir.
4. **Log Kontrolü**: Account sync başladığını loglardan görebilirsiniz.




