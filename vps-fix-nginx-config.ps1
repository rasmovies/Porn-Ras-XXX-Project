$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NGINX CONFIG TEMIZLIGI VE DUZELTME" -ForegroundColor Cyan
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

Write-Host "[1/5] Mevcut Nginx config'leri temizliyorum..." -ForegroundColor Cyan
$CleanConfig = Invoke-VpsCmd @"
# Tüm site config'lerini listele
ls -la /etc/nginx/sites-enabled/
echo '---'
# Tüm backend-api config'lerini kaldır
rm -f /etc/nginx/sites-enabled/backend-api
rm -f /etc/nginx/sites-available/backend-api
rm -f /etc/nginx/sites-enabled/default
echo 'Temizlik tamamlandi'
"@
Write-Host $CleanConfig.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/5] Yeni temiz Nginx config olusturuyorum..." -ForegroundColor Cyan
$NewConfig = Invoke-VpsCmd @"
cat > /etc/nginx/sites-available/backend-api << 'NGINXEOF'
# HTTPS Backend API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 72.61.139.145 _;

    ssl_certificate /etc/nginx/ssl/backend.crt;
    ssl_certificate_key /etc/nginx/ssl/backend.key;

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

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name 72.61.139.145 _;
    return 301 https://`$host`$request_uri;
}
NGINXEOF

# Symlink oluştur
ln -sf /etc/nginx/sites-available/backend-api /etc/nginx/sites-enabled/backend-api
echo 'Config olusturuldu'
"@
Write-Host $NewConfig.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/5] Nginx config test..." -ForegroundColor Cyan
$TestNginx = Invoke-VpsCmd "nginx -t 2>&1"
Write-Host $TestNginx.Output -ForegroundColor $(if ($TestNginx.Output -match "successful") { "Green" } else { "Red" })
Write-Host ""

if ($TestNginx.Output -match "successful") {
    Write-Host "[4/5] Nginx'i yeniden baslatiyorum..." -ForegroundColor Cyan
    $RestartNginx = Invoke-VpsCmd "systemctl reload nginx && sleep 2 && systemctl status nginx | head -7"
    Write-Host $RestartNginx.Output -ForegroundColor Gray
    Write-Host ""

    Write-Host "[5/5] HTTPS test (hem local hem external)..." -ForegroundColor Cyan
    $TestLocal = Invoke-VpsCmd "curl -k -s https://localhost/health 2>&1"
    Write-Host "Local test: $($TestLocal.Output)" -ForegroundColor $(if ($TestLocal.Output -match "OK") { "Green" } else { "Yellow" })
    
    $TestExternal = Invoke-VpsCmd "curl -k -s -m 5 https://72.61.139.145/health 2>&1"
    Write-Host "External test: $($TestExternal.Output)" -ForegroundColor $(if ($TestExternal.Output -match "OK") { "Green" } else { "Yellow" })
    Write-Host ""
    
    Write-Host "Port kontrolu..." -ForegroundColor Cyan
    $PortCheck = Invoke-VpsCmd "ss -tlnp | grep -E '(:443|:80)'"
    Write-Host $PortCheck.Output -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Nginx config hatasi var!" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Eger hala ERR_CONNECTION_TIMED_OUT aliyorsaniz:" -ForegroundColor Yellow
Write-Host "1. VPS provider firewall kontrolu (port 443 acik mi?)" -ForegroundColor Gray
Write-Host "2. Vercel'de REACT_APP_API_BASE_URL = https://72.61.139.145" -ForegroundColor Gray
Write-Host "3. Tarayici console'da network tab kontrolu" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


