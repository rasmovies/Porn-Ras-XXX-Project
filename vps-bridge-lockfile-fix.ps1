$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

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
Write-Host "BRIDGE LOCK FILE SORUNU COZUM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Tum Bridge process'leri kontrol:" -ForegroundColor Cyan
$AllProcesses = Invoke-VpsCmd "ps aux | grep -E 'protonmail|bridge|proton-bridge' | grep -v grep || echo 'Process yok'"
Write-Host $AllProcesses.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/6] Tum Bridge process'lerini agresif sonlandiriyorum..." -ForegroundColor Cyan
$KillAll = Invoke-VpsCmd "killall -9 protonmail-bridge 2>/dev/null; killall -9 proton-bridge 2>/dev/null; killall -9 bridge 2>/dev/null; pkill -9 -f protonmail; pkill -9 -f bridge; sleep 2 && echo 'OK'"
Write-Host $KillAll.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/6] Bridge servisini durduruyorum..." -ForegroundColor Cyan
$StopService = Invoke-VpsCmd "sudo systemctl stop protonmail-bridge 2>&1 && sleep 1 && echo 'Service stopped'"
Write-Host $StopService.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/6] Lock file'ları ariyorum..." -ForegroundColor Cyan
$LockFiles = Invoke-VpsCmd "find /tmp /var/lock /run -name '*protonmail*' -o -name '*bridge*' 2>/dev/null | head -20 || echo 'Lock file bulunamadi'"
Write-Host $LockFiles.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/6] Lock file'ları siliyorum..." -ForegroundColor Cyan
$RemoveLocks = Invoke-VpsCmd "find /tmp -name '*protonmail*' -type f -delete 2>/dev/null; find /var/lock -name '*protonmail*' -type f -delete 2>/dev/null; find /run -name '*protonmail*' -type f -delete 2>/dev/null; find /tmp -name '*bridge*' -type f -delete 2>/dev/null 2>&1; echo 'Lock files removed'"
Write-Host $RemoveLocks.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[6/6] Socket dosyalarini kontrol ediyorum..." -ForegroundColor Cyan
$Sockets = Invoke-VpsCmd "find /tmp /run -name '*protonmail*.sock' -o -name '*bridge*.sock' 2>/dev/null | head -10 || echo 'Socket bulunamadi'"
Write-Host $Sockets.Output -ForegroundColor Gray

if ($Sockets.Output -notmatch 'Socket bulunamadi') {
    Write-Host ""
    Write-Host "Socket dosyalarini da siliyorum..." -ForegroundColor Yellow
    $RemoveSockets = Invoke-VpsCmd "find /tmp /run -name '*protonmail*.sock' -delete 2>/dev/null; find /tmp /run -name '*bridge*.sock' -delete 2>/dev/null; echo 'Sockets removed'"
    Write-Host $RemoveSockets.Output -ForegroundColor Gray
}

Write-Host ""
Write-Host "Final kontrol:" -ForegroundColor Cyan
$FinalCheck = Invoke-VpsCmd "ps aux | grep -E 'protonmail|bridge' | grep -v grep || echo 'Tum process'ler temiz!'"
Write-Host $FinalCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "TEMIZLIK TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Simdi VPS'te Bridge CLI'yi calistirabilirsiniz:" -ForegroundColor White
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host ""
Write-Host "Eger hala lock file hatasi alirsaniz:" -ForegroundColor Yellow
Write-Host "  1. VPS'te yeni bir terminal acin" -ForegroundColor Gray
Write-Host "  2. Tum terminal'leri kapatip tekrar acin" -ForegroundColor Gray
Write-Host "  3. Bridge CLI'yi calistirin" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




