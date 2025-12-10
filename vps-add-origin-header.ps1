# Origin Header'ini Ekle
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
        Write-Host "Origin Header'ini Ekliyor..." -ForegroundColor Cyan
        
        # Origin header'ını ekle (yoksa)
        $hasOrigin = Invoke-SSHCommand -SessionId $session.SessionId -Command "grep -c 'proxy_set_header Origin' /etc/nginx/sites-available/api.pornras.com"
        if ($hasOrigin.Output -eq "0") {
            Write-Host "Origin header'ı ekleniyor..." -ForegroundColor Cyan
            Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -i '/proxy_set_header X-Forwarded-Proto/a\        proxy_set_header Origin \$http_origin;' /etc/nginx/sites-available/api.pornras.com" | Out-Null
        } else {
            Write-Host "Origin header'ı zaten var." -ForegroundColor Green
        }
        
        # Nginx test ve reload
        Write-Host "`nNginx reload ediliyor..." -ForegroundColor Cyan
        $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t 2>&1"
        if ($test.Output -match "syntax is ok" -or $test.Output -match "test is successful") {
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            Write-Host "Nginx reload edildi!" -ForegroundColor Green
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


