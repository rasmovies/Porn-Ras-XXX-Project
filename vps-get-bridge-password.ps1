$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

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
Write-Host "BRIDGE PASSWORD BILGILERI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ONEMLI: Proton Mail Bridge'de iki farkli password var:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. PROTON MAIL ACCOUNT PASSWORD (email giris sifresi)" -ForegroundColor White
Write-Host "   - Web arayuzune veya mobil uygulamaya giris icin kullanilir" -ForegroundColor Gray
Write-Host "   - Ornek: 'Oyunbozan*fb35*1907' gibi hesap sifresi" -ForegroundColor Gray
Write-Host ""
Write-Host "2. BRIDGE SMTP/IMAP PASSWORD (Bridge tarafindan uretilen ozel sifre)" -ForegroundColor White
Write-Host "   - SMTP/IMAP baglantisi icin Bridge'in urettigi ozel sifre" -ForegroundColor Gray
Write-Host "   - Bu sifre Bridge GUI'den veya CLI'den alinir" -ForegroundColor Gray
Write-Host "   - Ornek: 'MoQL_M-Loyi1fB3b9tKWew' gibi rastgele karakter dizisi" -ForegroundColor Gray
Write-Host ""
Write-Host "SMTP ICIN BRIDGE'IN URETTIGI OZEL PASSWORD KULLANILMALI!" -ForegroundColor Green
Write-Host ""

Write-Host "[1/4] Mevcut .env dosyasindaki password:" -ForegroundColor Cyan
$EnvPwd = Invoke-VpsCmd "cd $BackendPath && cat .env | grep PROTON_SMTP_PASSWORD"
Write-Host $EnvPwd.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] Bridge GUI'den password almak:" -ForegroundColor Cyan
Write-Host "VPS'te Bridge GUI aciksa:" -ForegroundColor Yellow
Write-Host "  1. Bridge GUI'yi acin" -ForegroundColor Gray
Write-Host "  2. Settings > Advanced > Bridge > SMTP bolumune gidin" -ForegroundColor Gray
Write-Host "  3. SMTP Password'u gosterin ve kopyalayin" -ForegroundColor Gray
Write-Host ""

Write-Host "[3/4] Bridge CLI'den password almak:" -ForegroundColor Cyan
Write-Host "VPS'te terminal'de calistirin:" -ForegroundColor Yellow
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host "  account list" -ForegroundColor Gray
Write-Host "  account password pornras" -ForegroundColor Gray
Write-Host ""

Write-Host "[4/4] Bridge account durumu kontrol:" -ForegroundColor Cyan
$AccountCheck = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 200 --no-pager | grep -i -E 'account.*pornras|pornras.*added|sync.*pornras' | tail -10"
if ($AccountCheck.Output) {
    Write-Host $AccountCheck.Output -ForegroundColor Gray
} else {
    Write-Host "Account durumu loglarda bulunamadi" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "SORUN:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Mevcut password: MoQL_M-Loyi1fB3b9tKWew" -ForegroundColor Gray
Write-Host "Bu password Bridge'den alinmis ama hala authentication hatasi var." -ForegroundColor Red
Write-Host ""
Write-Host "Olası nedenler:" -ForegroundColor Yellow
Write-Host "1. Bridge password degismis olabilir (Bridge yeniden baslatildiginda)" -ForegroundColor Gray
Write-Host "2. Bridge account durumu sorunlu olabilir" -ForegroundColor Gray
Write-Host "3. Bridge'e yeniden login olmak gerekiyor olabilir" -ForegroundColor Gray
Write-Host ""
Write-Host "COZUM:" -ForegroundColor Green
Write-Host "Bridge GUI'den veya CLI'den GUNCEL SMTP password'u tekrar alin!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Yellow

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

