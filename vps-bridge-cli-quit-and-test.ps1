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
Write-Host "BRIDGE CLI KAPAT VE TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ONEMLI: Bridge CLI'yi kapatmaniz gerekiyor!" -ForegroundColor Yellow
Write-Host "VPS'te Bridge CLI'de 'quit' komutunu calistirin" -ForegroundColor Yellow
Write-Host ""
Write-Host "[1/4] Bridge CLI process'leri kontrol:" -ForegroundColor Cyan
$Processes = Invoke-VpsCmd "ps aux | grep -E 'protonmail-bridge.*--cli|bridge.*--cli' | grep -v grep || echo 'Bridge CLI calismiyor'"
Write-Host $Processes.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] Tum Bridge process'lerini sonlandiriyorum..." -ForegroundColor Cyan
$KillAll = Invoke-VpsCmd "pkill -9 -f 'bridge.*--cli'; pkill -9 protonmail-bridge; sleep 2 && echo 'OK'"
Write-Host $KillAll.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/4] Bridge servisini baslatip bekle..." -ForegroundColor Cyan
Invoke-VpsCmd "sudo systemctl stop protonmail-bridge 2>&1" | Out-Null
Start-Sleep -Seconds 2
Invoke-VpsCmd "sudo systemctl start protonmail-bridge 2>&1" | Out-Null
Write-Host "Bridge servisi baslatildi, 10 saniye bekleniyor..." -ForegroundColor Gray
Start-Sleep -Seconds 10

$BridgeStatus = Invoke-VpsCmd "sudo systemctl status protonmail-bridge --no-pager | head -5"
Write-Host $BridgeStatus.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] Email test ediliyor..." -ForegroundColor Cyan
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
    Write-Host "Hata devam ediyor..." -ForegroundColor Red
    Write-Host "Account zaten var ama authentication sorunu var." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Olası sorunlar:" -ForegroundColor Yellow
    Write-Host "1. Password degismis olabilir" -ForegroundColor Gray
    Write-Host "2. Account SMTP icin düzgün configure edilmemis olabilir" -ForegroundColor Gray
    Write-Host "3. Bridge'e yeniden login olmak gerekebilir" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "YAPILMASI GEREKENLER:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "1. VPS'te Bridge CLI'de 'quit' komutunu calistirin" -ForegroundColor White
Write-Host "2. Bridge servisi otomatik baslatilacak" -ForegroundColor White
Write-Host "3. Email test edilecek" -ForegroundColor White
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




