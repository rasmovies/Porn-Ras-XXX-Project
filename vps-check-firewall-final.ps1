$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Red
Write-Host "SORUN TESPITI: PORT 443 DISARIDAN ERISILEMIYOR" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
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
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 120
        return $Result
    } catch {
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

Write-Host "[1/3] VPS icinde port 443 durumu..." -ForegroundColor Cyan
$Port443 = Invoke-VpsCmd "ss -tlnp | grep :443"
Write-Host $Port443.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/3] iptables kurallari (port 443)..." -ForegroundColor Cyan
$IPTables = Invoke-VpsCmd "iptables -L -n -v | grep -E '(443|ACCEPT|REJECT)' | head -10 || echo 'iptables kurali yok'"
Write-Host $IPTables.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/3] VPS provider bilgisi..." -ForegroundColor Cyan
$ProviderInfo = Invoke-VpsCmd "hostnamectl | grep -E '(Operating System|Kernel)' || echo 'Provider bilgisi alinamadi'"
Write-Host $ProviderInfo.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "COZUM ADIMLARI:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "SORUN: VPS provider firewall port 443'u engelliyor!" -ForegroundColor Red
Write-Host ""
Write-Host "1. VPS PROVIDER PANELINE GIRIN:" -ForegroundColor Cyan
Write-Host "   - DigitalOcean: Droplets -> Networking -> Firewalls" -ForegroundColor White
Write-Host "   - AWS: EC2 -> Security Groups -> Inbound Rules" -ForegroundColor White
Write-Host "   - Linode: Networking -> Firewalls" -ForegroundColor White
Write-Host "   - Vultr: Firewall -> Add Rule" -ForegroundColor White
Write-Host ""
Write-Host "2. PORT 443 (HTTPS) VE 80 (HTTP) ACIN:" -ForegroundColor Cyan
Write-Host "   - Type: HTTPS (443) veya Custom (443)" -ForegroundColor White
Write-Host "   - Protocol: TCP" -ForegroundColor White
Write-Host "   - Source: 0.0.0.0/0 (her yerden)" -ForegroundColor White
Write-Host "   - Ayni sekilde port 80 icin de ekleyin" -ForegroundColor White
Write-Host ""
Write-Host "3. ALTERNATIF COZUM (Gecici):" -ForegroundColor Cyan
Write-Host "   Backend'i port 5000'de HTTP olarak bırakıp," -ForegroundColor White
Write-Host "   Vercel'de REACT_APP_API_BASE_URL = http://72.61.139.145:5000" -ForegroundColor White
Write-Host "   (Ama bu Mixed Content hatasına yol açar)" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. EN IYI COZUM:" -ForegroundColor Green
Write-Host "   - api.pornras.com subdomain'i oluştur" -ForegroundColor White
Write-Host "   - Let's Encrypt SSL sertifikası kur" -ForegroundColor White
Write-Host "   - Vercel'de REACT_APP_API_BASE_URL = https://api.pornras.com" -ForegroundColor White
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


