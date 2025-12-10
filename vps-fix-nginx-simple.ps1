# Nginx Config Fix - Basit Yontem
$vpsIP = "72.61.139.145"
$vpsUser = "root"
$vpsPassword = "Oyunbozan1907+"

Write-Host "Nginx Config Fix Baslatiyor..." -ForegroundColor Cyan

if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Install-PackageProvider -Name NuGet -Force -Scope CurrentUser | Out-Null
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser -AllowClobber
}

try {
    $securePassword = ConvertTo-SecureString $vpsPassword -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($vpsUser, $securePassword)
    
    $session = New-SSHSession -ComputerName $vpsIP -Credential $credential -AcceptKey
    
    if ($session) {
        Write-Host "VPS baglantisi basarili!" -ForegroundColor Green
        
        # Mevcut config'i yedekle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup" | Out-Null
        
        # Nginx config'i cat ile oluştur (heredoc benzeri)
        $configCmd = @'
cat > /etc/nginx/sites-available/default << 'NGINXCONF'
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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINXCONF
'@
        
        Write-Host "Nginx config yaziliyor..." -ForegroundColor Cyan
        $writeResult = Invoke-SSHCommand -SessionId $session.SessionId -Command $configCmd
        Write-Host $writeResult.Output
        
        # Nginx config test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $testResult = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t"
        Write-Host $testResult.Output
        
        if ($testResult.Output -match "syntax is ok" -or $testResult.Output -match "test is successful") {
            Write-Host "Nginx config gecerli! Reload ediliyor..." -ForegroundColor Green
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            Write-Host "Nginx reload edildi!" -ForegroundColor Green
            
            # Test
            Write-Host "`nAPI test ediliyor..." -ForegroundColor Cyan
            $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I https://api.pornras.com/health"
            Write-Host $test.Output
        } else {
            Write-Host "Nginx config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/default.backup /etc/nginx/sites-available/default" | Out-Null
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
        Write-Host "`nIslem tamamlandi!" -ForegroundColor Green
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


