$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LET'S ENCRYPT SSL SERTIFIKA KURULUMU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "GEREKSINIMLER:" -ForegroundColor Yellow
Write-Host "1. api.pornras.com subdomain'i DNS'de A kaydi ile VPS IP'ye yonlendirilmeli" -ForegroundColor White
Write-Host "2. Port 80 ve 443 acik olmali (acik)" -ForegroundColor White
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

Write-Host "[1/5] Certbot kurulumunu kontrol ediyorum..." -ForegroundColor Cyan
$CertbotCheck = Invoke-VpsCmd "which certbot || echo 'Certbot yok'"
Write-Host $CertbotCheck.Output -ForegroundColor Gray

if ($CertbotCheck.Output -match "yok") {
    Write-Host "Certbot kuruluyor..." -ForegroundColor Yellow
    $InstallCertbot = Invoke-VpsCmd "apt-get update -qq && apt-get install -y certbot python3-certbot-nginx 2>&1 | tail -5"
    Write-Host $InstallCertbot.Output -ForegroundColor Gray
} else {
    Write-Host "Certbot kurulu!" -ForegroundColor Green
}
Write-Host ""

Write-Host "[2/5] DNS kontrolu (api.pornras.com)..." -ForegroundColor Cyan
Write-Host "ONEMLI: api.pornras.com subdomain'i DNS'de A kaydi ile $VpsIp IP'sine yonlendirilmeli!" -ForegroundColor Yellow
Write-Host ""
Write-Host "DNS kontrolu yapiliyor..." -ForegroundColor Gray
$DNSCheck = Invoke-VpsCmd "nslookup api.pornras.com 2>&1 | head -10 || dig api.pornras.com +short 2>&1 || echo 'DNS kaydi bulunamadi'"
Write-Host $DNSCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/5] Nginx config'i api.pornras.com icin hazirliyorum..." -ForegroundColor Cyan
$NginxConfig = Invoke-VpsCmd @"
# Mevcut self-signed config'i yedekle
cp /etc/nginx/sites-available/backend-api /etc/nginx/sites-available/backend-api.backup 2>/dev/null || echo 'Yedek alinamadi'

# api.pornras.com icin yeni config
cat > /etc/nginx/sites-available/backend-api << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.pornras.com 72.61.139.145;

    # Let's Encrypt verification icin
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Backend proxy (gecici, Let's Encrypt sonrasi HTTPS'e gecilecek)
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}
NGINXEOF

# Nginx'i reload et
nginx -t && systemctl reload nginx
echo 'Nginx config hazir'
"@
Write-Host $NginxConfig.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/5] Let's Encrypt sertifikasi aliniyor..." -ForegroundColor Cyan
Write-Host "NOT: Bu islem DNS kaydi dogruysa calisacak" -ForegroundColor Yellow
Write-Host ""
$LetsEncrypt = Invoke-VpsCmd @"
certbot --nginx -d api.pornras.com --non-interactive --agree-tos --email admin@pornras.com --redirect 2>&1
"@
Write-Host $LetsEncrypt.Output -ForegroundColor $(if ($LetsEncrypt.Output -match "Successfully") { "Green" } else { "Yellow" })
Write-Host ""

if ($LetsEncrypt.Output -match "Successfully" -or $LetsEncrypt.Output -match "Certificate") {
    Write-Host "[5/5] SSL sertifikasi basariyla kuruldu!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test ediliyor..." -ForegroundColor Cyan
    $TestSSL = Invoke-VpsCmd "curl -s https://api.pornras.com/health 2>&1 | head -3"
    Write-Host $TestSSL.Output -ForegroundColor Gray
} else {
    Write-Host "[5/5] Let's Encrypt kurulumu basarisiz!" -ForegroundColor Red
    Write-Host ""
    Write-Host "OLASI NEDENLER:" -ForegroundColor Yellow
    Write-Host "1. api.pornras.com DNS'de A kaydi yok veya yanlis IP'ye yonlendirilmis" -ForegroundColor White
    Write-Host "2. DNS propagation henuz tamamlanmamis (24 saat surebilir)" -ForegroundColor White
    Write-Host "3. Port 80 erisilemiyor (firewall)" -ForegroundColor White
    Write-Host ""
    Write-Host "COZUM:" -ForegroundColor Cyan
    Write-Host "1. DNS panelinde api.pornras.com -> A kaydi -> $VpsIp ekleyin" -ForegroundColor White
    Write-Host "2. DNS propagation icin bekleyin (genelde 5-30 dakika)" -ForegroundColor White
    Write-Host "3. Tekrar bu scripti calistirin" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "BASARILI OLURSA:" -ForegroundColor Green
Write-Host "  Vercel'de REACT_APP_API_BASE_URL = https://api.pornras.com" -ForegroundColor White
Write-Host ""
Write-Host "BASARISIZ OLURSA:" -ForegroundColor Red
Write-Host "  1. DNS kaydini kontrol edin" -ForegroundColor White
Write-Host "  2. DNS propagation icin bekleyin" -ForegroundColor White
Write-Host "  3. Scripti tekrar calistirin" -ForegroundColor White
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


