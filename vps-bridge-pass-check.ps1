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
Write-Host "BRIDGE PASS PASSWORD MANAGER KONTROL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] pass password store kontrol:" -ForegroundColor Cyan
$PassStore = Invoke-VpsCmd "pass ls 2>&1"
Write-Host $PassStore.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/3] Bridge password'larını kontrol:" -ForegroundColor Cyan
$BridgePasswords = Invoke-VpsCmd "pass ls | grep -i bridge || pass ls | grep -i proton || echo 'Bridge password bulunamadı'"
Write-Host $BridgePasswords.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] pass store dizin kontrol:" -ForegroundColor Cyan
$PassDir = Invoke-VpsCmd "ls -la ~/.password-store/ 2>/dev/null | head -20 || echo 'Pass store dizini bulunamadı'"
Write-Host $PassDir.Output -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "SONUÇ:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Bridge config dosyasında account bilgisi yok." -ForegroundColor Red
Write-Host "Loglarda account sync veya added mesajı yok." -ForegroundColor Red
Write-Host ""
Write-Host "Bridge account'una MANUEL olarak login olmak gerekiyor!" -ForegroundColor Green
Write-Host ""
Write-Host "VPS'te şu komutları çalıştırın:" -ForegroundColor White
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host "  account list" -ForegroundColor Gray
Write-Host "  account add" -ForegroundColor Gray
Write-Host "  (email: pornras@proton.me)" -ForegroundColor Gray
Write-Host "  (Proton Mail account password: [gizli])" -ForegroundColor Gray
Write-Host ""
Write-Host "Account eklendikten sonra SMTP password'u alın:" -ForegroundColor White
Write-Host "  account password pornras" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




