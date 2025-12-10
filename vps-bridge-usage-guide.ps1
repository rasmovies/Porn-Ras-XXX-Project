$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE CLI DOGRU KULLANIM KILAVUZU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)

try {
    $Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey -ConnectionTimeout 30
    Write-Host "SSH baglantisi kuruldu!" -ForegroundColor Green
} catch {
    Write-Host "SSH baglantisi kurulamadi: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "ONEMLI: YANLIS KULLANIM vs DOGRU KULLANIM" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "YANLIS:" -ForegroundColor Red
Write-Host "  >>> protonmail-bridge --cli accounts list" -ForegroundColor Red
Write-Host "  >>> protonmail-bridge --cli info" -ForegroundColor Red
Write-Host "  >>> protonmail-bridge --cli accounts info [email]" -ForegroundColor Red
Write-Host ""
Write-Host "DOGRU:" -ForegroundColor Green
Write-Host "  $ protonmail-bridge --cli" -ForegroundColor White
Write-Host "  >>> help" -ForegroundColor Green
Write-Host "  >>> list" -ForegroundColor Green
Write-Host "  >>> info" -ForegroundColor Green
Write-Host "  >>> accounts" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ORNEK KULLANIM ADIMLARI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Bridge CLI'yi baslat:" -ForegroundColor White
Write-Host "   $ protonmail-bridge --cli" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Help komutunu calistir:" -ForegroundColor White
Write-Host "   >>> help" -ForegroundColor Green
Write-Host ""
Write-Host "3. Hesaplari listele:" -ForegroundColor White
Write-Host "   >>> list" -ForegroundColor Green
Write-Host ""
Write-Host "4. Hesap bilgilerini goster:" -ForegroundColor White
Write-Host "   >>> info" -ForegroundColor Green
Write-Host "   veya:" -ForegroundColor Gray
Write-Host "   >>> info pornras@proton.me" -ForegroundColor Green
Write-Host ""
Write-Host "5. Accounts komutlarini kullan:" -ForegroundColor White
Write-Host "   >>> accounts" -ForegroundColor Green
Write-Host "   sonra alt menuden:" -ForegroundColor Gray
Write-Host "   list       - hesaplari listele" -ForegroundColor Gray
Write-Host "   info [id]  - hesap bilgisi goster" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Cikis:" -ForegroundColor White
Write-Host "   >>> quit" -ForegroundColor Green
Write-Host "   veya: Ctrl+C" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NOTLAR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "- >>> prompt'unda sadece komut adini yazin" -ForegroundColor White
Write-Host "- protonmail-bridge --cli sadece BASLATMAK icin kullanilir" -ForegroundColor White
Write-Host "- Interaktif modda komutlarin onune 'protonmail-bridge --cli' YAZMAYIN" -ForegroundColor Red
Write-Host "- Keychain uyarilari kritik degil - Bridge calismaya devam eder" -ForegroundColor Yellow
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host "========================================" -ForegroundColor Green
Write-Host "ARTIK VPS'TE DOGRU SEKILDE KULLANABILIRSINIZ!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""



