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
Write-Host "BRIDGE PROCESS SONLANDIRMA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Calisan Bridge process'leri:" -ForegroundColor Cyan
$Processes = Invoke-VpsCmd "ps aux | grep -E 'protonmail-bridge|proton-bridge|bridge' | grep -v grep"
Write-Host $Processes.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/3] Tum Bridge process'lerini sonlandiriyorum..." -ForegroundColor Cyan
$KillAll = Invoke-VpsCmd "pkill -9 -f 'protonmail-bridge' && pkill -9 -f 'proton-bridge' && pkill -9 -f 'bridge.*--cli' && sleep 2 && echo 'OK' || echo 'Process bulunamadi'"
Write-Host $KillAll.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Kalan process'ler kontrol:" -ForegroundColor Cyan
$Remaining = Invoke-VpsCmd "ps aux | grep -E 'protonmail-bridge|proton-bridge|bridge' | grep -v grep || echo 'Tum Bridge process'leri sonlandirildi!'"
Write-Host $Remaining.Output -ForegroundColor Gray

if ($Remaining.Output -notmatch 'Tum Bridge process') {
    Write-Host ""
    Write-Host "UYARI: Bazi process'ler hala calisiyor!" -ForegroundColor Red
    Write-Host "Manuel olarak sonlandirmak icin:" -ForegroundColor Yellow
    Write-Host "  ps aux | grep bridge" -ForegroundColor Gray
    Write-Host "  kill -9 [PID]" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "OK: Tum Bridge process'leri sonlandirildi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Simdi VPS'te yeni bir terminal'de Bridge CLI'yi calistirabilirsiniz:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
}

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HAZIR!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan




