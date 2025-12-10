$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE CLI MANUEL KONTROL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[1/4] Bridge CLI komutlarını hazırlıyorum..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Bridge CLI'ye komut göndermek için echo kullanıyorum..." -ForegroundColor Yellow

# Bridge CLI komutlarını dosyaya yaz ve pipe ile gönder
$BridgeCommands = @'
account list
account password pornras
quit
'@

$CommandsBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($BridgeCommands))
Invoke-VpsCmd "echo '$CommandsBase64' | base64 -d > /tmp/bridge-cmds.txt" | Out-Null

Write-Host ""
Write-Host "[2/4] Bridge CLI account listesi kontrol:" -ForegroundColor Cyan
Write-Host "NOT: Bridge CLI interaktif, manuel komut çalıştırılıyor..." -ForegroundColor Yellow

# Bridge CLI'yi başlat ve komutları gönder
$AccountList = Invoke-VpsCmd "timeout 30 bash -c 'echo \"account list\" | protonmail-bridge --cli 2>&1 | head -30'"
Write-Host $AccountList.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/4] Bridge password kontrol:" -ForegroundColor Cyan
$PasswordCheck = Invoke-VpsCmd "timeout 30 bash -c 'echo -e \"account password pornras\\nquit\" | protonmail-bridge --cli 2>&1 | head -50'"
Write-Host $PasswordCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] Bridge config dosyasından account bilgileri:" -ForegroundColor Cyan
$ConfigContent = Invoke-VpsCmd "sudo cat ~/.config/protonmail/bridge-v3/keychain.json 2>/dev/null | python3 -m json.tool 2>/dev/null | grep -A 5 -B 5 'pornras\|account' | head -30 || cat ~/.config/protonmail/bridge-v3/keychain.json 2>/dev/null | head -50"
Write-Host $ConfigContent.Output -ForegroundColor Gray

# Cleanup
Invoke-VpsCmd "rm -f /tmp/bridge-cmds.txt" | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BILGI:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Bridge CLI interaktif olduğu için otomatik çalıştırmak zor." -ForegroundColor Gray
Write-Host "VPS'te manuel olarak şu komutları çalıştırmanız gerekebilir:" -ForegroundColor Gray
Write-Host "  protonmail-bridge --cli" -ForegroundColor White
Write-Host "  account list" -ForegroundColor White
Write-Host "  account password pornras" -ForegroundColor White
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




