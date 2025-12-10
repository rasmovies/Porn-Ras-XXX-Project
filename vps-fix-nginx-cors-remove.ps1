# Nginx CORS Header'larini Kaldir - Backend CORS'u handle etsin
$vpsIP = "72.61.139.145"
$vpsUser = "root"
$vpsPassword = "Oyunbozan1907+"

if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Install-PackageProvider -Name NuGet -Force -Scope CurrentUser | Out-Null
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser -AllowClobber
}

try {
    $securePassword = ConvertTo-SecureString $vpsPassword -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($vpsUser, $securePassword)
    $session = New-SSHSession -ComputerName $vpsIP -Credential $credential -AcceptKey
    
    if ($session) {
        Write-Host "Nginx CORS Header'larini Kaldiriyor..." -ForegroundColor Cyan
        
        # Mevcut config'i yedekle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com /etc/nginx/sites-available/api.pornras.com.backup2" | Out-Null
        
        # Mevcut config'i oku
        Write-Host "Mevcut config okunuyor..." -ForegroundColor Cyan
        $currentConfig = Invoke-SSHCommand -SessionId $session.SessionId -Command "cat /etc/nginx/sites-available/api.pornras.com"
        Write-Host $currentConfig.Output
        
        # CORS header'larini kaldir - sadece proxy ayarlarini tut
        $newConfig = @'
server {
    listen 80;
    listen [::]:80;
    server_name api.pornras.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.pornras.com;

    ssl_certificate /etc/letsencrypt/live/api.pornras.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pornras.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # CORS header'larini kaldirdik - Backend CORS'u handle edecek
    # Nginx sadece proxy yapacak

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Origin header'ini backend'e ilet (CORS için kritik)
        proxy_set_header Origin $http_origin;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
'@
        
        # Config'i dosyaya yaz
        $configBytes = [System.Text.Encoding]::UTF8.GetBytes($newConfig)
        $configBase64 = [Convert]::ToBase64String($configBytes)
        
        Write-Host "`nYeni config yaziliyor (CORS header'lar olmadan)..." -ForegroundColor Cyan
        $writeCmd = "echo '$configBase64' | base64 -d > /etc/nginx/sites-available/api.pornras.com"
        $writeResult = Invoke-SSHCommand -SessionId $session.SessionId -Command $writeCmd
        Write-Host $writeResult.Output
        
        # Nginx test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t"
        Write-Host $test.Output
        
        if ($test.Output -match "syntax is ok" -or $test.Output -match "test is successful") {
            Write-Host "Nginx reload ediliyor..." -ForegroundColor Green
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            
            # Test
            Write-Host "`nOPTIONS Request Test (CORS header'lar backend'den gelecek):" -ForegroundColor Cyan
            $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' https://api.pornras.com/api/email/verification | grep -i access-control"
            Write-Host $optionsTest.Output
            
            Write-Host "`nFix tamamlandi! Backend CORS'u handle edecek." -ForegroundColor Green
        } else {
            Write-Host "Config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com.backup2 /etc/nginx/sites-available/api.pornras.com" | Out-Null
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


