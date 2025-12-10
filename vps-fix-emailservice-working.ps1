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

Write-Host "[1/4] Yerel emailService.js okunuyor..." -ForegroundColor Cyan
$LocalFile = Join-Path (Get-Location) "server\services\emailService.js"
$FileContent = Get-Content $LocalFile -Raw -Encoding UTF8

Write-Host "Dosya boyutu: $($FileContent.Length) karakter" -ForegroundColor Gray

# TLS kontrolü
if ($FileContent -like '*tls*rejectUnauthorized*false*') {
    Write-Host "OK: Yerel dosyada TLS konfigurasyonu var" -ForegroundColor Green
} else {
    Write-Host "UYARI: TLS konfigurasyonu bulunamadi, ekleniyor..." -ForegroundColor Yellow
    
    # TLS ekle
    $FileContent = $FileContent -replace '(auth:.*undefined,)(\s*\}\);)', "`$1,`n    tls: {`n      rejectUnauthorized: false,`n    },`$2"
    
    $FileContent | Set-Content $LocalFile -Encoding UTF8 -NoNewline
    Write-Host "OK: TLS eklendi" -ForegroundColor Green
}

Write-Host "[2/4] Dosya Base64'e cevriliyor..." -ForegroundColor Cyan
$FileBytes = [System.Text.Encoding]::UTF8.GetBytes($FileContent)
$Base64Content = [Convert]::ToBase64String($FileBytes)

Write-Host "[3/4] Dosya VPS'e yukleniyor..." -ForegroundColor Cyan
$UploadCmd = "cd $BackendPath/services && cp emailService.js emailService.js.backup4 && echo '$Base64Content' | base64 -d > emailService.js && chmod 644 emailService.js && echo 'OK'"

$UploadResult = Invoke-VpsCmd $UploadCmd
Write-Host $UploadResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Dosya dogrulaniyor..." -ForegroundColor Cyan
$Verify = Invoke-VpsCmd "cd $BackendPath/services && grep -A 12 'nodemailer.createTransport' emailService.js | head -15"
Write-Host $Verify.Output -ForegroundColor Gray

$TlsCheck = Invoke-VpsCmd "cd $BackendPath/services && grep -i 'rejectUnauthorized' emailService.js"
if ($TlsCheck.Output) {
    Write-Host ""
    Write-Host "OK: TLS konfigurasyonu bulundu!" -ForegroundColor Green
    Write-Host $TlsCheck.Output -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "HATA: TLS konfigurasyonu hala yok!" -ForegroundColor Red
}

Write-Host ""
Write-Host "[4/4] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete all 2>&1; sleep 2; pm2 kill 2>&1; sleep 1" | Out-Null
Start-Sleep -Seconds 2

Invoke-VpsCmd "cd $BackendPath && pm2 start server.js --name adulttube-backend" | Out-Null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host "Sonuc: $($TestResult.Output)" -ForegroundColor Gray

$Status = Invoke-VpsCmd "pm2 status"
Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
Write-Host $Status.Output -ForegroundColor Gray

$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 3 --nostream 2>&1 | tail -3"
if ($ErrorLogs.Output -and $ErrorLogs.Output -notmatch '^\[TAILING\]') {
    Write-Host ""
    Write-Host "Hata loglari:" -ForegroundColor Red
    Write-Host $ErrorLogs.Output -ForegroundColor Red
}

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ISLEM TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

