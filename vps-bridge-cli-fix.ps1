$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE CLI LOCK FILE SORUNU COZUM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SORUN: Bridge zaten systemd service olarak calisiyor" -ForegroundColor Yellow
Write-Host "Cozum: Bridge servisini durdur, CLI'yi calistir, sonra servisi yeniden baslat" -ForegroundColor Green
Write-Host ""

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[1/5] Bridge servis durumu kontrol:" -ForegroundColor Cyan
$Status = Invoke-VpsCmd "sudo systemctl status protonmail-bridge --no-pager | head -5"
Write-Host $Status.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/5] Bridge servisini durduruyorum..." -ForegroundColor Cyan
$Stop = Invoke-VpsCmd "sudo systemctl stop protonmail-bridge && sleep 2 && echo 'OK'"
Write-Host $Stop.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/5] Bridge process kontrol:" -ForegroundColor Cyan
$ProcessCheck = Invoke-VpsCmd "ps aux | grep protonmail-bridge | grep -v grep || echo 'Bridge process yok'"
Write-Host $ProcessCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/5] Bridge CLI hazir!" -ForegroundColor Green
Write-Host "Simdi VPS'te terminal'de su komutu calistirabilirsiniz:" -ForegroundColor White
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host ""
Write-Host "CLI kullanimi:" -ForegroundColor Yellow
Write-Host "  account list              # Account listesi" -ForegroundColor Gray
Write-Host "  account add               # Yeni account ekle" -ForegroundColor Gray
Write-Host "  account password pornras  # SMTP password al" -ForegroundColor Gray
Write-Host "  quit                      # CLI'den cik" -ForegroundColor Gray
Write-Host ""
Write-Host "[5/5] Bridge CLI'yi kullandiktan sonra servisi yeniden baslatmak icin:" -ForegroundColor Cyan
Write-Host "  sudo systemctl start protonmail-bridge" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NOT: Bridge servisi durduruldu" -ForegroundColor Yellow
Write-Host "CLI kullandiktan sonra servisi yeniden baslatmayi unutmayin!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan




