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
Write-Host "PASSWORD AUTHENTICATION FIX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SORUN:" -ForegroundColor Red
Write-Host "Nodemailer debug mode'da password'u '/* secret */' olarak gosteriyor" -ForegroundColor Yellow
Write-Host "Bu gerçek password'un gönderilmediği anlamına gelebilir" -ForegroundColor Yellow
Write-Host ""

# Yerel emailService.js'yi oku
Write-Host "[1/5] Yerel emailService.js okunuyor..." -ForegroundColor Cyan
$LocalFile = "server\services\emailService.js"
$FileContent = Get-Content $LocalFile -Raw -Encoding UTF8

# Syntax hatası kontrolü ve düzeltme
if ($FileContent -match '},\s*,') {
    Write-Host "Syntax hatasi bulundu (cift virgul), duzeltiliyor..." -ForegroundColor Yellow
    $FileContent = $FileContent -replace '},\s*,', '},'
}

# Debug mode'u kapat (password masking'i engellemek için)
if ($FileContent -match 'debug:\s*true|logger:\s*true') {
    Write-Host "Debug mode bulundu, kapatiliyor..." -ForegroundColor Yellow
    $FileContent = $FileContent -replace 'debug:\s*true', 'debug: false'
    $FileContent = $FileContent -replace 'logger:\s*true', 'logger: false'
} else {
    Write-Host "Debug mode zaten kapali veya yok" -ForegroundColor Gray
}

# Password'un doğrudan gönderildiğinden emin ol
# authMethod ekle (PLAIN için)
if ($FileContent -notmatch 'authMethod') {
    Write-Host "authMethod ekleniyor (PLAIN)..." -ForegroundColor Yellow
    # transporter.createTransport içine authMethod ekle
    $FileContent = $FileContent -replace '(auth:.*?\{[^}]*user:[^,]+,pass:[^}]+\})', '$1, authMethod: ''plain'''
}

# Güncellenmiş dosyayı kaydet
$FileContent | Set-Content $LocalFile -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "[2/5] Guncellenmis dosya VPS'e yukleniyor..." -ForegroundColor Cyan
$FileBytes = [System.Text.Encoding]::UTF8.GetBytes($FileContent)
$Base64Content = [Convert]::ToBase64String($FileBytes)

$UploadCmd = "cd $BackendPath/services && cp emailService.js emailService.js.backup8 && echo '$Base64Content' | base64 -d > emailService.js && chmod 644 emailService.js && echo 'OK'"
$UploadResult = Invoke-VpsCmd $UploadCmd
Write-Host $UploadResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/5] Syntax kontrolu..." -ForegroundColor Cyan
$SyntaxCheck = Invoke-VpsCmd "cd $BackendPath/services && node -c emailService.js 2>&1"
if ($SyntaxCheck.ExitStatus -eq 0) {
    Write-Host "OK: Syntax dogru!" -ForegroundColor Green
} else {
    Write-Host "HATA: Syntax hatasi var!" -ForegroundColor Red
    Write-Host $SyntaxCheck.Output -ForegroundColor Red
    Remove-SSHSession -SessionId $Session.SessionId | Out-Null
    exit 1
}

Write-Host ""
Write-Host "[4/5] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 restart adulttube-backend --update-env" | Out-Null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[5/5] Email test ediliyor..." -ForegroundColor Cyan
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
    Write-Host "Hata devam ediyor, son loglar:" -ForegroundColor Red
    $ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 10 --nostream 2>&1 | tail -10"
    Write-Host $ErrorLogs.Output -ForegroundColor Red
}

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

