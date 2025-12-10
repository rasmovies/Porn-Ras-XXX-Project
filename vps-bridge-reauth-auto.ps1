$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS'YE BAGLANILIYOR..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)

try {
    $Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey
    Write-Host "OK: VPS'ye baglanildi!" -ForegroundColor Green
} catch {
    Write-Host "HATA: VPS'ye baglanilamadi!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host ""
Write-Host "[1/6] Bridge servis durumu kontrol:" -ForegroundColor Cyan
$Status = Invoke-VpsCmd "sudo systemctl status protonmail-bridge --no-pager | head -10"
Write-Host $Status.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/6] Bridge CLI account listesi kontrol:" -ForegroundColor Cyan
Write-Host "NOT: Bridge CLI interaktif, manuel komut gerekiyor" -ForegroundColor Yellow
Write-Host "Bridge CLI'yi başlatıp account listesini kontrol ediyorum..." -ForegroundColor Yellow

# Bridge CLI'ye komut göndermek için expect kullanmayı deneyelim
$ExpectScript = @'
#!/usr/bin/expect -f
set timeout 30
spawn protonmail-bridge --cli
expect "proton-bridge>"
send "account list\r"
expect "proton-bridge>"
send "exit\r"
expect eof
'@

$ExpectScriptBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($ExpectScript))
Invoke-VpsCmd "echo '$ExpectScriptBase64' | base64 -d > /tmp/bridge-check.exp && chmod +x /tmp/bridge-check.exp" | Out-Null

$AccountList = Invoke-VpsCmd "expect /tmp/bridge-check.exp 2>&1 | head -20"
Write-Host $AccountList.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/6] Bridge loglari (son account durumu):" -ForegroundColor Cyan
$RecentLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 50 --no-pager | tail -20"
Write-Host $RecentLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/6] Bridge servisini yeniden başlatıyorum..." -ForegroundColor Cyan
$Restart = Invoke-VpsCmd "sudo systemctl restart protonmail-bridge && sleep 3 && echo 'OK'"
Write-Host $Restart.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/6] Bridge account durumu (sync mesajları kontrol):" -ForegroundColor Cyan
Start-Sleep -Seconds 5
$SyncLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 30 --no-pager | grep -i -E 'account|sync|login|added|pornras' | tail -10"
if ($SyncLogs.Output) {
    Write-Host $SyncLogs.Output -ForegroundColor Gray
} else {
    Write-Host "Account sync mesajları bulunamadı" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[6/6] Email test ediliyor..." -ForegroundColor Cyan
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
    Write-Host "Hata devam ediyor. Son hata logları:" -ForegroundColor Red
    $ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 10 --nostream 2>&1 | tail -10"
    Write-Host $ErrorLogs.Output -ForegroundColor Red
}

# Cleanup
Invoke-VpsCmd "rm -f /tmp/bridge-check.exp" | Out-Null

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ISLEM TAMAMLANDI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan




