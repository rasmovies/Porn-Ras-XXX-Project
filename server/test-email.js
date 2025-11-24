/**
 * Spacemail Email Test Script
 * 
 * Kullanım:
 * 1. .env dosyasında Spacemail ayarlarını yapın
 * 2. node server/test-email.js
 */

require('dotenv').config();
const { sendWelcomeMail } = require('./services/emailService');

async function testEmail() {
  console.log('🧪 Spacemail Email Test Başlatılıyor...\n');

  // Environment değişkenlerini kontrol et
  const requiredVars = [
    'SPACEMAIL_SMTP_HOST',
    'SPACEMAIL_SMTP_PORT',
    'SPACEMAIL_SMTP_USERNAME',
    'SPACEMAIL_SMTP_PASSWORD',
    'SPACEMAIL_FROM_EMAIL',
  ];

  console.log('📋 Environment Değişkenleri:');
  const missingVars = [];
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Şifreleri gizle
      const displayValue = varName.includes('PASSWORD') 
        ? '***' 
        : value;
      console.log(`  ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`  ❌ ${varName}: TANIMLI DEĞİL`);
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error('\n❌ Eksik environment değişkenleri:', missingVars.join(', '));
    console.error('Lütfen .env dosyasını kontrol edin.\n');
    process.exit(1);
  }

  console.log('\n📧 Test e-postası gönderiliyor...\n');

  try {
    // Test e-postası gönder
    const testEmail = process.env.SPACEMAIL_SMTP_USERNAME || process.env.SPACEMAIL_FROM_EMAIL;
    
    if (!testEmail) {
      throw new Error('Test e-postası için alıcı adresi bulunamadı');
    }

    console.log(`Alıcı: ${testEmail}`);
    console.log('E-posta türü: Welcome Email\n');

    await sendWelcomeMail({
      email: testEmail,
      name: 'Test User',
    });

    console.log('✅ Test e-postası başarıyla gönderildi!');
    console.log(`📬 Lütfen ${testEmail} adresindeki gelen kutunuzu kontrol edin.\n`);
    
  } catch (error) {
    console.error('❌ E-posta gönderim hatası:\n');
    console.error('Hata mesajı:', error.message);
    
    if (error.cause) {
      console.error('\nDetaylı hata:');
      console.error(error.cause);
    }

    // Yaygın hatalar için öneriler
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 Öneriler:');
      console.error('1. SMTP sunucu adresini kontrol edin (mail.spacemail.com)');
      console.error('2. Port numarasını kontrol edin (465 veya 587)');
      console.error('3. İnternet bağlantınızı kontrol edin');
      console.error('4. Firewall ayarlarını kontrol edin');
    } else if (error.message.includes('EAUTH') || error.message.includes('authentication') || error.message.includes('535')) {
      console.error('\n💡 Kimlik Doğrulama Hatası - Öneriler:');
      console.error('1. Kullanıcı adını kontrol edin (tam e-posta adresi: info@pornras.com)');
      console.error('2. Şifreyi kontrol edin (boşluk olmamalı)');
      console.error('3. Spacemail hesabınızın aktif olduğundan emin olun');
      console.error('4. Port 587 (STARTTLS) deneyin:');
      console.error('   SPACEMAIL_SMTP_PORT=587');
      console.error('   SPACEMAIL_SMTP_SECURE=false');
      console.error('5. Spacemail kontrol panelinde SMTP ayarlarını kontrol edin');
      console.error('6. Bazı e-posta servisleri "Uygulama Şifresi" gerektirir');
      console.error('7. 2FA aktifse, uygulama şifresi kullanmanız gerekebilir');
    } else if (error.message.includes('certificate') || error.message.includes('TLS')) {
      console.error('\n💡 Öneriler:');
      console.error('1. SPACEMAIL_SMTP_SECURE=true olduğundan emin olun (port 465 için)');
      console.error('2. Port 587 kullanıyorsanız secure=false olmalı');
    }

    console.error('\n');
    process.exit(1);
  }
}

// Script'i çalıştır
testEmail();

