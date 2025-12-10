# Final CORS Test - Browser Request Simulasyonu
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
        Write-Host "Final CORS Test Baslatiyor..." -ForegroundColor Cyan
        
        # Backend loglarini temizle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 flush backend" | Out-Null
        
        # 1. OPTIONS preflight test
        Write-Host "`n1. OPTIONS Preflight Test:" -ForegroundColor Yellow
        $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: Content-Type,Accept' https://api.pornras.com/api/email/verification | grep -E '(HTTP|access-control|origin|vary)'"
        Write-Host $optionsTest.Output
        
        # 2. POST request test (browser'dan gelecek gibi)
        Write-Host "`n2. POST Request Test (Browser Simulation):" -ForegroundColor Yellow
        $postCmd = 'curl -s -X POST -H "Origin: https://www.pornras.com" -H "Content-Type: application/json" -H "Accept: application/json" -H "Referer: https://www.pornras.com/" -d "{\"email\":\"test@example.com\",\"username\":\"testuser\",\"verifyUrl\":\"https://www.pornras.com/verify\"}" https://api.pornras.com/api/email/verification 2>&1 | head -5'
        $postTest = Invoke-SSHCommand -SessionId $session.SessionId -Command $postCmd
        Write-Host $postTest.Output
        
        # 3. Backend CORS log kontrolu
        Write-Host "`n3. Backend CORS Log Kontrolu:" -ForegroundColor Yellow
        $corsLog = Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 logs backend --lines 30 --nostream | grep -i -E '(cors|origin|OPTIONS|POST)'"
        Write-Host $corsLog.Output
        
        # 4. Nginx access log kontrolu
        Write-Host "`n4. Nginx Access Log (Son 5 satir):" -ForegroundColor Yellow
        $accessLog = Invoke-SSHCommand -SessionId $session.SessionId -Command "tail -5 /var/log/nginx/access.log | grep api.pornras.com"
        Write-Host $accessLog.Output
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}

