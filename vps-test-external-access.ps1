$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DISARIDAN ERISIM TESTI" -ForegroundColor Cyan
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
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 120
        return $Result
    } catch {
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

Write-Host "[1/4] VPS provider firewall kontrolu..." -ForegroundColor Cyan
Write-Host "NOT: VPS provider (DigitalOcean, AWS, vb.) firewall ayarlari kontrol edilmeli" -ForegroundColor Yellow
Write-Host ""

Write-Host "[2/4] UFW firewall durumu..." -ForegroundColor Cyan
$UFW = Invoke-VpsCmd "ufw status verbose 2>&1"
Write-Host $UFW.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/4] Port 443 acik mi? (UFW ile)..." -ForegroundColor Cyan
$UFW443 = Invoke-VpsCmd "ufw status | grep 443 || echo 'UFW kapali veya 443 kurali yok'"
Write-Host $UFW443.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/4] Port 443'u acmak icin UFW kurali ekliyorum..." -ForegroundColor Cyan
$OpenPort443 = Invoke-VpsCmd @"
# UFW aktifse port 443'u ac
if ufw status | grep -q "Status: active"; then
    echo "UFW aktif, port 443 aciliyor..."
    ufw allow 443/tcp
    ufw allow 80/tcp
    ufw reload
    echo "Port 443 acildi"
else
    echo "UFW kapali, manuel firewall kontrolu gerekli"
fi

# Test: dışarıdan erişim
echo "---"
echo "Disaridan test:"
curl -k -s -m 5 https://72.61.139.145/health 2>&1 | head -3
"@
Write-Host $OpenPort443.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "ONEMLI NOTLAR:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. VPS PROVIDER FIREWALL:" -ForegroundColor Cyan
Write-Host "   - DigitalOcean: Networking -> Firewalls" -ForegroundColor Gray
Write-Host "   - AWS: Security Groups -> Inbound Rules" -ForegroundColor Gray
Write-Host "   - Port 443 (HTTPS) ve 80 (HTTP) acik olmali" -ForegroundColor Gray
Write-Host ""
Write-Host "2. VERCEL ENVIRONMENT VARIABLE:" -ForegroundColor Cyan
Write-Host "   REACT_APP_API_BASE_URL = https://72.61.139.145" -ForegroundColor White
Write-Host "   (http:// degil, https:// olmali!)" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. TARAYICI TEST:" -ForegroundColor Cyan
Write-Host "   https://72.61.139.145/health" -ForegroundColor White
Write-Host "   (Self-signed cert uyarisi normal, 'Advanced -> Proceed' secin)" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


