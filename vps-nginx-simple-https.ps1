$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NGINX HTTPS BASIT KURULUM" -ForegroundColor Cyan
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

Write-Host "[1/4] SSL sertifikasini olusturuyorum..." -ForegroundColor Cyan
$CreateSSL = Invoke-VpsCmd "mkdir -p /etc/nginx/ssl && cd /etc/nginx/ssl && openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout backend.key -out backend.crt -subj '/C=TR/ST=Istanbul/L=Istanbul/O=PORNRAS/CN=72.61.139.145' 2>&1 && chmod 600 backend.key && chmod 644 backend.crt && ls -lh backend.* && echo 'SSL OK'"
Write-Host $CreateSSL.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/4] Basit Nginx config olusturuyorum..." -ForegroundColor Cyan
$CreateNginx = Invoke-VpsCmd @"
cat > /etc/nginx/sites-available/backend-api << 'NGINXEOF'
server {
    listen 443 ssl http2;
    server_name 72.61.139.145;

    ssl_certificate /etc/nginx/ssl/backend.crt;
    ssl_certificate_key /etc/nginx/ssl/backend.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

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

server {
    listen 80;
    server_name 72.61.139.145;
    return 301 https://`$server_name`$request_uri;
}
NGINXEOF

ln -sf /etc/nginx/sites-available/backend-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
echo 'Config OK'
"@

Write-Host $CreateNginx.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/4] Nginx test..." -ForegroundColor Cyan
$TestNginx = Invoke-VpsCmd "nginx -t 2>&1"
Write-Host $TestNginx.Output -ForegroundColor $(if ($TestNginx.Output -match "successful") { "Green" } else { "Yellow" })
Write-Host ""

Write-Host "[4/4] Nginx'i baslatiyorum..." -ForegroundColor Cyan
$StartNginx = Invoke-VpsCmd "systemctl restart nginx && sleep 3 && systemctl status nginx | head -7"
Write-Host $StartNginx.Output -ForegroundColor Gray
Write-Host ""

Write-Host "HTTPS test..." -ForegroundColor Cyan
$TestHTTPS = Invoke-VpsCmd "curl -k -s https://localhost/health 2>&1 || curl -k -s https://72.61.139.145/health 2>&1"
Write-Host $TestHTTPS.Output -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "HTTPS KURULUMU TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "BACKEND HTTPS URL:" -ForegroundColor Cyan
Write-Host "  https://72.61.139.145" -ForegroundColor Green
Write-Host ""
Write-Host "VERCEL ICIN:" -ForegroundColor Yellow
Write-Host "  REACT_APP_API_BASE_URL = https://72.61.139.145" -ForegroundColor White
Write-Host ""
Write-Host "Sonraki adimlar:" -ForegroundColor Cyan
Write-Host "  1. Vercel Dashboard -> Environment Variables" -ForegroundColor Gray
Write-Host "  2. REACT_APP_API_BASE_URL degerini https://72.61.139.145 olarak guncelle" -ForegroundColor Gray
Write-Host "  3. Deployment'i yeniden baslat" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



