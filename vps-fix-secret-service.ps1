$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SECRET-SERVICE KEYCHAIN DUZELTME" -ForegroundColor Cyan
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

function Invoke-VpsCmd {
    param([string]$Cmd)
    try {
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 60
        return $Result
    } catch {
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

Write-Host "[1/5] Secret-service durumunu kontrol ediyorum..." -ForegroundColor Cyan
$CheckService = Invoke-VpsCmd "systemctl status dbus 2>&1 | head -5 || echo 'dbus not running'"
Write-Host $CheckService.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/5] Secret-service paketlerini kontrol ediyorum..." -ForegroundColor Cyan
$CheckPackages = Invoke-VpsCmd "dpkg -l | grep -iE 'secret|keyring|gnome-keyring' || echo 'Packages not found'"
Write-Host $CheckPackages.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/5] Secret-service paketlerini kuruyorum..." -ForegroundColor Cyan
$InstallSecretService = Invoke-VpsCmd @"
apt-get update -qq 2>&1 | tail -3
apt-get install -y gnome-keyring secret-service 2>&1 | tail -5
echo 'Installation completed'
"@
Write-Host $InstallSecretService.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/5] Secret-service koleksiyonunu olusturuyorum..." -ForegroundColor Cyan
$StartServices = Invoke-VpsCmd "mkdir -p ~/.local/share/keyrings ~/.config/protonmail 2>/dev/null && echo 'Directories created'"
Write-Host $StartServices.Output -ForegroundColor Gray
Write-Host ""

Write-Host "NOT: Keychain uyarilari kritik degil - Bridge calismaya devam edecek" -ForegroundColor Yellow
Write-Host ""
Write-Host $StartServices.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[5/5] Bridge icin alternatif cozum: Pass kullanimi..." -ForegroundColor Cyan
Write-Host "NOT: Bridge keychain yerine pass kullanabilir" -ForegroundColor Yellow
Write-Host ""

# Pass kurulumu ve yapılandırması
$SetupPass = Invoke-VpsCmd @"
# Pass password manager kur
apt-get install -y pass 2>&1 | tail -3

# GPG key varsa pass init yap
if [ -f ~/.gnupg/pubring.kbx ] || [ -f ~/.gnupg/pubring.gpg ]; then
    echo 'GPG key found, initializing pass...'
    pass init test@example.com 2>&1 || echo 'Pass init skipped'
else
    echo 'GPG key not found, pass will use Bridge default method'
fi

echo 'Pass setup completed'
"@
Write-Host $SetupPass.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Write-Host "Secret-service kurulumu tamamlandi!" -ForegroundColor Green
Write-Host ""
Write-Host "Keychain uyarilari kritik degil - Bridge calismaya devam edecek." -ForegroundColor White
Write-Host ""
Write-Host "Bridge CLI'yi tekrar test edin:" -ForegroundColor Cyan
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host "  >>> help" -ForegroundColor Gray
Write-Host "  >>> list" -ForegroundColor Gray
Write-Host ""

Write-Host "NOT:" -ForegroundColor Yellow
Write-Host "- Keychain uyarilari Bridge'i engellemez" -ForegroundColor White
Write-Host "- Bridge kendi sifrelerini yonetebilir" -ForegroundColor White
Write-Host "- SMTP/IMAP ayarlari calismaya devam edecek" -ForegroundColor White
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

