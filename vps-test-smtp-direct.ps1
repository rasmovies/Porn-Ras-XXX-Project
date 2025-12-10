$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

Import-Module Posh-SSH -Force

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SMTP DIRECT TEST VE DUZELTME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] SMTP baglanti testi:" -ForegroundColor Cyan
$SmtpTest = Invoke-VpsCmd "timeout 3 bash -c 'echo QUIT | telnet 127.0.0.1 1025' 2>&1 | head -5 || nc -zv 127.0.0.1 1025 2>&1"
Write-Host $SmtpTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] emailService.js transporter ayarlari kontrol:" -ForegroundColor Cyan
Write-Host "NOT: Proton Mail Bridge STARTTLS kullaniyor, secure: false dogru" -ForegroundColor Yellow
Write-Host "Ama belki requireTLS veya diğer ayarlar eksik" -ForegroundColor Yellow

# emailService.js'yi oku ve güncelle
$LocalFile = "server\services\emailService.js"
$FileContent = Get-Content $LocalFile -Raw -Encoding UTF8

# requireTLS ekle (STARTTLS için)
if ($FileContent -notmatch 'requireTLS') {
    Write-Host ""
    Write-Host "[3/4] requireTLS ayari ekleniyor..." -ForegroundColor Cyan
    # tls bloğuna requireTLS ekle
    $FileContent = $FileContent -replace '(tls: \{[\s\S]*?rejectUnauthorized: false,[\s\S]*?\})', "tls: {`n      rejectUnauthorized: false, // Proton Mail Bridge self-signed certificate`n      requireTLS: true, // STARTTLS kullan`n    },"
    
    $FileContent | Set-Content $LocalFile -Encoding UTF8 -NoNewline
    Write-Host "OK: requireTLS eklendi" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[3/4] requireTLS zaten var" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[4/4] Guncellenmis dosya VPS'e yukleniyor..." -ForegroundColor Cyan
$FileBytes = [System.Text.Encoding]::UTF8.GetBytes($FileContent)
$Base64Content = [Convert]::ToBase64String($FileBytes)

$UploadCmd = "cd $BackendPath/services && cp emailService.js emailService.js.backup6 && echo '$Base64Content' | base64 -d > emailService.js && chmod 644 emailService.js && echo 'OK'"
$UploadResult = Invoke-VpsCmd $UploadCmd
Write-Host $UploadResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Guncellenmis transporter:" -ForegroundColor Cyan
$UpdatedConfig = Invoke-VpsCmd "cd $BackendPath/services && grep -A 15 'nodemailer.createTransport' emailService.js"
Write-Host $UpdatedConfig.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 restart adulttube-backend --update-env" | Out-Null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host "API Response: $($TestResult.Output)" -ForegroundColor Gray

if ($TestResult.Output -like '*"success":true*') {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BASARILI! EMAIL GONDERIMI CALISYOR!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Son hata loglari:" -ForegroundColor Red
    $ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 8 --nostream 2>&1 | tail -8"
    Write-Host $ErrorLogs.Output -ForegroundColor Red
    
    Write-Host ""
    Write-Host "Bridge loglari:" -ForegroundColor Cyan
    $BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 5 --no-pager | tail -5"
    Write-Host $BridgeLogs.Output -ForegroundColor Gray
}

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

