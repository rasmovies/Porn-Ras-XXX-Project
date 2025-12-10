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
Write-Host "DETAYLI EMAIL SERVIS ANALIZI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/10] Environment Variables Kontrol:" -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCmd "cd $BackendPath && node -e \`
  require('dotenv').config();
  console.log('=== ENV VARIABLES ===');
  console.log('HOST:', JSON.stringify(process.env.PROTON_SMTP_HOST));
  console.log('PORT:', JSON.stringify(process.env.PROTON_SMTP_PORT));
  console.log('SECURE:', JSON.stringify(process.env.PROTON_SMTP_SECURE));
  console.log('USERNAME:', JSON.stringify(process.env.PROTON_SMTP_USERNAME));
  console.log('PASSWORD:', JSON.stringify(process.env.PROTON_SMTP_PASSWORD));
  console.log('PASSWORD LENGTH:', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.length : 0);
  console.log('FROM_EMAIL:', JSON.stringify(process.env.PROTON_FROM_EMAIL));
  console.log('FROM_NAME:', JSON.stringify(process.env.PROTON_FROM_NAME));
\`"
Write-Host $EnvCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/10] emailService.js Transporter Konfigurasyonu:" -ForegroundColor Cyan
$Transporter = Invoke-VpsCmd "cd $BackendPath/services && grep -A 15 'nodemailer.createTransport' emailService.js"
Write-Host $Transporter.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/10] SMTP Baglanti Testi (Telnet ile):" -ForegroundColor Cyan
$TelnetTest = Invoke-VpsCmd "timeout 3 bash -c 'echo -e \"EHLO test\\nQUIT\" | telnet 127.0.0.1 1025' 2>&1 | head -10 || echo 'Telnet test tamamlanamadi'"
Write-Host $TelnetTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/10] Bridge SMTP Loglari (son 50 satir):" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 50 --no-pager | grep -i -E 'smtp|auth|login|username|password|error|incorrect'"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/10] Bridge Account Bilgileri:" -ForegroundColor Cyan
$BridgeAccount = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 200 --no-pager | grep -i -E 'account|pornras|added|sync' | tail -10"
Write-Host $BridgeAccount.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[6/10] Nodemailer Debug Test (manuel):" -ForegroundColor Cyan
$DebugScript = @"
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('=== NODEMAILER DEBUG TEST ===');
console.log('Host:', process.env.PROTON_SMTP_HOST);
console.log('Port:', process.env.PROTON_SMTP_PORT);
console.log('Secure:', process.env.PROTON_SMTP_SECURE);
console.log('Username:', process.env.PROTON_SMTP_USERNAME);
console.log('Password length:', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.length : 0);

const transporter = nodemailer.createTransport({
  host: process.env.PROTON_SMTP_HOST,
  port: parseInt(process.env.PROTON_SMTP_PORT || '1025'),
  secure: process.env.PROTON_SMTP_SECURE === 'true',
  auth: {
    user: process.env.PROTON_SMTP_USERNAME,
    pass: process.env.PROTON_SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    requireTLS: true,
  },
  debug: true,
  logger: true,
});

console.log('\\n=== Testing SMTP Connection ===');
transporter.verify((error, success) => {
  if (error) {
    console.log('\\n❌ ERROR DETAILS:');
    console.log('Code:', error.code);
    console.log('Command:', error.command);
    console.log('Response:', error.response);
    console.log('ResponseCode:', error.responseCode);
    console.log('Message:', error.message);
    if (error.stack) {
      console.log('Stack:', error.stack.split('\\n').slice(0, 5).join('\\n'));
    }
  } else {
    console.log('\\n✅ SUCCESS: Server is ready!');
  }
});
"@

$DebugScriptBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($DebugScript))
$UploadDebug = Invoke-VpsCmd "cd $BackendPath && echo '$DebugScriptBase64' | base64 -d > debug-smtp.js && chmod 644 debug-smtp.js && echo 'OK'"
Write-Host "Debug script yuklendi, calistiriliyor..." -ForegroundColor Gray

$DebugResult = Invoke-VpsCmd "cd $BackendPath && timeout 15 node debug-smtp.js 2>&1 || echo 'Timeout'"
Write-Host $DebugResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[7/10] Email Service DispatchEmail Fonksiyonu:" -ForegroundColor Cyan
$DispatchEmail = Invoke-VpsCmd "cd $BackendPath/services && grep -A 30 'async function dispatchEmail' emailService.js | head -35"
Write-Host $DispatchEmail.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[8/10] Son Email Hatasinin Tam Detaylari:" -ForegroundColor Red
$FullError = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 30 --nostream 2>&1 | tail -30"
Write-Host $FullError.Output -ForegroundColor Red

Write-Host ""
Write-Host "[9/10] Bridge SMTP Capabilities (EHLO):" -ForegroundColor Cyan
$Capabilities = Invoke-VpsCmd "timeout 5 bash -c 'echo -e \"EHLO localhost\\nAUTH PLAIN $(echo -ne \"\\0pornras@proton.me\\0MoQL_M-Loyi1fB3b9tKWew\" | base64 -w 0)\\nQUIT\" | nc 127.0.0.1 1025' 2>&1 || echo 'Test tamamlanamadi'"
Write-Host $Capabilities.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[10/10] Nodemailer Versiyonu:" -ForegroundColor Cyan
$NodemailerVersion = Invoke-VpsCmd "cd $BackendPath && node -e \"console.log(require('nodemailer/package.json').version)\""
Write-Host "Nodemailer: $($NodemailerVersion.Output.Trim())" -ForegroundColor Gray

# Cleanup
Invoke-VpsCmd "cd $BackendPath && rm -f debug-smtp.js" | Out-Null

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ANALIZ TAMAMLANDI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

