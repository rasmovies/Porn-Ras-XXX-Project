# Nginx CORS Header'larini Sed ile Kaldir
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
        Write-Host "Nginx CORS Header'larini Sed ile Kaldiriyor..." -ForegroundColor Cyan
        
        # Yedekle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com /etc/nginx/sites-available/api.pornras.com.backup3" | Out-Null
        
        # CORS header satirlarini kaldir
        Write-Host "CORS header satirlarini kaldiriyor..." -ForegroundColor Cyan
        
        # add_header satirlarini kaldir
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i '/add_header Access-Control/d' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        
        # OPTIONS if bloğunu kaldir
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i '/if (\$request_method = '\''OPTIONS'\'')/,/return 204;/d' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        
        # CORS yorum satirlarini kaldir
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i '/# CORS headers/d' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i '/# OPTIONS request handle/d' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        
        # Origin header'ini proxy'ye ekle
        Write-Host "Origin header'ini proxy'ye ekliyor..." -ForegroundColor Cyan
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i '/proxy_set_header X-Forwarded-Proto/a\        proxy_set_header Origin \$http_origin;' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        
        # Config'i kontrol et
        Write-Host "`nGuncellenmis config:" -ForegroundColor Cyan
        $newConfig = Invoke-SSHCommand -SessionId $session.SessionId -Command "cat /etc/nginx/sites-available/api.pornras.com"
        Write-Host $newConfig.Output
        
        # Nginx test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t"
        Write-Host $test.Output
        
        if ($test.Output -match "syntax is ok" -or $test.Output -match "test is successful") {
            Write-Host "Nginx reload ediliyor..." -ForegroundColor Green
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            
            # Test
            Write-Host "`nOPTIONS Request Test:" -ForegroundColor Cyan
            $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' https://api.pornras.com/api/email/verification | grep -E '(HTTP|access-control|origin)'"
            Write-Host $optionsTest.Output
            
            Write-Host "`nFix tamamlandi!" -ForegroundColor Green
        } else {
            Write-Host "Config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com.backup3 /etc/nginx/sites-available/api.pornras.com" | Out-Null
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


