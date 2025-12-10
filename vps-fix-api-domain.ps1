$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API.PORNRAS.COM TAM KURULUM VE DUZELTME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)

try {
    $Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey -ConnectionTimeout 30
    Write-Host "SSH baglantisi kuruldu!" -ForegroundColor Green
} catch {
    Write-Host "SSH baglantisi kurulamadi: $_" -ForegroundColor Red
    exit 1
}

function Invoke-VpsCmd {
    param([string]$Cmd)
    try {
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 120
        return $Result
    } catch {
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

Write-Host "[1/7] DNS kaydini kontrol ediyorum..." -ForegroundColor Cyan
$DNSCheck = Invoke-VpsCmd "nslookup api.pornras.com 2>&1 | grep -E '(Address|Name)' | head -5 || dig api.pornras.com +short 2>&1 || host api.pornras.com 2>&1"
Write-Host $DNSCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/7] Mevcut Nginx config'leri temizliyorum..." -ForegroundColor Cyan
$CleanNginx = Invoke-VpsCmd @"
# Yedek al
mkdir -p /root/nginx-backup
cp -r /etc/nginx/sites-available/* /root/nginx-backup/ 2>/dev/null || echo 'Yedek alindi'

# Eski config'leri kaldir
rm -f /etc/nginx/sites-enabled/backend-api
rm -f /etc/nginx/sites-enabled/default

echo 'Temizlik tamamlandi'
"@
Write-Host $CleanNginx.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/7] api.pornras.com icin yeni Nginx config olusturuyorum..." -ForegroundColor Cyan
$CreateConfig = Invoke-VpsCmd @"
cat > /etc/nginx/sites-available/api.pornras.com << 'NGINXEOF'
# api.pornras.com - Backend API Server
server {
    listen 80;
    listen [::]:80;
    server_name api.pornras.com;

    # Let's Encrypt verification icin
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # HTTP'den HTTPS'e yonlendirme (Let's Encrypt sonrasi)
    location / {
        return 301 https://`$host`$request_uri;
    }
}

# HTTPS - Self-signed cert ile basla (Let's Encrypt sonrasi degisecek)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.pornras.com;

    # Self-signed certificate (gecici)
    ssl_certificate /etc/nginx/ssl/backend.crt;
    ssl_certificate_key /etc/nginx/ssl/backend.key;

    # SSL ayarlari
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # CORS headers
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS' always;
    add_header Access-Control-Allow-Headers 'Content-Type, Authorization' always;

    # Backend proxy
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# IP uzerinden erisim icin (eski)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 72.61.139.145 _;

    ssl_certificate /etc/nginx/ssl/backend.crt;
    ssl_certificate_key /etc/nginx/ssl/backend.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}

# IP HTTP yonlendirme
server {
    listen 80;
    listen [::]:80;
    server_name 72.61.139.145 _;
    return 301 https://`$host`$request_uri;
}
NGINXEOF

# Symlink olustur
ln -sf /etc/nginx/sites-available/api.pornras.com /etc/nginx/sites-enabled/api.pornras.com

echo 'Config olusturuldu'
"@
Write-Host $CreateConfig.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/7] SSL sertifikasini kontrol ediyorum..." -ForegroundColor Cyan
$SSLCheck = Invoke-VpsCmd "ls -lh /etc/nginx/ssl/backend.* 2>&1 || echo 'SSL sertifikasi bulunamadi, olusturuluyor...'"
Write-Host $SSLCheck.Output -ForegroundColor Gray

if ($SSLCheck.Output -match "bulunamadi") {
    Write-Host "SSL sertifikasi olusturuluyor..." -ForegroundColor Yellow
    $CreateSSL = Invoke-VpsCmd @"
mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout backend.key \
  -out backend.crt \
  -subj '/C=TR/ST=Istanbul/L=Istanbul/O=PORNRAS/CN=api.pornras.com' 2>&1
chmod 600 backend.key
chmod 644 backend.crt
ls -lh backend.*
"@
    Write-Host $CreateSSL.Output -ForegroundColor Gray
}
Write-Host ""

Write-Host "[5/7] Nginx config test..." -ForegroundColor Cyan
$TestNginx = Invoke-VpsCmd "nginx -t 2>&1"
Write-Host $TestNginx.Output -ForegroundColor $(if ($TestNginx.Output -match "successful") { "Green" } else { "Red" })
Write-Host ""

if ($TestNginx.Output -match "successful") {
    Write-Host "[6/7] Nginx'i yeniden baslatiyorum..." -ForegroundColor Cyan
    $RestartNginx = Invoke-VpsCmd "systemctl reload nginx && sleep 2 && systemctl status nginx | head -7"
    Write-Host $RestartNginx.Output -ForegroundColor Gray
    Write-Host ""

    Write-Host "[7/7] api.pornras.com test ediliyor..." -ForegroundColor Cyan
    $TestAPI = Invoke-VpsCmd @"
echo '=== HTTP Test ==='
curl -s -I http://api.pornras.com/health 2>&1 | head -5
echo ''
echo '=== HTTPS Test (self-signed) ==='
curl -k -s https://api.pornras.com/health 2>&1 | head -3
"@
    Write-Host $TestAPI.Output -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Nginx config hatasi var!" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


