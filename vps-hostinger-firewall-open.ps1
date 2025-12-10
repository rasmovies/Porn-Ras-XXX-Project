$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HOSTINGER VPS FIREWALL - PORT 443 ACILIYOR" -ForegroundColor Cyan
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

Write-Host "[1/5] Mevcut firewall durumu..." -ForegroundColor Cyan
$FirewallStatus = Invoke-VpsCmd "ufw status verbose 2>&1"
Write-Host $FirewallStatus.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/5] iptables durumu..." -ForegroundColor Cyan
$IPTables = Invoke-VpsCmd "iptables -L -n -v | head -20"
Write-Host $IPTables.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/5] UFW firewall aktifse, port 443 ve 80'i aciyorum..." -ForegroundColor Cyan
$OpenUFW = Invoke-VpsCmd @"
if command -v ufw >/dev/null 2>&1; then
    # UFW varsa portları aç
    ufw allow 443/tcp comment 'HTTPS backend'
    ufw allow 80/tcp comment 'HTTP redirect'
    ufw allow 5000/tcp comment 'Backend direct'
    ufw reload
    echo "UFW portları açıldı"
    ufw status | grep -E '(443|80|5000)'
else
    echo "UFW kurulu değil"
fi
"@
Write-Host $OpenUFW.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/5] iptables ile port 443 ve 80'i aciyorum..." -ForegroundColor Cyan
$OpenIPTables = Invoke-VpsCmd @"
# iptables kurallarını kontrol et ve ekle
iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>&1
iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>&1
iptables -I INPUT -p tcp --dport 5000 -j ACCEPT 2>&1

# Kuralları kaydet (iptables-persistent varsa)
if command -v iptables-save >/dev/null 2>&1; then
    if command -v netfilter-persistent >/dev/null 2>&1; then
        netfilter-persistent save 2>&1 || echo "netfilter-persistent kaydedilemedi"
    else
        iptables-save > /etc/iptables/rules.v4 2>&1 || echo "iptables kuralları kaydedilemedi"
    fi
fi

echo "iptables kuralları eklendi"
iptables -L INPUT -n -v | grep -E '(443|80|5000)' || echo "Kural bulunamadı"
"@
Write-Host $OpenIPTables.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[5/5] Port durumunu kontrol ediyorum..." -ForegroundColor Cyan
$PortCheck = Invoke-VpsCmd "ss -tlnp | grep -E ':(443|80|5000)'"
Write-Host $PortCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "HOSTINGER PANEL ADIMLARI:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Eger VPS panelinden firewall acmaniz gerekiyorsa:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Hostinger hPanel'e giris yapin:" -ForegroundColor White
Write-Host "   https://hpanel.hostinger.com" -ForegroundColor Gray
Write-Host ""
Write-Host "2. VPS yonetimine gidin:" -ForegroundColor White
Write-Host "   - Hosting -> VPS" -ForegroundColor Gray
Write-Host "   - Veya dogrudan VPS Control Panel linkine tiklayin" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Firewall ayarlarini bulun:" -ForegroundColor White
Write-Host "   - VPS Control Panel -> Firewall / Security" -ForegroundColor Gray
Write-Host "   - Veya Advanced -> Firewall Settings" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Port kurallari ekleyin:" -ForegroundColor White
Write-Host "   - Add Rule / Yeni Kural" -ForegroundColor Gray
Write-Host "   - Port: 443, Protocol: TCP, Action: Allow" -ForegroundColor Gray
Write-Host "   - Port: 80, Protocol: TCP, Action: Allow" -ForegroundColor Gray
Write-Host "   - Source: 0.0.0.0/0 (her yerden)" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Kurallari kaydedin ve uygulayin" -ForegroundColor White
Write-Host ""
Write-Host "ALTERNATIF: Hostinger paneli yoksa yukaridaki iptables/UFW kurallari yeterli olabilir" -ForegroundColor Yellow
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


