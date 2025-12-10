# Nginx Config ve CORS Fix
$vpsIP = "72.61.139.145"
$vpsUser = "root"
$vpsPassword = "Oyunbozan1907+"

Write-Host "Nginx Config ve CORS Fix Baslatiyor..." -ForegroundColor Cyan

# Posh-SSH modulunu kontrol et
if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "Posh-SSH modulu yukleniyor..." -ForegroundColor Yellow
    Install-PackageProvider -Name NuGet -Force -Scope CurrentUser | Out-Null
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser -AllowClobber
}

try {
    $securePassword = ConvertTo-SecureString $vpsPassword -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($vpsUser, $securePassword)
    
    Write-Host "VPS'e baglaniyor..." -ForegroundColor Cyan
    $session = New-SSHSession -ComputerName $vpsIP -Credential $credential -AcceptKey
    
    if ($session) {
        Write-Host "VPS baglantisi basarili!" -ForegroundColor Green
        
        # Mevcut Nginx config'i yedekle
        Write-Host "`nNginx config yedekleniyor..." -ForegroundColor Cyan
        $backup = Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup"
        Write-Host "Yedek olusturuldu" -ForegroundColor Green
        
        # Nginx config'i oku
        Write-Host "`nMevcut Nginx config okunuyor..." -ForegroundColor Cyan
        $currentConfig = Invoke-SSHCommand -SessionId $session.SessionId -Command "cat /etc/nginx/sites-available/default"
        Write-Host $currentConfig.Output
        
        # Yeni Nginx config oluştur
        $nginxConfig = @"
server {
    listen 80;
    listen [::]:80;
    server_name api.pornras.com;
    return 301 https://`$host`$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.pornras.com;

    ssl_certificate /etc/letsencrypt/live/api.pornras.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pornras.com/privkey.pem;
    
    # SSL ayarlari
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # CORS headers - Nginx seviyesinde
    add_header 'Access-Control-Allow-Origin' 'https://www.pornras.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    add_header 'Access-Control-Allow-Credentials' 'false' always;

    # Preflight request handling
    if (`$request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://www.pornras.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
        
        # Timeout ayarlari
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
"@

        # Config'i dosyaya yaz
        Write-Host "`nYeni Nginx config yaziliyor..." -ForegroundColor Cyan
        $configBytes = [System.Text.Encoding]::UTF8.GetBytes($nginxConfig)
        $configBase64 = [Convert]::ToBase64String($configBytes)
        
        $writeConfig = Invoke-SSHCommand -SessionId $session.SessionId -Command "echo '$configBase64' | base64 -d > /etc/nginx/sites-available/default"
        
        # Nginx config test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $testConfig = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t"
        Write-Host $testConfig.Output
        
        if ($testConfig.Output -match "syntax is ok") {
            Write-Host "Nginx config gecerli!" -ForegroundColor Green
            
            # Nginx'i reload et
            Write-Host "`nNginx reload ediliyor..." -ForegroundColor Cyan
            $reload = Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx"
            Write-Host "Nginx reload edildi!" -ForegroundColor Green
            
            # Test
            Write-Host "`nAPI test ediliyor..." -ForegroundColor Cyan
            $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' https://api.pornras.com/api/email/verification"
            Write-Host $test.Output
        } else {
            Write-Host "Nginx config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            $restore = Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default"
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
        Write-Host "`nIslem tamamlandi!" -ForegroundColor Green
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}

