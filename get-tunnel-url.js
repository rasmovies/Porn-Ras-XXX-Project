const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== LocalTunnel Başlatılıyor ===\n');
console.log('Backend: http://localhost:5000\n');
console.log('URL aşağıda görünecektir:\n');
console.log('========================================\n');

const lt = spawn('npx', ['--yes', 'localtunnel', '--port', '5000'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  cwd: __dirname
});

let output = '';
let urlFound = false;

lt.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
  
  // URL'yi bul
  const urlMatch = text.match(/https:\/\/[a-z0-9-]+\.loca\.lt/);
  if (urlMatch && !urlFound) {
    const url = urlMatch[0];
    urlFound = true;
    const urlFile = path.join(__dirname, 'tunnel-url.txt');
    fs.writeFileSync(urlFile, url, 'utf8');
    console.log(`\n\n✅ URL bulundu ve kaydedildi: ${url}\n`);
    console.log(`📄 Dosya: ${urlFile}\n`);
  }
});

lt.stderr.on('data', (data) => {
  const text = data.toString();
  process.stderr.write(data);
  
  // stderr'de de URL olabilir
  const urlMatch = text.match(/https:\/\/[a-z0-9-]+\.loca\.lt/);
  if (urlMatch && !urlFound) {
    const url = urlMatch[0];
    urlFound = true;
    const urlFile = path.join(__dirname, 'tunnel-url.txt');
    fs.writeFileSync(urlFile, url, 'utf8');
    console.log(`\n\n✅ URL bulundu ve kaydedildi: ${url}\n`);
  }
});

lt.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\n⚠️ LocalTunnel kapatıldı (kod: ${code})`);
  }
});

// 15 saniye sonra URL'yi kontrol et
setTimeout(() => {
  if (!urlFound) {
    const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.loca\.lt/);
    if (urlMatch) {
      const url = urlMatch[0];
      urlFound = true;
      const urlFile = path.join(__dirname, 'tunnel-url.txt');
      fs.writeFileSync(urlFile, url, 'utf8');
      console.log(`\n\n✅ URL bulundu: ${url}\n`);
    } else {
      console.log('\n⚠️ URL henüz hazır değil. Çıktıyı kontrol et.');
      console.log('\nÇıktı:');
      console.log(output);
    }
  }
}, 15000);

// Process'i kapatmayı engelle
process.on('SIGINT', () => {
  console.log('\n\n⚠️ LocalTunnel durduruluyor...');
  lt.kill();
  process.exit(0);
});

// Süresiz çalış
console.log('⚠️ LocalTunnel çalışıyor. Durdurmak için Ctrl+C yapın.\n');

