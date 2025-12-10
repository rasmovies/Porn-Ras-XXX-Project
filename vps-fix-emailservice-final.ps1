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
$LocalFile = "server\services\emailService.js"
$FileContent = Get-Content $LocalFile -Raw -Encoding UTF8

# Dosya içeriğini kontrol et
if ($FileContent -notmatch 'tls.*rejectUnauthorized.*false') {
    Write-Host "HATA: Yerel dosyada TLS konfigurasyonu yok!" -ForegroundColor Red
    Write-Host "Dosya guncelleniyor..." -ForegroundColor Yellow
    
    # TLS konfigurasyonunu ekle
    $FileContent = $FileContent -replace '(auth:.*\? \{ user:.*pass:.*\}.*: undefined,)\s*(\});)', "`$1,`n    tls: {`n      rejectUnauthorized: false, // Proton Mail Bridge self-signed certificate`n    },`n  `$2"
    
    # Dosyayı kaydet
    $FileContent | Set-Content $LocalFile -Encoding UTF8 -NoNewline
    Write-Host "OK: Yerel dosya guncellendi" -ForegroundColor Green
}

Write-Host "[2/4] Dosya VPS'e yukleniyor (heredoc ile)..." -ForegroundColor Cyan

# Dosyayı base64'e çevir
$FileBytes = [System.Text.Encoding]::UTF8.GetBytes($FileContent)
$Base64Content = [Convert]::ToBase64String($FileBytes)

$UploadCmd = @"
cd $BackendPath/services
cp emailService.js emailService.js.backup2
echo '$Base64Content' | base64 -d > emailService.js.new
mv emailService.js.new emailService.js
chmod 644 emailService.js
"@

$UploadResult = Invoke-VpsCmd $UploadCmd
Write-Host $UploadResult.Output

Write-Host ""
Write-Host "[3/4] Dosya dogrulaniyor..." -ForegroundColor Cyan
$Verify = Invoke-VpsCmd "cd $BackendPath/services && grep -A 8 'nodemailer.createTransport' emailService.js | head -10"
Write-Host $Verify.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete all && pm2 kill" | Out-Null
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

$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 5 --nostream 2>&1"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 3 --nostream 2>&1"
if ($ErrorLogs.Output -notmatch '^\s*$') {
    Write-Host ""
    Write-Host "Hata loglari:" -ForegroundColor Red
    Write-Host $ErrorLogs.Output -ForegroundColor Red
}

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "EMAILSERVICE.JS GUNCELLENDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

