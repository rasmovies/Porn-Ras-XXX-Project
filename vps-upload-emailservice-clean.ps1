$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"
$LocalFile = "server\services\emailService.js"

Import-Module Posh-SSH -Force

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[1/5] Yerel emailService.js okunuyor..." -ForegroundColor Cyan
$FileContent = Get-Content $LocalFile -Raw -Encoding UTF8

# TLS konfigurasyonunu kontrol et
if ($FileContent -match 'tls.*rejectUnauthorized.*false') {
    Write-Host "OK: Yerel dosyada TLS konfigurasyonu var" -ForegroundColor Green
} else {
    Write-Host "UYARI: Yerel dosyada TLS konfigurasyonu bulunamadi!" -ForegroundColor Yellow
}

Write-Host "[2/5] Dosya Base64'e cevriliyor..." -ForegroundColor Cyan
$FileBytes = [System.Text.Encoding]::UTF8.GetBytes($FileContent)
$Base64Content = [Convert]::ToBase64String($FileBytes)

Write-Host "[3/5] Dosya VPS'e yukleniyor..." -ForegroundColor Cyan
$UploadCmd = @"
cd $BackendPath/services
cp emailService.js emailService.js.backup3
echo '$Base64Content' | base64 -d > emailService.js
chmod 644 emailService.js
"@

$UploadResult = Invoke-VpsCmd $UploadCmd
if ($UploadResult.ExitStatus -eq 0) {
    Write-Host "OK: Dosya yuklendi" -ForegroundColor Green
} else {
    Write-Host "HATA: Dosya yuklenemedi!" -ForegroundColor Red
    Write-Host $UploadResult.Error -ForegroundColor Red
}

Write-Host ""
Write-Host "[4/5] Dosya dogrulaniyor..." -ForegroundColor Cyan
$Verify = Invoke-VpsCmd "cd $BackendPath/services && grep -A 10 'nodemailer.createTransport' emailService.js"
Write-Host $Verify.Output -ForegroundColor Gray

# TLS kontrolü
$TlsCheck = Invoke-VpsCmd "cd $BackendPath/services && grep -i 'rejectUnauthorized' emailService.js"
if ($TlsCheck.Output) {
    Write-Host ""
    Write-Host "OK: TLS konfigurasyonu bulundu:" -ForegroundColor Green
    Write-Host $TlsCheck.Output -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "HATA: TLS konfigurasyonu bulunamadi!" -ForegroundColor Red
}

Write-Host ""
Write-Host "[5/5] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete all 2>&1; pm2 kill 2>&1" | Out-Null
Start-Sleep -Seconds 3

Invoke-VpsCmd "cd $BackendPath && pm2 start server.js --name adulttube-backend" | Out-Null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host $TestResult.Output -ForegroundColor Gray

$Status = Invoke-VpsCmd "pm2 status"
Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
Write-Host $Status.Output -ForegroundColor Gray

$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 5 --nostream 2>&1"
if ($ErrorLogs.Output -and $ErrorLogs.Output -notmatch '^\[TAILING\]') {
    Write-Host ""
    Write-Host "Hata loglari:" -ForegroundColor Red
    Write-Host $ErrorLogs.Output -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "OK: Hata loglari temiz!" -ForegroundColor Green
}

$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 3 --nostream 2>&1"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ISLEM TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

