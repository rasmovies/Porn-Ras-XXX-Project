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

Write-Host "[1/3] Base64 encode karsilastirmasi:" -ForegroundColor Cyan

$TestScript = @'
const username = 'pornras@proton.me';
const password = 'MoQL_M-Loyi1fB3b9tKWew';
const authString = '\0' + username + '\0' + password;
const base64 = Buffer.from(authString, 'utf8').toString('base64');
console.log('Username:', username);
console.log('Password:', password);
console.log('Generated base64:', base64);
console.log('Debug log base64:', 'AHBvcm5yYXNAcHJvdG9uLm1lAC8qIHNlY3JldCAqLw==');
console.log('Match:', base64 === 'AHBvcm5yYXNAcHJvdG9uLm1lAC8qIHNlY3JldCAqLw==' ? 'YES (WRONG!)' : 'NO (CORRECT - real password is sent)');
'@

$TestScriptBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($TestScript))
Invoke-VpsCmd "cd $BackendPath; echo '$TestScriptBase64' | base64 -d > test-base64.js" | Out-Null

$Result = Invoke-VpsCmd "cd $BackendPath; node test-base64.js"
Write-Host $Result.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/3] Bridge authentication loglari:" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 15 --no-pager | grep -i 'incorrect\|454\|auth' | tail -5"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Analiz sonucu:" -ForegroundColor Cyan
Write-Host "Eger base64'ler eslesmiyorsa, Nodemailer gercek password'u gonderiyor demektir." -ForegroundColor Yellow
Write-Host "Ama authentication yine de basarisiz oluyorsa, sorun password'da degil baska bir yerde." -ForegroundColor Yellow

Invoke-VpsCmd "cd $BackendPath; rm -f test-base64.js" | Out-Null

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

