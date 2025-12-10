const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== LocalTunnel Başlatılıyor ===\n');

// LocalTunnel'i başlat
const lt = spawn('lt', ['--port', '5000'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

let url = null;
let output = '';

// Stdout'dan URL'yi yakala
lt.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log(text.trim());
  
  // URL'yi parse et
  const urlMatch = text.match(/https?:\/\/[a-z0-9-]+\.loca\.lt/);
  if (urlMatch && !url) {
    url = urlMatch[0];
    console.log(`\n✅ URL bulundu: ${url}\n`);
    
    // URL'yi dosyaya kaydet
    const urlFile = path.join(__dirname, 'localtunnel-url.txt');
    fs.writeFileSync(urlFile, url, 'utf8');
    console.log(`📝 URL dosyaya kaydedildi: ${urlFile}\n`);
    
    // Process'i durdurma, çalışmaya devam etsin
  }
});

lt.stderr.on('data', (data) => {
  const text = data.toString();
  console.error(text.trim());
});

lt.on('close', (code) => {
  console.log(`\nLocalTunnel process sonlandı (code: ${code})`);
  if (url) {
    console.log(`\n✅ URL: ${url}`);
    console.log('\n⚠️ LocalTunnel penceresini kapatma! Çalışırken açık kalmalı.');
  }
});

// Ctrl+C ile durdur
process.on('SIGINT', () => {
  console.log('\n\nLocalTunnel durduruluyor...');
  lt.kill();
  process.exit(0);
});

