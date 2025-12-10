/**
 * Resend Email API Test Script
 * 
 * Kullanım:
 * 1. .env dosyasında Resend API ayarlarını yapın
 * 2. node server/test-email.js
 */

require('dotenv').config();
const { sendWelcomeMail } = require('./services/emailService');

async function testEmail() {
  console.log('🧪 Resend Email API Test Başlatılıyor...\n');

  // Environment değişkenlerini kontrol et
  const requiredVars = [
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
  ];

  console.log('📋 Environment Değişkenleri:');
  const missingVars = [];
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // API key'i gizle
      const displayValue = varName.includes('API_KEY') 
        ? `${value.substring(0, 10)}...` 
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
    console.error('💡 Resend API Key almak için: https://resend.com/api-keys');
    process.exit(1);
  }

  console.log('\n📧 Test e-postası gönderiliyor...\n');

  try {
    // Test e-postası gönder
    const testEmail = process.env.RESEND_FROM_EMAIL;
    
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
    if (error.message.includes('RESEND_API_KEY') || error.message.includes('API')) {
      console.error('\n💡 Resend API Hatası - Öneriler:');
      console.error('1. Resend.com\'da hesap oluşturun: https://resend.com');
      console.error('2. API Key oluşturun: https://resend.com/api-keys');
      console.error('3. Domain\'i doğrulayın (info@pornras.com için pornras.com domain\'i)');
      console.error('4. API Key\'i .env dosyasına ekleyin: RESEND_API_KEY=re_...');
      console.error('5. Vercel\'de environment variable olarak ekleyin');
    } else if (error.message.includes('domain') || error.message.includes('Domain')) {
      console.error('\n💡 Domain Doğrulama Hatası - Öneriler:');
      console.error('1. Resend dashboard\'da domain\'i ekleyin ve doğrulayın');
      console.error('2. DNS kayıtlarını (SPF, DKIM, DMARC) ekleyin');
      console.error('3. Domain doğrulaması tamamlanana kadar test domain kullanabilirsiniz');
    } else if (error.message.includes('rate limit') || error.message.includes('limit')) {
      console.error('\n💡 Rate Limit Hatası:');
      console.error('1. Resend free plan\'da günlük limit var');
      console.error('2. Planınızı kontrol edin veya bekleyin');
    }

    console.error('\n');
    process.exit(1);
  }
}

// Script'i çalıştır
testEmail();

