# Nginx Config Heredoc ile Yaz
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
        Write-Host "Nginx Config Heredoc ile Yaziliyor..." -ForegroundColor Cyan
        
        # Yedekle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com /etc/nginx/sites-available/api.pornras.com.backup7" | Out-Null
        
        # Heredoc ile config yaz
        $heredocCmd = @'
cat > /etc/nginx/sites-available/api.pornras.com << 'NGINXEOF'
# api.pornras.com - Backend API Server
server {
    listen 80;
    listen [::]:80;
    server_name api.pornras.com;
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.pornras.com;
    ssl_certificate /etc/letsencrypt/live/api.pornras.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pornras.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin $http_origin;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

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
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin $http_origin;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name 72.61.139.145 _;
    return 301 https://$host$request_uri;
}
NGINXEOF
'@
        
        Write-Host "Heredoc ile config yaziliyor..." -ForegroundColor Cyan
        $writeResult = Invoke-SSHCommand -SessionId $session.SessionId -Command $heredocCmd
        Write-Host $writeResult.Output
        
        # Nginx test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t"
        Write-Host $test.Output
        
        if ($test.Output -match "syntax is ok" -or $test.Output -match "test is successful") {
            Write-Host "Nginx reload ediliyor..." -ForegroundColor Green
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            
            # Test
            Write-Host "`nOPTIONS Request Test:" -ForegroundColor Cyan
            $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' https://api.pornras.com/api/email/verification | head -20"
            Write-Host $optionsTest.Output
            
            Write-Host "`nConfig basariyla uygulandi!" -ForegroundColor Green
        } else {
            Write-Host "Config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com.backup7 /etc/nginx/sites-available/api.pornras.com" | Out-Null
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


