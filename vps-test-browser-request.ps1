# Browser Request Simulation Test
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
        Write-Host "Browser Request Simulation Test Baslatiyor..." -ForegroundColor Cyan
        
        # Backend loglarini temizle
        Write-Host "`nBackend loglari temizleniyor..." -ForegroundColor Cyan
        Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 flush backend" | Out-Null
        
        # Browser'dan gelen POST request'i simüle et
        Write-Host "`nBrowser POST Request Simulation:" -ForegroundColor Cyan
        $postCmd = 'curl -v -X POST -H "Origin: https://www.pornras.com" -H "Content-Type: application/json" -H "Accept: application/json" -d "{\"email\":\"test@example.com\",\"username\":\"testuser\",\"verifyUrl\":\"https://www.pornras.com/verify?token=test\"}" https://api.pornras.com/api/email/verification 2>&1'
        $postResult = Invoke-SSHCommand -SessionId $session.SessionId -Command $postCmd
        Write-Host $postResult.Output
        
        # Backend loglarini kontrol et
        Write-Host "`nBackend Loglari (Son 20 satir):" -ForegroundColor Cyan
        $logs = Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 logs backend --lines 20 --nostream"
        Write-Host $logs.Output
        
        # Nginx access log kontrolu
        Write-Host "`nNginx Access Log (Son 10 satir - api.pornras.com):" -ForegroundColor Cyan
        $accessLog = Invoke-SSHCommand -SessionId $session.SessionId -Command "tail -10 /var/log/nginx/access.log | grep api.pornras.com"
        Write-Host $accessLog.Output
        
        # Nginx error log kontrolu
        Write-Host "`nNginx Error Log (Son 10 satir):" -ForegroundColor Cyan
        $errorLog = Invoke-SSHCommand -SessionId $session.SessionId -Command "tail -10 /var/log/nginx/error.log"
        Write-Host $errorLog.Output
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}

