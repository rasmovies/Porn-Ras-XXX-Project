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
Write-Host "BRIDGE TEMIZLIK KONTROL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Calisan Bridge process'leri:" -ForegroundColor Cyan
$Processes = Invoke-VpsCmd "ps aux | grep -E 'protonmail-bridge|proton-bridge|bridge' | grep -v grep || echo 'Hic Bridge process yok'"
Write-Host $Processes.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/3] Bridge servis durumu:" -ForegroundColor Cyan
$ServiceStatus = Invoke-VpsCmd "sudo systemctl status protonmail-bridge --no-pager | head -3"
Write-Host $ServiceStatus.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Lock file kontrol:" -ForegroundColor Cyan
$LockFiles = Invoke-VpsCmd "ls -la /tmp/protonmail-bridge* 2>/dev/null || ls -la /var/lock/protonmail-bridge* 2>/dev/null || echo 'Lock file yok'"
Write-Host $LockFiles.Output -ForegroundColor Gray

if ($Processes.Output -match 'protonmail-bridge') {
    Write-Host ""
    Write-Host "UYARI: Hala Bridge process'leri calisiyor!" -ForegroundColor Red
    Write-Host "Bunlari sonlandirmak icin:" -ForegroundColor Yellow
    Write-Host "  pkill -f 'protonmail-bridge'" -ForegroundColor Gray
    Write-Host "  sudo systemctl stop protonmail-bridge" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "OK: Bridge temizlendi!" -ForegroundColor Green
    Write-Host "Simdi VPS'te yeni bir terminal'de calistirabilirsiniz:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
}

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




