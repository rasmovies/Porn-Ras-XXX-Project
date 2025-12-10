$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE HESAPLARI LISTELEME" -ForegroundColor Cyan
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

Write-Host "[1/2] Hesaplari listeliyorum (non-interactive mod)..." -ForegroundColor Cyan
Write-Host ""

# Non-interactive mod ile hesapları listele
$AccountsCmd = "protonmail-bridge --cli --noninteractive accounts list 2>&1 | grep -v 'WARN\\|Failed to add\\|keychain\\|Requested max\\|Welcome\\|^___\\|^__\\.\\|^_\\|^\\['\\|^!!\\|^\\^\\|^jgs\\|^~~' | head -50"
$AccountsResult = Invoke-VpsCmd $AccountsCmd

Write-Host "HESAPLAR:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray
Write-Host $AccountsResult.Output -ForegroundColor White
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""

Write-Host "[2/2] Hesap bilgilerini cekiyorum..." -ForegroundColor Cyan
Write-Host ""

# Eğer pornras hesabı varsa, detaylarını al
if ($AccountsResult.Output -match "pornras") {
    Write-Host "pornras@proton.me hesabi bulundu!" -ForegroundColor Green
    Write-Host ""
    Write-Host "SMTP bilgilerini aliyorum..." -ForegroundColor Cyan
    
    $InfoCmd = "protonmail-bridge --cli --noninteractive accounts info pornras@proton.me 2>&1 | grep -v 'WARN\\|Failed to add\\|keychain\\|Requested max\\|Welcome\\|^___\\|^__\\.\\|^_\\|^\\['\\|^!!\\|^\\^\\|^jgs\\|^~~' | head -50"
    $InfoResult = Invoke-VpsCmd $InfoCmd
    
    Write-Host "HESAP BILGILERI:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Gray
    Write-Host $InfoResult.Output -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Gray
} else {
    Write-Host "pornras hesabi gorunmuyor veya format farkli." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Interaktif modda kontrol edin:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
    Write-Host "  >>> accounts" -ForegroundColor Gray
    Write-Host "  >>> list" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if ($AccountsResult.Output -match "pornras|@proton") {
    Write-Host "Hesaplar basariyla listelendi!" -ForegroundColor Green
} else {
    Write-Host "Hesap listesi alinamadi veya format farkli." -ForegroundColor Yellow
    Write-Host "VPS'te manuel kontrol yapin:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli --noninteractive accounts list" -ForegroundColor Gray
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



