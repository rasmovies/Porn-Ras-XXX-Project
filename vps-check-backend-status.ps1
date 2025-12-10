# VPS Backend Durum Kontrolu
$vpsIP = "72.61.139.145"
$vpsUser = "root"
$vpsPassword = "Oyunbozan1907+"

Write-Host "VPS Backend Durum Kontrolu Baslatiyor..." -ForegroundColor Cyan

# Posh-SSH modulunu kontrol et
if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "Posh-SSH modulu yukleniyor..." -ForegroundColor Yellow
    Install-PackageProvider -Name NuGet -Force -Scope CurrentUser | Out-Null
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser -AllowClobber
}

# SSH baglantisi
try {
    $securePassword = ConvertTo-SecureString $vpsPassword -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($vpsUser, $securePassword)
    
    Write-Host "VPS'e baglaniyor..." -ForegroundColor Cyan
    $session = New-SSHSession -ComputerName $vpsIP -Credential $credential -AcceptKey
    
    if ($session) {
        Write-Host "VPS baglantisi basarili!" -ForegroundColor Green
        
        # PM2 durumunu kontrol et
        Write-Host "`nPM2 Process Durumu:" -ForegroundColor Cyan
        $pm2Status = Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 list"
        Write-Host $pm2Status.Output
        
        # Backend port kontrolu
        Write-Host "`nPort 5000 Kontrolu:" -ForegroundColor Cyan
        $portCheck = Invoke-SSHCommand -SessionId $session.SessionId -Command "netstat -tlnp | grep :5000"
        Write-Host $portCheck.Output
        
        # Nginx durumu
        Write-Host "`nNginx Durumu:" -ForegroundColor Cyan
        $nginxStatus = Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl status nginx --no-pager | head -20"
        Write-Host $nginxStatus.Output
        
        # Backend loglari (son 20 satir)
        Write-Host "`nBackend Loglari (Son 20 satir):" -ForegroundColor Cyan
        $logs = Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 logs backend --lines 20 --nostream"
        Write-Host $logs.Output
        
        # API endpoint testi (localhost)
        Write-Host "`nBackend API Testi (localhost):" -ForegroundColor Cyan
        $apiTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s http://localhost:5000/health"
        Write-Host $apiTest.Output
        
        # Nginx config kontrolu
        Write-Host "`nNginx Config Kontrolu:" -ForegroundColor Cyan
        $nginxConfig = Invoke-SSHCommand -SessionId $session.SessionId -Command "cat /etc/nginx/sites-available/default | grep -A 10 api.pornras.com"
        Write-Host $nginxConfig.Output
        
        # SSL sertifika kontrolu
        Write-Host "`nSSL Sertifika Kontrolu:" -ForegroundColor Cyan
        $sslCheck = Invoke-SSHCommand -SessionId $session.SessionId -Command "certbot certificates 2>/dev/null | grep -A 5 api.pornras.com"
        Write-Host $sslCheck.Output
        
        # Firewall kontrolu
        Write-Host "`nFirewall Durumu:" -ForegroundColor Cyan
        $firewallStatus = Invoke-SSHCommand -SessionId $session.SessionId -Command "ufw status | head -10"
        Write-Host $firewallStatus.Output
        
        # External API test
        Write-Host "`nExternal API Test (api.pornras.com):" -ForegroundColor Cyan
        $externalTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I https://api.pornras.com/health"
        Write-Host $externalTest.Output
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
        Write-Host "`nKontrol tamamlandi!" -ForegroundColor Green
    } else {
        Write-Host "VPS baglantisi basarisiz!" -ForegroundColor Red
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}
