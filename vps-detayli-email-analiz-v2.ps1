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

Write-Host "[1/8] Environment Variables Kontrol:" -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCmd "cd $BackendPath; node -e `"require('dotenv').config(); console.log('HOST:', JSON.stringify(process.env.PROTON_SMTP_HOST)); console.log('PORT:', JSON.stringify(process.env.PROTON_SMTP_PORT)); console.log('SECURE:', JSON.stringify(process.env.PROTON_SMTP_SECURE)); console.log('USERNAME:', JSON.stringify(process.env.PROTON_SMTP_USERNAME)); console.log('PASSWORD LENGTH:', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.length : 0); console.log('FROM_EMAIL:', JSON.stringify(process.env.PROTON_FROM_EMAIL));`""
Write-Host $EnvCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/8] emailService.js Transporter Konfigurasyonu:" -ForegroundColor Cyan
$Transporter = Invoke-VpsCmd "cd $BackendPath/services; grep -A 15 'nodemailer.createTransport' emailService.js"
Write-Host $Transporter.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/8] SMTP Baglanti Testi:" -ForegroundColor Cyan
$TelnetTest = Invoke-VpsCmd "timeout 3 bash -c 'echo -e \"EHLO test\\nQUIT\" | telnet 127.0.0.1 1025' 2>&1 | head -10"
Write-Host $TelnetTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/8] Bridge SMTP Loglari (son authentication denemeleri):" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 100 --no-pager | grep -i -E 'smtp|auth|login|username|password|error|incorrect|454' | tail -20"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/8] Nodemailer Debug Test (manuel):" -ForegroundColor Cyan
$DebugScript = @"
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('=== NODEMAILER DEBUG TEST ===');
console.log('Host:', process.env.PROTON_SMTP_HOST);
console.log('Port:', process.env.PROTON_SMTP_PORT);
console.log('Secure:', process.env.PROTON_SMTP_SECURE);
console.log('Username:', process.env.PROTON_SMTP_USERNAME);
console.log('Password length:', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.length : 0);
console.log('Password first 5:', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.substring(0, 5) : 'YOK');
console.log('Password last 5:', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.substring(process.env.PROTON_SMTP_PASSWORD.length - 5) : 'YOK');

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
      console.log('Stack (first 3 lines):');
      console.log(error.stack.split('\\n').slice(0, 3).join('\\n'));
    }
    process.exit(1);
  } else {
    console.log('\\n✅ SUCCESS: Server is ready!');
    process.exit(0);
  }
});
"@

$DebugScriptBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($DebugScript))
Invoke-VpsCmd "cd $BackendPath; echo '$DebugScriptBase64' | base64 -d > debug-smtp.js; chmod 644 debug-smtp.js" | Out-Null

Write-Host "Debug script yuklendi, calistiriliyor..." -ForegroundColor Gray
$DebugResult = Invoke-VpsCmd "cd $BackendPath; timeout 15 node debug-smtp.js 2>&1"
Write-Host $DebugResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[6/8] Son Email Hatasinin Tam Detaylari:" -ForegroundColor Red
$FullError = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 40 --nostream 2>&1 | tail -40"
Write-Host $FullError.Output -ForegroundColor Red

Write-Host ""
Write-Host "[7/8] Bridge SMTP Server Capabilities (EHLO):" -ForegroundColor Cyan
$Capabilities = Invoke-VpsCmd "timeout 5 bash -c 'echo -e \"EHLO localhost\\nQUIT\" | nc 127.0.0.1 1025' 2>&1"
Write-Host $Capabilities.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[8/8] Nodemailer ve Node.js Versiyonlari:" -ForegroundColor Cyan
$Versions = Invoke-VpsCmd "cd $BackendPath; echo 'Node.js:'; node --version; echo 'Nodemailer:'; node -e 'console.log(require(\"nodemailer/package.json\").version)'"
Write-Host $Versions.Output -ForegroundColor Gray

# Cleanup
Invoke-VpsCmd "cd $BackendPath; rm -f debug-smtp.js" | Out-Null

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ANALIZ TAMAMLANDI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

