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
Write-Host "SMTP AUTHENTICATION DUZELTMESI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Mevcut emailService.js transporter konfigurasyonu:" -ForegroundColor Cyan
$CurrentConfig = Invoke-VpsCmd "cd $BackendPath/services && grep -A 10 'nodemailer.createTransport' emailService.js"
Write-Host $CurrentConfig.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/5] SMTP manuel test (telnet ile):" -ForegroundColor Cyan
$SmtpTest = Invoke-VpsCmd "timeout 3 bash -c 'echo -e \"EHLO test\\nAUTH PLAIN $(echo -ne \"\\0pornras@proton.me\\0MoQL_M-Loyi1fB3b9tKWew\" | base64)\\nQUIT\" | nc 127.0.0.1 1025' 2>&1 || echo 'Test tamamlanamadi'"
Write-Host $SmtpTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/5] emailService.js'ye authMethod ekleniyor..." -ForegroundColor Cyan

# emailService.js dosyasını oku ve düzelt
$LocalFile = "server\services\emailService.js"
$FileContent = Get-Content $LocalFile -Raw -Encoding UTF8

# authMethod ekle (eğer yoksa)
if ($FileContent -notmatch 'authMethod') {
    # transporter konfigurasyonunu bul ve authMethod ekle
    $FileContent = $FileContent -replace '(auth:.*\n.*\n.*undefined,)', "`$1`n    authMethod: 'PLAIN',"
    
    # Dosyayı kaydet
    $FileContent | Set-Content $LocalFile -Encoding UTF8 -NoNewline
    Write-Host "OK: authMethod eklendi" -ForegroundColor Green
} else {
    Write-Host "authMethod zaten var" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[4/5] Guncellenmis dosya VPS'e yukleniyor..." -ForegroundColor Cyan
$FileBytes = [System.Text.Encoding]::UTF8.GetBytes($FileContent)
$Base64Content = [Convert]::ToBase64String($FileBytes)

$UploadCmd = "cd $BackendPath/services && cp emailService.js emailService.js.backup5 && echo '$Base64Content' | base64 -d > emailService.js && chmod 644 emailService.js && echo 'OK'"
$UploadResult = Invoke-VpsCmd $UploadCmd
Write-Host $UploadResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Guncellenmis transporter konfigurasyonu:" -ForegroundColor Cyan
$UpdatedConfig = Invoke-VpsCmd "cd $BackendPath/services && grep -A 12 'nodemailer.createTransport' emailService.js"
Write-Host $UpdatedConfig.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/5] Backend yeniden baslatiliyor ve test ediliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 restart adulttube-backend --update-env" | Out-Null
Start-Sleep -Seconds 5

$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host ""
Write-Host "API Response: $($TestResult.Output)" -ForegroundColor Gray

if ($TestResult.Output -like '*"success":true*') {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BASARILI! EMAIL GONDERIMI CALISYOR!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Hata loglari:" -ForegroundColor Red
    $ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 10 --nostream 2>&1 | tail -10"
    Write-Host $ErrorLogs.Output -ForegroundColor Red
}

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

