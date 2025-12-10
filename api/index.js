// Vercel serverless function wrapper
// NOT: Bu uygulama sürekli çalışan bir sunucu gerektirir
// Vercel'de dosya izleme ve otomatik yükleme özellikleri çalışmayacaktır
const path = require('path');

// server.js'i require et
const serverPath = path.join(__dirname, '..', 'server.js');
delete require.cache[require.resolve(serverPath)];
const app = require(serverPath);

module.exports = app;

