# CORS Request Test
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
        Write-Host "CORS Request Test Baslatiyor..." -ForegroundColor Cyan
        
        # Backend loglarini temizle ve izle
        Write-Host "`nBackend loglari (son 30 satir):" -ForegroundColor Cyan
        $logs = Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 logs backend --lines 30 --nostream"
        Write-Host $logs.Output
        
        # OPTIONS request test (external)
        Write-Host "`nOPTIONS Request Test (External):" -ForegroundColor Cyan
        $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -v -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: Content-Type' https://api.pornras.com/api/email/verification 2>&1"
        Write-Host $optionsTest.Output
        
        # POST request test (external)
        Write-Host "`nPOST Request Test (External):" -ForegroundColor Cyan
        $postTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -v -X POST -H 'Origin: https://www.pornras.com' -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"username\":\"test\",\"verifyUrl\":\"https://test.com\"}' https://api.pornras.com/api/email/verification 2>&1"
        Write-Host $postTest.Output
        
        # Backend process kontrolu
        Write-Host "`nBackend Process Durumu:" -ForegroundColor Cyan
        $pm2Status = Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 describe backend"
        Write-Host $pm2Status.Output
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


