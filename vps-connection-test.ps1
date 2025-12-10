# VPS Bağlantı Test Scripti
# Bu script VPS'e bağlanabilirliğini test eder

param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,
    
    [Parameter(Mandatory=$false)]
    [string]$VpsUser = "root",
    
    [Parameter(Mandatory=$false)]
    [int]$SshPort = 22
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS Bağlantı Test Aracı" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ping testi
Write-Host "1. Ping testi yapılıyor..." -ForegroundColor Cyan
$PingResult = Test-Connection -ComputerName $VpsIp -Count 2 -Quiet -ErrorAction SilentlyContinue
if ($PingResult) {
    Write-Host "   ✅ VPS ping'e cevap veriyor" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  VPS ping'e cevap vermiyor (ICMP kapalı olabilir, normal)" -ForegroundColor Yellow
}

# 2. Port testi
Write-Host ""
Write-Host "2. SSH Port ($SshPort) testi yapılıyor..." -ForegroundColor Cyan
$PortTest = Test-NetConnection -ComputerName $VpsIp -Port $SshPort -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if ($PortTest.TcpTestSucceeded) {
    Write-Host "   ✅ Port $SshPort açık ve erişilebilir" -ForegroundColor Green
} else {
    Write-Host "   ❌ Port $SshPort kapalı veya erişilemiyor!" -ForegroundColor Red
    Write-Host "   Bu sorunu çözmeden devam edemezsiniz." -ForegroundColor Yellow
    exit 1
}

# 3. Posh-SSH modülü kontrolü
Write-Host ""
Write-Host "3. Posh-SSH modülü kontrol ediliyor..." -ForegroundColor Cyan
if (Get-Module -ListAvailable -Name Posh-SSH) {
    Write-Host "   ✅ Posh-SSH modülü yüklü" -ForegroundColor Green
    Import-Module Posh-SSH -Force
} else {
    Write-Host "   ⚠️  Posh-SSH modülü bulunamadı, yükleniyor..." -ForegroundColor Yellow
    try {
        Install-Module -Name Posh-SSH -Scope CurrentUser -Force -AllowClobber -SkipPublisherCheck
        Import-Module Posh-SSH -Force
        Write-Host "   ✅ Posh-SSH modülü yüklendi" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Posh-SSH modülü yüklenemedi: $_" -ForegroundColor Red
        exit 1
    }
}

# 4. SSH bağlantı testi
Write-Host ""
Write-Host "4. SSH bağlantısı test ediliyor..." -ForegroundColor Cyan
$VpsPassword = Read-Host "VPS şifresini girin" -AsSecureString

$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($VpsPassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

try {
    $SecurePasswordObj = ConvertTo-SecureString $PlainPassword -AsPlainText -Force
    $Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePasswordObj)
    
    Write-Host "   Bağlantı kuruluyor..." -ForegroundColor Gray
    $Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey -ErrorAction Stop
    
    if ($Session) {
        Write-Host "   ✅ SSH bağlantısı başarılı!" -ForegroundColor Green
        Write-Host "   Session ID: $($Session.SessionId)" -ForegroundColor Gray
        
        # Basit komut testi
        Write-Host ""
        Write-Host "5. Uzak komut testi yapılıyor..." -ForegroundColor Cyan
        $TestResult = Invoke-SSHCommand -SessionId $Session.SessionId -Command "uname -a"
        if ($TestResult.ExitStatus -eq 0) {
            Write-Host "   ✅ Komut başarıyla çalıştı" -ForegroundColor Green
            Write-Host "   Sistem: $($TestResult.Output)" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  Komut hatası: $($TestResult.Error)" -ForegroundColor Yellow
        }
        
        # Bağlantıyı kapat
        Remove-SSHSession -SessionId $Session.SessionId | Out-Null
        Write-Host ""
        Write-Host "✅ Tüm testler başarılı! VPS'e bağlanabilirsiniz." -ForegroundColor Green
    } else {
        throw "Bağlantı oluşturulamadı"
    }
} catch {
    Write-Host "   ❌ SSH bağlantısı başarısız!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Çözüm önerileri:" -ForegroundColor Cyan
    Write-Host "   1. VPS IP adresini kontrol edin: $VpsIp" -ForegroundColor Gray
    Write-Host "   2. Kullanıcı adını kontrol edin: $VpsUser" -ForegroundColor Gray
    Write-Host "   3. Şifrenin doğru olduğundan emin olun" -ForegroundColor Gray
    Write-Host "   4. VPS'te SSH servisi çalışıyor mu kontrol edin:" -ForegroundColor Gray
    Write-Host "      ssh $VpsUser@$VpsIp 'sudo systemctl status sshd'" -ForegroundColor DarkGray
    Write-Host "   5. SSH key authentication gerekli olabilir" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Tamamlandı" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

