$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE HESAP KONTROLÜ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)

try {
    $Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey -ConnectionTimeout 30
    Write-Host "✅ SSH bağlantısı kuruldu!" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH bağlantısı kurulamadı: $_" -ForegroundColor Red
    exit 1
}

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[1/3] Bridge hesaplarını kontrol ediyorum..." -ForegroundColor Cyan
$AccountsResult = Invoke-VpsCmd "protonmail-bridge --cli accounts list 2>&1"
Write-Host "Çıktı:" -ForegroundColor Gray
Write-Host $AccountsResult.Output -ForegroundColor White
Write-Host ""

Write-Host "[2/3] Bridge bilgilerini kontrol ediyorum..." -ForegroundColor Cyan
$InfoResult = Invoke-VpsCmd "protonmail-bridge --cli info 2>&1 | head -20"
Write-Host "Çıktı:" -ForegroundColor Gray
Write-Host $InfoResult.Output -ForegroundColor White
Write-Host ""

Write-Host "[3/3] SMTP/IMAP bilgilerini kontrol ediyorum..." -ForegroundColor Cyan
$SmtpInfo = Invoke-VpsCmd "protonmail-bridge --cli accounts info 2>&1 || protonmail-bridge --cli --help 2>&1 | grep -i smtp"
Write-Host "Çıktı:" -ForegroundColor Gray
Write-Host $SmtpInfo.Output -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUÇ:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if ($AccountsResult.Output -match "No accounts|no accounts") {
    Write-Host "⚠️  Henüz hesap eklenmemiş!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Hesap eklemek için şu komutu kullanın:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli login" -ForegroundColor Gray
} elseif ($AccountsResult.Output -match "pornras@proton.me|pornras") {
    Write-Host "✅ pornras@proton.me hesabı bulundu!" -ForegroundColor Green
    Write-Host ""
    Write-Host "SMTP bilgilerini almak için:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli accounts info [account-email]" -ForegroundColor Gray
} else {
    Write-Host "Hesap durumu kontrol edildi" -ForegroundColor Cyan
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

