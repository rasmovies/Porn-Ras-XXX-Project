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
Write-Host "BRIDGE YENIDEN AUTHENTICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOT: Loglarda account sync veya added mesajlari yok" -ForegroundColor Yellow
Write-Host "Bu, Bridge account'una düzgün login olunmadığı anlamına gelebilir" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/4] Bridge servis durumu:" -ForegroundColor Cyan
$Status = Invoke-VpsCmd "sudo systemctl status protonmail-bridge --no-pager | head -5"
Write-Host $Status.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] Bridge loglari (account bilgileri arama):" -ForegroundColor Cyan
$AccountLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge --since '1 hour ago' --no-pager | grep -i -E 'account.*added|account.*pornras|sync.*start|login.*success' | tail -10"
if ($AccountLogs.Output) {
    Write-Host $AccountLogs.Output -ForegroundColor Gray
} else {
    Write-Host "Account bilgileri bulunamadi - bu, account'un düzgün login olmadığı anlamına gelebilir" -ForegroundColor Red
}

Write-Host ""
Write-Host "[3/4] Bridge config dosyalari kontrol:" -ForegroundColor Cyan
$ConfigExists = Invoke-VpsCmd "test -f ~/.config/protonmail/bridge-v3/keychain.json && echo 'EXISTS' || echo 'NOT FOUND'"
Write-Host "Config file: $($ConfigExists.Output.Trim())" -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] COZUM ONERILERI:" -ForegroundColor Yellow
Write-Host ""
Write-Host "SEÇENEK 1: Bridge'e CLI üzerinden yeniden login ol" -ForegroundColor Green
Write-Host "VPS'te terminal'de calistir:" -ForegroundColor Gray
Write-Host "  protonmail-bridge --cli" -ForegroundColor White
Write-Host "  account list" -ForegroundColor White
Write-Host "  account password pornras" -ForegroundColor White
Write-Host ""
Write-Host "SEÇENEK 2: Bridge account'unu yeniden ekle" -ForegroundColor Green
Write-Host "VPS'te terminal'de calistir:" -ForegroundColor Gray
Write-Host "  protonmail-bridge --cli" -ForegroundColor White
Write-Host "  account delete pornras" -ForegroundColor White
Write-Host "  account add" -ForegroundColor White
Write-Host "  (email: pornras@proton.me, password: [Proton Mail account password])" -ForegroundColor White
Write-Host ""
Write-Host "SEÇENEK 3: Bridge servisini yeniden başlat ve account durumunu kontrol et" -ForegroundColor Green
Write-Host "VPS'te terminal'de calistir:" -ForegroundColor Gray
Write-Host "  sudo systemctl restart protonmail-bridge" -ForegroundColor White
Write-Host "  sudo journalctl -u protonmail-bridge -f" -ForegroundColor White
Write-Host "  (account sync mesajlarını bekle)" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUÇ:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Username ve Password dogru ama Bridge account'una düzgün login olunmamis olabilir" -ForegroundColor Yellow
Write-Host "Bridge'e yeniden login olmak veya account'u yeniden eklemek gerekebilir" -ForegroundColor Yellow

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




