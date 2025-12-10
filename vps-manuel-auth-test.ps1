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

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MANUEL AUTH PLAIN TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOT: Debug log'da gorulen base64 decode edildiginde:" -ForegroundColor Yellow
Write-Host "AHBvcm5yYXNAcHJvdG9uLm1lAC8qIHNlY3JldCAqLw==" -ForegroundColor Gray
Write-Host "-> pornras@proton.me/* secret */" -ForegroundColor Gray
Write-Host ""
Write-Host "Bu Nodemailer'in password masking'i. Gercek password gonderiliyor mu test edelim." -ForegroundColor Yellow
Write-Host ""

# Base64 test
Write-Host "[1/4] Gercek password ile base64 encode test:" -ForegroundColor Cyan
$TestScript = @"
const username = 'pornras@proton.me';
const password = 'MoQL_M-Loyi1fB3b9tKWew';

// AUTH PLAIN format: null+username+null+password
const authString = '\0' + username + '\0' + password;
const base64 = Buffer.from(authString, 'utf8').toString('base64');

console.log('Username:', username);
console.log('Password:', password);
console.log('AUTH PLAIN string (hex):', Buffer.from(authString).toString('hex'));
console.log('AUTH PLAIN base64:', base64);
console.log('');
console.log('Debug log base64:', 'AHBvcm5yYXNAcHJvdG9uLm1lAC8qIHNlY3JldCAqLw==');
console.log('Fark:', base64 === 'AHBvcm5yYXNAcHJvdG9uLm1lAC8qIHNlY3JldCAqLw==' ? 'Ayni (yanlis!)' : 'Farkli (dogru)');
"@

$TestScriptBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($TestScript))
Invoke-VpsCmd "cd $BackendPath; echo '$TestScriptBase64' | base64 -d > test-auth-base64.js; chmod 644 test-auth-base64.js" | Out-Null

$Base64Test = Invoke-VpsCmd "cd $BackendPath; node test-auth-base64.js"
Write-Host $Base64Test.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] Manuel AUTH PLAIN testi (openssl ile):" -ForegroundColor Cyan
Write-Host "NOT: Bu test direkt SMTP server'a baglanip AUTH PLAIN yapmayi test eder" -ForegroundColor Yellow
$AuthTest = Invoke-VpsCmd "timeout 10 bash -c 'echo -e \"EHLO localhost\\nAUTH PLAIN $(echo -ne \"\\0pornras@proton.me\\0MoQL_M-Loyi1fB3b9tKWew\" | base64)\\nQUIT\" | openssl s_client -connect 127.0.0.1:1025 -starttls smtp -quiet 2>&1' || echo 'Test tamamlanamadi'"
Write-Host $AuthTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/4] Bridge loglari (son authentication denemeleri):" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 20 --no-pager | grep -i -E 'smtp|auth|login|454|incorrect' | tail -10"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] Password karakter analizi:" -ForegroundColor Cyan
$PasswordAnalysis = Invoke-VpsCmd "cd $BackendPath; node -e \`
  const pwd = 'MoQL_M-Loyi1fB3b9tKWew';
  console.log('Password:', pwd);
  console.log('Length:', pwd.length);
  console.log('Has underscore:', pwd.includes('_'));
  console.log('Has dash:', pwd.includes('-'));
  console.log('Special chars:', pwd.match(/[^a-zA-Z0-9]/g));
  console.log('UTF-8 bytes:', Buffer.from(pwd).toString('hex'));
\`"
Write-Host $PasswordAnalysis.Output -ForegroundColor Gray

# Cleanup
Invoke-VpsCmd "cd $BackendPath; rm -f test-auth-base64.js" | Out-Null

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST TAMAMLANDI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

