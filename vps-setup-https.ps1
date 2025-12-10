$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS BACKEND HTTPS KURULUMU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SORUN: Mixed Content Error" -ForegroundColor Red
Write-Host "- HTTPS sayfa HTTP backend'e istek yapiyor" -ForegroundColor Yellow
Write-Host "- Tarayici bunu guvenlik nedeniyle engelliyor" -ForegroundColor Yellow
Write-Host ""
Write-Host "COZUM: Nginx reverse proxy ile SSL/HTTPS ekliyoruz" -ForegroundColor Green
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

Write-Host "[1/6] Nginx kurulumunu kontrol ediyorum..." -ForegroundColor Cyan
$NginxCheck = Invoke-VpsCmd "which nginx || echo 'Nginx yok'"
Write-Host $NginxCheck.Output -ForegroundColor Gray

if ($NginxCheck.Output -match "yok") {
    Write-Host "Nginx yok, kuruyorum..." -ForegroundColor Yellow
    $InstallNginx = Invoke-VpsCmd "apt-get update -qq && apt-get install -y nginx certbot python3-certbot-nginx 2>&1 | tail -5"
    Write-Host $InstallNginx.Output -ForegroundColor Gray
} else {
    Write-Host "Nginx kurulu!" -ForegroundColor Green
}
Write-Host ""

Write-Host "[2/6] Backend domain'i belirliyorum..." -ForegroundColor Cyan
Write-Host "NOT: Backend icin bir subdomain gerekiyor (api.pornras.com gibi)" -ForegroundColor Yellow
Write-Host "VEYA: IP uzerinden HTTPS icin self-signed certificate kullanabiliriz" -ForegroundColor Yellow
Write-Host ""

Write-Host "[3/6] Gecici cozum: Nginx reverse proxy ile HTTPS (self-signed)" -ForegroundColor Cyan
Write-Host "Production icin Let's Encrypt kullanilmali (api.pornras.com domain'i gerekli)" -ForegroundColor Yellow
Write-Host ""

# Nginx config oluştur
$NginxConfig = @"
# Backend API için reverse proxy
server {
    listen 443 ssl http2;
    server_name 72.61.139.145;

    # Self-signed certificate (geçici)
    ssl_certificate /etc/nginx/ssl/backend.crt;
    ssl_certificate_key /etc/nginx/ssl/backend.key;

    # SSL ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

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
    }
}

# HTTP'den HTTPS'e yönlendirme
server {
    listen 80;
    server_name 72.61.139.145;
    return 301 https://`$server_name`$request_uri;
}
"@

Write-Host "[4/6] SSL sertifika klasorunu olusturuyorum..." -ForegroundColor Cyan
$SetupSSL = Invoke-VpsCmd @"
mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl

# Self-signed certificate oluştur (10 yıl geçerli)
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout backend.key \
  -out backend.crt \
  -subj "/C=TR/ST=Istanbul/L=Istanbul/O=PORNRAS/CN=72.61.139.145" 2>&1

chmod 600 backend.key
chmod 644 backend.crt
echo 'SSL sertifikalari olusturuldu'
ls -la /etc/nginx/ssl/
"@

Write-Host $SetupSSL.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[5/6] Nginx config dosyasini olusturuyorum..." -ForegroundColor Cyan
$NginxConfigEscaped = $NginxConfig -replace '\$', '`$'
$SetupNginx = Invoke-VpsCmd @"
cat > /etc/nginx/sites-available/backend-api << 'NGINXEOF'
$NginxConfigEscaped
NGINXEOF

# Symlink oluştur
ln -sf /etc/nginx/sites-available/backend-api /etc/nginx/sites-enabled/backend-api

# Default site'ı devre dışı bırak
rm -f /etc/nginx/sites-enabled/default

# Nginx config test
nginx -t 2>&1
"@

Write-Host $SetupNginx.Output -ForegroundColor White
Write-Host ""

Write-Host "[6/6] Nginx'i yeniden baslatiyorum..." -ForegroundColor Cyan
$RestartNginx = Invoke-VpsCmd "systemctl restart nginx && systemctl status nginx | head -5"
Write-Host $RestartNginx.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "HTTPS backend URL:" -ForegroundColor Green
Write-Host "  https://72.61.139.145" -ForegroundColor Green
Write-Host ""
Write-Host "VERCEL ICIN:" -ForegroundColor Cyan
Write-Host "  REACT_APP_API_BASE_URL = https://72.61.139.145" -ForegroundColor White
Write-Host ""
Write-Host "NOT:" -ForegroundColor Yellow
Write-Host "- Self-signed certificate kullanildi (tarayici uyari verebilir)" -ForegroundColor Gray
Write-Host "- Production icin api.pornras.com domain'i ile Let's Encrypt kullanilmali" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



