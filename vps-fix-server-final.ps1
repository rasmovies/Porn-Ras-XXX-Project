$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

Import-Module Posh-SSH -Force

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "server.js dosyasi temizlenip yeniden olusturuluyor..." -ForegroundColor Cyan

# Yerel dosyayı oku
$ServerJsContent = Get-Content "server\server.js" -Raw

# Her satırı base64 encode et ve VPS'te birleştir
$Lines = $ServerJsContent -split "`r?`n"
$LineCount = $Lines.Count

Write-Host "Toplam satir: $LineCount" -ForegroundColor Gray

# Dosyayı satır satır yazdır
$CreateCmd = @"
cd $BackendPath
cat > server.js.new << 'ENDOFFILE'
$ServerJsContent
ENDOFFILE
mv server.js.new server.js
chmod 644 server.js
"@

$CreateResult = Invoke-VpsCmd $CreateCmd
Write-Host $CreateResult.Output

Write-Host ""
Write-Host "Dosya dogrulaniyor..." -ForegroundColor Cyan
$Verify = Invoke-VpsCmd "cd $BackendPath && head -5 server.js && echo '---OK---' && wc -l server.js"
Write-Host $Verify.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete adulttube-backend 2>&1" | Out-Null
Start-Sleep -Seconds 2

$StartResult = Invoke-VpsCmd "cd $BackendPath && pm2 start server.js --name adulttube-backend --update-env"
Write-Host $StartResult.Output -ForegroundColor Gray

Start-Sleep -Seconds 5

$Status = Invoke-VpsCmd "pm2 status"
Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
Write-Host $Status.Output -ForegroundColor Gray

$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 5 --nostream 2>&1"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

