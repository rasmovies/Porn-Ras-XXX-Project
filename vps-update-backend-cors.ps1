$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKEND CORS AYARLARI GUNCELLENIYOR" -ForegroundColor Cyan
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

Write-Host "[1/3] Mevcut server.js dosyasini yedekliyorum..." -ForegroundColor Cyan
$Backup = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
echo 'Yedek alindi'
"@
Write-Host $Backup.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/3] server.js dosyasini lokal versiyondan guncelliyorum..." -ForegroundColor Cyan
$LocalServerJs = Get-Content -Path "server/server.js" -Raw -Encoding UTF8
$Base64ServerJs = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($LocalServerJs))

$UpdateServer = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
echo '$Base64ServerJs' | base64 -d > server.js.tmp
if [ `$? -eq 0 ]; then
    mv server.js.tmp server.js
    echo 'server.js guncellendi'
    head -35 server.js | grep -A 10 'allowedOrigins'
else
    echo 'HATA: server.js guncellenemedi'
    exit 1
fi
"@

Write-Host $UpdateServer.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/3] Backend'i yeniden baslatiyorum..." -ForegroundColor Cyan
$RestartBackend = Invoke-VpsCmd @"
cd /var/www/adulttube-backend
pm2 restart adulttube-backend
sleep 2
pm2 list | grep adulttube-backend
"@
Write-Host $RestartBackend.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "BASARILI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend CORS ayarlari guncellendi!" -ForegroundColor Green
Write-Host "api.pornras.com artik allowed origins listesinde!" -ForegroundColor Green
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


