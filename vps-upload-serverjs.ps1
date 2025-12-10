$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKEND SERVER.JS GUNCELLENIYOR" -ForegroundColor Cyan
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

Write-Host "[1/3] Mevcut server.js yedekleniyor..." -ForegroundColor Cyan
$Backup = Invoke-VpsCmd "cd /var/www/adulttube-backend/server && cp server.js server.js.backup.$(date +%s) && echo 'Yedek alindi'"
Write-Host $Backup.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/3] server.js dosyasi VPS'e yukleniyor..." -ForegroundColor Cyan
$LocalFile = "server/server.js"
if (Test-Path $LocalFile) {
    $Content = Get-Content -Path $LocalFile -Raw -Encoding UTF8
    $Base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Content))
    
    $Upload = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
echo '$Base64' | base64 -d > server.js.new
if [ -s server.js.new ]; then
    mv server.js.new server.js
    echo 'server.js guncellendi'
    echo '---'
    grep -A 10 'allowedOrigins' server.js | head -12
else
    echo 'HATA: server.js guncellenemedi'
    exit 1
fi
"@
    Write-Host $Upload.Output -ForegroundColor Gray
    Write-Host ""
    
    if ($Upload.Output -match "guncellendi") {
        Write-Host "[3/3] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
        $Restart = Invoke-VpsCmd "pm2 restart adulttube-backend && sleep 2 && pm2 list | grep adulttube-backend"
        Write-Host $Restart.Output -ForegroundColor Gray
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "BASARILI!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Backend CORS ayarlari guncellendi!" -ForegroundColor Green
    } else {
        Write-Host "HATA: server.js guncellenemedi!" -ForegroundColor Red
    }
} else {
    Write-Host "HATA: server/server.js dosyasi bulunamadi!" -ForegroundColor Red
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null
