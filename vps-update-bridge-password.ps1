$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"
$NewBridgePassword = "Oyunbozan*fb35*1907"

Import-Module Posh-SSH -Force

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[1/4] .env dosyasinda password guncelleniyor..." -ForegroundColor Cyan

# Password'ü escape et (özel karakterler için)
$EscapedPassword = $NewBridgePassword -replace '\*', '\*' -replace '\$', '\$' -replace '`', '\`'

# .env dosyasını güncelle
$UpdateCmd = "cd $BackendPath && sed -i 's|^PROTON_SMTP_PASSWORD=.*|PROTON_SMTP_PASSWORD=$EscapedPassword|' .env && echo 'OK: Password guncellendi'"

$UpdateResult = Invoke-VpsCmd $UpdateCmd
Write-Host $UpdateResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] Guncel .env dosyasi kontrol:" -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCmd "cd $BackendPath && cat .env | grep PROTON_SMTP"
Write-Host $EnvCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/4] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 restart adulttube-backend --update-env" | Out-Null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[4/4] Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host "Sonuc: $($TestResult.Output)" -ForegroundColor Gray

$Status = Invoke-VpsCmd "pm2 status"
Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
Write-Host $Status.Output -ForegroundColor Gray

# Error logları kontrol et
$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 5 --nostream 2>&1 | tail -5"
if ($ErrorLogs.Output -and $ErrorLogs.Output -notmatch '^\[TAILING\]') {
    Write-Host ""
    Write-Host "Error loglari:" -ForegroundColor Red
    Write-Host $ErrorLogs.Output -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "OK: Hata yok!" -ForegroundColor Green
}

# Success logları kontrol et
$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 5 --nostream 2>&1 | tail -5"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "BRIDGE PASSWORD GUNCELLENDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

