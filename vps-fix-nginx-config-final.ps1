$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NGINX CONFIG FINAL DUZELTME" -ForegroundColor Cyan
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

Write-Host "[1/2] Nginx config'i duzeltiyorum (syntax hatasi gideriliyor)..." -ForegroundColor Cyan
$FixNginx = Invoke-VpsCmd @"
cat > /etc/nginx/sites-available/api.pornras.com << 'NGINXEOF'
# api.pornras.com - Backend API Server
# HTTP - HTTPS'e yonlendirme
server {
    listen 80;
    listen [::]:80;
    server_name api.pornras.com;

    # Let's Encrypt verification icin
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # HTTP'den HTTPS'e yonlendirme
    location / {
        return 301 https://`$host`$request_uri;
    }
}

# HTTPS - Let's Encrypt SSL sertifikasi
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.pornras.com;

    # Let's Encrypt sertifikalari
    ssl_certificate /etc/letsencrypt/live/api.pornras.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pornras.com/privkey.pem;

    # SSL ayarlari
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # OPTIONS preflight icin ayrı location
    location / {
        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'Content-Type, Authorization' always;

        # OPTIONS request handle
        if (`$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
            add_header Access-Control-Allow-Headers 'Content-Type, Authorization';
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Length 0;
            add_header Content-Type 'text/plain charset=UTF-8';
            return 204;
        }

        # Backend proxy
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

# IP uzerinden erisim icin (self-signed)
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

nginx -t 2>&1
"@
Write-Host $FixNginx.Output -ForegroundColor $(if ($FixNginx.Output -match "successful") { "Green" } else { "Red" })
Write-Host ""

if ($FixNginx.Output -match "successful") {
    Write-Host "[2/2] Nginx'i yeniden baslatiyorum ve test ediyorum..." -ForegroundColor Cyan
    $RestartNginx = Invoke-VpsCmd @"
systemctl reload nginx && sleep 2
echo '=== HTTPS Test ==='
curl -s https://api.pornras.com/health 2>&1
echo ''
echo '=== Email Endpoint Test ==='
curl -s -X POST https://api.pornras.com/api/email/verification \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"test@test.com\",\"username\":\"test\",\"verifyUrl\":\"https://test.com\"}' 2>&1 | head -3
"@
    Write-Host $RestartNginx.Output -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BASARILI!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "api.pornras.com artik calisiyor!" -ForegroundColor Green
} else {
    Write-Host "HATA DEVAM EDIYOR! Basit config deniyorum..." -ForegroundColor Red
    $SimpleConfig = Invoke-VpsCmd @"
cat > /etc/nginx/sites-available/api.pornras.com << 'NGINXEOF'
server {
    listen 80;
    server_name api.pornras.com;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    return 301 https://`$host`$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.pornras.com;
    
    ssl_certificate /etc/letsencrypt/live/api.pornras.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pornras.com/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        add_header Access-Control-Allow-Origin * always;
    }
}
NGINXEOF

nginx -t 2>&1 && systemctl reload nginx
"@
    Write-Host $SimpleConfig.Output -ForegroundColor Gray
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


