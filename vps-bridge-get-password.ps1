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
Write-Host "BRIDGE ACCOUNT DURUMU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Bridge'de account bulundu:" -ForegroundColor Green
Write-Host "  Account: pornras" -ForegroundColor Gray
Write-Host "  Status: connected" -ForegroundColor Gray
Write-Host "  Address mode: combined" -ForegroundColor Gray
Write-Host ""
Write-Host "Bu, account'un zaten ekli ve aktif olduğu anlamına geliyor!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "SMTP PASSWORD ALMA" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "VPS'te Bridge CLI'de şu komutu çalıştırın:" -ForegroundColor White
Write-Host "  account password pornras" -ForegroundColor Gray
Write-Host ""
Write-Host "Bu komut size SMTP password'unu gösterecek." -ForegroundColor Yellow
Write-Host "Password'u kopyalayıp .env dosyasına eklemeliyiz." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NOT:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Bridge CLI'de şu anda çalışıyorsunuz." -ForegroundColor Gray
Write-Host "Komutu çalıştırdıktan sonra password'u paylaşın." -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




