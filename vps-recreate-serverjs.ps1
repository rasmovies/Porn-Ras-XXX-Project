$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

Import-Module Posh-SSH -Force

Write-Host "[1/4] VPS'e baglaniyor..." -ForegroundColor Cyan
$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[2/4] Eski server.js dosyasi yedekleniyor..." -ForegroundColor Cyan
Invoke-VpsCmd "cd $BackendPath && cp server.js server.js.old.backup 2>&1 || echo 'backup olusturulamadi'" | Out-Null

Write-Host "[3/4] Yeni server.js dosyasi olusturuluyor..." -ForegroundColor Cyan
$ServerJsContent = Get-Content "server\server.js" -Raw -Encoding UTF8
$ServerJsBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($ServerJsContent))

$CreateCmd = @"
cd $BackendPath
rm -f server.js
echo '$ServerJsBase64' | base64 -d > server.js
chmod 644 server.js
cat server.js | head -10
"@

$CreateResult = Invoke-VpsCmd $CreateCmd
Write-Host $CreateResult.Output -ForegroundColor Gray

Write-Host "[4/4] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete adulttube-backend 2>&1" | Out-Null
Start-Sleep -Seconds 2

$StartResult = Invoke-VpsCmd "cd $BackendPath && pm2 start server.js --name adulttube-backend --update-env"
Write-Host $StartResult.Output -ForegroundColor Gray

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Loglar kontrol ediliyor..." -ForegroundColor Cyan
$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 10 --nostream 2>&1"
Write-Host $Logs.Output -ForegroundColor Gray

$Status = Invoke-VpsCmd "pm2 status"
Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
Write-Host $Status.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

