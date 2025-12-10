$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE CLI PROCESS TEMIZLEME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[1/4] Calisan Bridge process'leri kontrol:" -ForegroundColor Cyan
$RunningProcesses = Invoke-VpsCmd "ps aux | grep -E 'protonmail-bridge|proton-bridge|bridge' | grep -v grep"
Write-Host $RunningProcesses.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] Bridge CLI process'ini sonlandiriyorum..." -ForegroundColor Cyan
$KillCli = Invoke-VpsCmd "pkill -f 'protonmail-bridge --cli' && sleep 1 && echo 'OK' || echo 'CLI process yok'"
Write-Host $KillCli.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/4] Bridge servisini durduruyorum (eğer calisiyorsa)..." -ForegroundColor Cyan
$StopService = Invoke-VpsCmd "sudo systemctl stop protonmail-bridge 2>&1 && echo 'Service stopped' || echo 'Service zaten durmus'"
Write-Host $StopService.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] Temizlik tamamlandi!" -ForegroundColor Green
Write-Host ""
Write-Host "Simdi VPS'te yeni bir terminal'de Bridge CLI'yi calistirabilirsiniz:" -ForegroundColor White
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host ""
Write-Host "CLI Komutlari:" -ForegroundColor Yellow
Write-Host "  account list              # Mevcut account'lari goster" -ForegroundColor Gray
Write-Host "  account add               # Yeni account ekle" -ForegroundColor Gray
Write-Host "    -> Email: pornras@proton.me" -ForegroundColor White
Write-Host "    -> Password: [Proton Mail hesap sifresi]" -ForegroundColor White
Write-Host "  account password pornras  # SMTP password'unu al" -ForegroundColor Gray
Write-Host "  quit                      # CLI'den cik" -ForegroundColor Gray
Write-Host ""
Write-Host "CLI kullandiktan sonra Bridge servisini yeniden baslat:" -ForegroundColor Yellow
Write-Host "  sudo systemctl start protonmail-bridge" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HAZIR!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan




