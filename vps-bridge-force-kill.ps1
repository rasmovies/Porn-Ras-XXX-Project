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
Write-Host "BRIDGE FORCE KILL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Bridge process PID'lerini buluyorum..." -ForegroundColor Cyan
$ProcessPids = Invoke-VpsCmd "ps aux | grep -E 'protonmail-bridge|proton-bridge|bridge.*--cli' | grep -v grep | awk '{print \$2}'"
Write-Host "PID'ler: $($ProcessPids.Output.Trim())" -ForegroundColor Gray

if ($ProcessPids.Output.Trim()) {
    Write-Host ""
    Write-Host "[2/5] Process'leri PID ile sonlandiriyorum..." -ForegroundColor Cyan
    $Pids = $ProcessPids.Output.Trim() -split '\s+'
    foreach ($Pid in $Pids) {
        if ($Pid -match '^\d+$') {
            $Kill = Invoke-VpsCmd "kill -9 $Pid 2>&1 && echo 'PID $Pid killed' || echo 'PID $Pid failed'"
            Write-Host $Kill.Output -ForegroundColor Gray
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "Process bulunamadi" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/5] Bridge servisini durduruyorum..." -ForegroundColor Cyan
$StopService = Invoke-VpsCmd "sudo systemctl stop protonmail-bridge 2>&1 && sleep 1 && echo 'OK'"
Write-Host $StopService.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/5] Lock file'ları detaylı ariyorum..." -ForegroundColor Cyan
$AllLocks = Invoke-VpsCmd "find /tmp /var/lock /run /root/.config/protonmail -name '*lock*' -o -name '*protonmail*' -o -name '*bridge*' 2>/dev/null | grep -v '.json\|.log\|.db' | head -20"
Write-Host $AllLocks.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/5] Lock file'ları ve socket'leri siliyorum..." -ForegroundColor Cyan
$Cleanup = Invoke-VpsCmd @"
rm -f /tmp/*protonmail*lock* 2>/dev/null
rm -f /tmp/*bridge*lock* 2>/dev/null
rm -f /var/lock/*protonmail* 2>/dev/null
rm -f /run/*protonmail* 2>/dev/null
rm -f ~/.config/protonmail/bridge-v3/*.lock 2>/dev/null
rm -f ~/.local/share/protonmail/bridge-v3/*.lock 2>/dev/null
find /tmp /run -name '*protonmail*.sock' -delete 2>/dev/null
find /tmp /run -name '*bridge*.sock' -delete 2>/dev/null
echo 'Cleanup completed'
"@
Write-Host $Cleanup.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Final process kontrol:" -ForegroundColor Cyan
$Final = Invoke-VpsCmd "ps aux | grep -E 'protonmail|bridge' | grep -v grep || echo 'TUM PROCESS'LER TEMIZ!'"
Write-Host $Final.Output -ForegroundColor $(if ($Final.Output -match 'TEMIZ') { 'Green' } else { 'Red' })

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUÇ:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if ($Final.Output -match 'TEMIZ') {
    Write-Host "OK: Tum Bridge process'leri sonlandirildi ve lock file'lar temizlendi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Simdi VPS'te YENI bir terminal acip Bridge CLI'yi calistirin:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
} else {
    Write-Host "UYARI: Hala process'ler calisiyor!" -ForegroundColor Red
    Write-Host ""
    Write-Host "VPS'te manuel olarak calistirin:" -ForegroundColor Yellow
    Write-Host "  ps aux | grep bridge" -ForegroundColor Gray
    Write-Host "  kill -9 [PID]" -ForegroundColor Gray
    Write-Host "  sudo systemctl stop protonmail-bridge" -ForegroundColor Gray
    Write-Host "  rm -f /tmp/*protonmail* /tmp/*bridge* /var/lock/*protonmail*" -ForegroundColor Gray
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




