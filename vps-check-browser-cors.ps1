# Browser CORS Test - Gercek Browser Request Simulasyonu
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
        Write-Host "Browser CORS Test Baslatiyor..." -ForegroundColor Cyan
        
        # 1. OPTIONS preflight request test (browser'dan gelecek gibi)
        Write-Host "`n1. OPTIONS Preflight Request Test:" -ForegroundColor Yellow
        $optionsCmd = 'curl -v -X OPTIONS -H "Origin: https://www.pornras.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Accept" https://api.pornras.com/api/email/verification 2>&1 | grep -E "(HTTP|access-control|origin|vary)"'
        $optionsResult = Invoke-SSHCommand -SessionId $session.SessionId -Command $optionsCmd
        Write-Host $optionsResult.Output
        
        # 2. POST request test (browser'dan gelecek gibi - tam header'lar)
        Write-Host "`n2. POST Request Test (Browser Headers):" -ForegroundColor Yellow
        $postCmd = 'curl -v -X POST -H "Origin: https://www.pornras.com" -H "Content-Type: application/json" -H "Accept: application/json" -H "Referer: https://www.pornras.com/" -H "User-Agent: Mozilla/5.0" -d "{\"email\":\"test@example.com\",\"username\":\"test\",\"verifyUrl\":\"https://www.pornras.com/verify\"}" https://api.pornras.com/api/email/verification 2>&1 | head -50'
        $postResult = Invoke-SSHCommand -SessionId $session.SessionId -Command $postCmd
        Write-Host $postResult.Output
        
        # 3. Backend CORS log kontrolu
        Write-Host "`n3. Backend CORS Log Kontrolu:" -ForegroundColor Yellow
        $corsLog = Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 logs backend --lines 50 --nostream | grep -i cors"
        Write-Host $corsLog.Output
        
        # 4. Nginx CORS header kontrolu
        Write-Host "`n4. Nginx Config CORS Headers:" -ForegroundColor Yellow
        $nginxCors = Invoke-SSHCommand -SessionId $session.SessionId -Command "cat /etc/nginx/sites-available/api.pornras.com | grep -A 5 -i cors"
        Write-Host $nginxCors.Output
        
        # 5. Backend server.js CORS ayarlari
        Write-Host "`n5. Backend server.js CORS Ayarlari:" -ForegroundColor Yellow
        $serverCors = Invoke-SSHCommand -SessionId $session.SessionId -Command "grep -A 30 'allowedOrigins' /var/www/server/server.js | head -35"
        Write-Host $serverCors.Output
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


