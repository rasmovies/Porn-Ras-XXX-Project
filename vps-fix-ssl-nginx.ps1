$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SSL SERTIFIKA VE NGINX DUZELTME" -ForegroundColor Cyan
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

Write-Host "[1/5] SSL sertifikasini olusturuyorum..." -ForegroundColor Cyan
$CreateSSL = Invoke-VpsCmd @"
mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl

# OpenSSL ile self-signed certificate oluştur
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout backend.key \
  -out backend.crt \
  -subj '/C=TR/ST=Istanbul/L=Istanbul/O=PORNRAS/CN=72.61.139.145' 2>&1

if [ -f backend.crt ] && [ -f backend.key ]; then
    chmod 600 backend.key
    chmod 644 backend.crt
    echo 'SSL sertifikalari olusturuldu'
    ls -lh backend.*
else
    echo 'SSL sertifika olusturma HATASI'
    echo 'OpenSSL output:'
    openssl version 2>&1
fi
"@

Write-Host $CreateSSL.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/5] Nginx config dosyasini olusturuyorum..." -ForegroundColor Cyan
$NginxConfig = @"
# Backend API için reverse proxy - HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 72.61.139.145;

    # SSL sertifikaları
    ssl_certificate /etc/nginx/ssl/backend.crt;
    ssl_certificate_key /etc/nginx/ssl/backend.key;

    # SSL ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # CORS headers
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS' always;
    add_header Access-Control-Allow-Headers 'Content-Type, Authorization' always;

    # OPTIONS preflight
    if (`$request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type, Authorization';
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Type 'text/plain charset=UTF-8';
        add_header Content-Length 0;
        return 204;
    }

    # Backend'e proxy
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# HTTP'den HTTPS'e yönlendirme
server {
    listen 80;
    listen [::]:80;
    server_name 72.61.139.145;
    return 301 https://`$server_name`$request_uri;
}
"@

$SetupNginx = Invoke-VpsCmd @"
cat > /etc/nginx/sites-available/backend-api << 'NGINXEOF'
$($NginxConfig -replace '\$','`$')
NGINXEOF

# Symlink oluştur
ln -sf /etc/nginx/sites-available/backend-api /etc/nginx/sites-enabled/backend-api

# Default site'ı devre dışı bırak
rm -f /etc/nginx/sites-enabled/default 2>/dev/null

echo 'Nginx config olusturuldu'
cat /etc/nginx/sites-available/backend-api | head -20
"@

Write-Host $SetupNginx.Output -ForegroundColor White
Write-Host ""

Write-Host "[3/5] Nginx config test..." -ForegroundColor Cyan
$TestNginx = Invoke-VpsCmd "nginx -t 2>&1"
Write-Host $TestNginx.Output -ForegroundColor $(if ($TestNginx.Output -match "successful") { "Green" } else { "Red" })
Write-Host ""

if ($TestNginx.Output -match "successful") {
    Write-Host "[4/5] Nginx'i yeniden baslatiyorum..." -ForegroundColor Cyan
    $RestartNginx = Invoke-VpsCmd "systemctl restart nginx && sleep 2 && systemctl status nginx | head -5"
    Write-Host $RestartNginx.Output -ForegroundColor Gray
    Write-Host ""

    Write-Host "[5/5] HTTPS backend test..." -ForegroundColor Cyan
    $TestHTTPS = Invoke-VpsCmd "curl -k -s https://localhost/health 2>&1 | head -5 || curl -k -s https://72.61.139.145/health 2>&1 | head -5"
    Write-Host $TestHTTPS.Output -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "Nginx config hatasi var, duzeltiliyor..." -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "HTTPS BACKEND URL:" -ForegroundColor Green
Write-Host "  https://72.61.139.145" -ForegroundColor Green
Write-Host ""
Write-Host "VERCEL ICIN:" -ForegroundColor Cyan
Write-Host "  1. Vercel Dashboard -> Settings -> Environment Variables" -ForegroundColor White
Write-Host "  2. REACT_APP_API_BASE_URL = https://72.61.139.145" -ForegroundColor White
Write-Host "  3. Deployment'i yeniden baslat" -ForegroundColor White
Write-Host ""
Write-Host "NOT:" -ForegroundColor Yellow
Write-Host "- Self-signed certificate (tarayici uyari verebilir)" -ForegroundColor Gray
Write-Host "- Production icin api.pornras.com domain'i ile Let's Encrypt kullanilmali" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



