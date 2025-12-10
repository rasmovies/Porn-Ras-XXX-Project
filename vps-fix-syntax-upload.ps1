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

Write-Host "[1/3] Yerel emailService.js okunuyor..." -ForegroundColor Cyan
$FileContent = Get-Content $LocalFile -Raw -Encoding UTF8

# Syntax kontrolü
if ($FileContent -match 'tls:.*\{.*\}') {
    Write-Host "OK: TLS konfigurasyonu var" -ForegroundColor Green
    
    # Çift virgül kontrolü
    if ($FileContent -match ',\s*,') {
        Write-Host "UYARI: Cift virgul bulundu, duzeltiliyor..." -ForegroundColor Yellow
        $FileContent = $FileContent -replace ',\s*,', ','
        $FileContent | Set-Content $LocalFile -Encoding UTF8 -NoNewline
        Write-Host "OK: Syntax duzeltildi" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[2/3] Dosya VPS'e yukleniyor..." -ForegroundColor Cyan
$FileBytes = [System.Text.Encoding]::UTF8.GetBytes($FileContent)
$Base64Content = [Convert]::ToBase64String($FileBytes)

$UploadCmd = "cd $BackendPath/services && cp emailService.js emailService.js.backup7 && echo '$Base64Content' | base64 -d > emailService.js && chmod 644 emailService.js && echo 'OK'"
$UploadResult = Invoke-VpsCmd $UploadCmd
Write-Host $UploadResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Transporter konfigurasyonu:" -ForegroundColor Cyan
$ConfigCheck = Invoke-VpsCmd "cd $BackendPath/services && grep -A 15 'nodemailer.createTransport' emailService.js | head -18"
Write-Host $ConfigCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete all 2>&1; sleep 2; pm2 kill 2>&1; sleep 1" | Out-Null
Start-Sleep -Seconds 3

Invoke-VpsCmd "cd $BackendPath && pm2 start server.js --name adulttube-backend" | Out-Null
Start-Sleep -Seconds 5

$Status = Invoke-VpsCmd "pm2 status"
Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
Write-Host $Status.Output -ForegroundColor Gray

# Syntax hatası kontrolü
$SyntaxCheck = Invoke-VpsCmd "cd $BackendPath/services && node -c emailService.js 2>&1"
if ($SyntaxCheck.ExitStatus -eq 0) {
    Write-Host ""
    Write-Host "OK: Syntax dogru!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "HATA: Syntax hatasi var!" -ForegroundColor Red
    Write-Host $SyntaxCheck.Output -ForegroundColor Red
    Remove-SSHSession -SessionId $Session.SessionId | Out-Null
    exit 1
}

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
    Write-Host "Hata loglari:" -ForegroundColor Red
    $ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 10 --nostream 2>&1 | tail -10"
    Write-Host $ErrorLogs.Output -ForegroundColor Red
}

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

