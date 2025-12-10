# Nginx Final Fix - OPTIONS bloğunu kaldır, Origin header'ını düzelt
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
        Write-Host "Nginx Final Fix Baslatiyor..." -ForegroundColor Cyan
        
        # Yedekle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com /etc/nginx/sites-available/api.pornras.com.backup4" | Out-Null
        
        # Boş Origin header'ını düzelt
        Write-Host "Boş Origin header'ını düzeltiyor..." -ForegroundColor Cyan
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i 's/proxy_set_header Origin ;/proxy_set_header Origin \$http_origin;/g' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        
        # OPTIONS if bloğunu tamamen kaldır
        Write-Host "OPTIONS if bloğunu kaldiriyor..." -ForegroundColor Cyan
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i '/if (\$request_method = '\''OPTIONS'\'')/,/return 204;/d' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        
        # Gereksiz yorum satırını kaldır
        Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i '/# OPTIONS preflight icin ayr/d' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        
        # Config'i kontrol et
        Write-Host "`nGuncellenmis config (api.pornras.com server bloğu):" -ForegroundColor Cyan
        $newConfig = Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -n '/server_name api.pornras.com/,/^}/p' /etc/nginx/sites-available/api.pornras.com | head -40"
        Write-Host $newConfig.Output
        
        # Nginx test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t"
        Write-Host $test.Output
        
        if ($test.Output -match "syntax is ok" -or $test.Output -match "test is successful") {
            Write-Host "Nginx reload ediliyor..." -ForegroundColor Green
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            
            # Test OPTIONS
            Write-Host "`nOPTIONS Request Test (Backend CORS):" -ForegroundColor Cyan
            $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' https://api.pornras.com/api/email/verification | grep -E '(HTTP|access-control|origin|vary)'"
            Write-Host $optionsTest.Output
            
            # Test POST
            Write-Host "`nPOST Request Test:" -ForegroundColor Cyan
            $postTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X POST -H 'Origin: https://www.pornras.com' -H 'Content-Type: application/json' https://api.pornras.com/api/email/verification | grep -E '(HTTP|access-control|origin|vary)'"
            Write-Host $postTest.Output
            
            Write-Host "`nFix tamamlandi! Backend CORS'u handle edecek." -ForegroundColor Green
        } else {
            Write-Host "Config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com.backup4 /etc/nginx/sites-available/api.pornras.com" | Out-Null
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


