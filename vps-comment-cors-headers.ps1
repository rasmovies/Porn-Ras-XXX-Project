# CORS Header'larini Comment Yap
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
        Write-Host "CORS Header'larini Comment Yapiyor..." -ForegroundColor Cyan
        
        # Yedekle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com /etc/nginx/sites-available/api.pornras.com.backup8" | Out-Null
        
        # add_header satirlarini comment yap
        Write-Host "add_header satirlarini comment yapiyor..." -ForegroundColor Cyan
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i 's/^\([[:space:]]*\)add_header Access-Control/\1# add_header Access-Control/g' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i 's/^\([[:space:]]*\)add_header Content-Length/\1# add_header Content-Length/g' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i 's/^\([[:space:]]*\)add_header Content-Type/\1# add_header Content-Type/g' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        
        # OPTIONS if bloğunu comment yap
        Write-Host "OPTIONS if blogunu comment yapiyor..." -ForegroundColor Cyan
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i '/if (\$request_method = .OPTIONS.)/,/return 204;/s/^/# /' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        
        # Origin header'ını ekle (yoksa)
        Write-Host "Origin header'ini ekliyor..." -ForegroundColor Cyan
        $hasOrigin = Invoke-SSHCommand -SessionId $session.SessionId -Command "grep -c 'proxy_set_header Origin' /etc/nginx/sites-available/api.pornras.com"
        if ($hasOrigin.Output -eq "0") {
            Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i '/proxy_set_header X-Forwarded-Proto/a\        proxy_set_header Origin \$http_origin;' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        }
        
        # Config'i kontrol et
        Write-Host "`nGuncellenmis config (location / bloğu):" -ForegroundColor Cyan
        $locationBlock = Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -n '/location \/ {/,/^    }/p' /etc/nginx/sites-available/api.pornras.com"
        Write-Host $locationBlock.Output
        
        # Nginx test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t 2>&1"
        Write-Host $test.Output
        
        if ($test.Output -match "syntax is ok" -or $test.Output -match "test is successful") {
            Write-Host "Nginx reload ediliyor..." -ForegroundColor Green
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            
            # Test
            Write-Host "`nOPTIONS Request Test (Backend CORS):" -ForegroundColor Cyan
            $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' https://api.pornras.com/api/email/verification | grep -E '(HTTP|access-control|origin|vary)'"
            Write-Host $optionsTest.Output
            
            Write-Host "`nFix tamamlandi!" -ForegroundColor Green
        } else {
            Write-Host "Config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com.backup8 /etc/nginx/sites-available/api.pornras.com" | Out-Null
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


