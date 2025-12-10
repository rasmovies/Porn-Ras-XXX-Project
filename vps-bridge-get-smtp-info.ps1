$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE SMTP BILGILERINI ALMA" -ForegroundColor Cyan
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

Write-Host "[1/3] Bridge hesap bilgilerini aliyorum..." -ForegroundColor Cyan
Write-Host "NOT: Bridge CLI'de 'info' komutunu kullanacagiz" -ForegroundColor Yellow
Write-Host ""

# Bridge CLI'den hesap bilgilerini al (non-interactive mod)
$InfoCmd = @"
printf 'info\nquit\n' | timeout 30 protonmail-bridge --cli --noninteractive 2>&1 | grep -v 'WARN\|Failed to add\|keychain\|Requested max\|Welcome\|^___\|^__\.\|^_\|^\['\|^!!\|^\^\|^jgs\|^~~' | grep -iE 'SMTP|IMAP|host|port|username|password' | head -30
"@

$InfoResult = Invoke-VpsCmd $InfoCmd
Write-Host "Bridge info ciktisi:" -ForegroundColor Gray
Write-Host $InfoResult.Output -ForegroundColor White
Write-Host ""

Write-Host "[2/3] Bridge'in varsayilan SMTP ayarlarini kontrol ediyorum..." -ForegroundColor Cyan

# Bridge varsayılan ayarları
$SmtpDefaults = @"
# Proton Mail Bridge varsayilan ayarlari:
# SMTP Host: 127.0.0.1 (localhost)
# SMTP Port: 1025 (STARTTLS)
# IMAP Host: 127.0.0.1 (localhost)  
# IMAP Port: 1143 (STARTTLS)
# Username: pornras@proton.me
# Password: Bridge'den alinacak (SMTP sifresi)
"@

Write-Host $SmtpDefaults -ForegroundColor Yellow
Write-Host ""

Write-Host "[3/3] Bridge SMTP sifresini almak icin alternatif yontem..." -ForegroundColor Cyan

# Bridge config dosyasını kontrol et
$ConfigCheck = Invoke-VpsCmd @"
# Bridge config dosyasini bul
find ~/.config/protonmail ~/.local/share/protonmail -name '*.json' -type f 2>/dev/null | head -3

# Bridge log dosyasinda SMTP bilgileri olabilir
ls -la ~/.config/protonmail/bridge-v3/*.log 2>/dev/null | tail -2 || echo 'Log files not found'
"@

Write-Host $ConfigCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SMTP AYARLARI OZET:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "BACKEND .env DOSYASINA EKLENECEK:" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROTON_SMTP_HOST=127.0.0.1" -ForegroundColor Green
Write-Host "PROTON_SMTP_PORT=1025" -ForegroundColor Green
Write-Host "PROTON_SMTP_SECURE=false" -ForegroundColor Green
Write-Host "PROTON_SMTP_USERNAME=pornras@proton.me" -ForegroundColor Green
Write-Host "PROTON_SMTP_PASSWORD=[Bridge'den alinacak]" -ForegroundColor Yellow
Write-Host "PROTON_FROM_EMAIL=pornras@proton.me" -ForegroundColor Green
Write-Host "PROTON_FROM_NAME=PORNRAS" -ForegroundColor Green
Write-Host ""

Write-Host "NOT: SMTP sifresi Bridge CLI'den alinmali:" -ForegroundColor Yellow
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host "  >>> info" -ForegroundColor Gray
Write-Host "  >>> info pornras@proton.me" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



