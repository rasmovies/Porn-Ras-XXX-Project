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
Write-Host "SIMPLE AUTHENTICATION TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test scripti oluştur
$TestScript = @"
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Username:', JSON.stringify(process.env.PROTON_SMTP_USERNAME));
console.log('Password length:', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.length : 'YOK');
console.log('Password:', JSON.stringify(process.env.PROTON_SMTP_PASSWORD));

const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 1025,
  secure: false,
  auth: {
    user: process.env.PROTON_SMTP_USERNAME,
    pass: process.env.PROTON_SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    requireTLS: true,
  },
  debug: true,
  logger: false,
});

transporter.verify((error, success) => {
  if (error) {
    console.log('ERROR CODE:', error.code);
    console.log('ERROR MESSAGE:', error.message);
    console.log('ERROR RESPONSE:', error.response);
    process.exit(1);
  } else {
    console.log('SUCCESS: SMTP connection verified!');
    process.exit(0);
  }
});
"@

$TestScriptBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($TestScript))

Write-Host "[1/3] Test scripti VPS'e yukleniyor..." -ForegroundColor Cyan
$UploadCmd = "cd $BackendPath && echo '$TestScriptBase64' | base64 -d > test-smtp.js && chmod 644 test-smtp.js"
Invoke-VpsCmd $UploadCmd | Out-Null

Write-Host ""
Write-Host "[2/3] SMTP baglanti testi calistiriliyor..." -ForegroundColor Cyan
$TestResult = Invoke-VpsCmd "cd $BackendPath && timeout 10 node test-smtp.js 2>&1 || echo 'Test timeout'"
Write-Host $TestResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Bridge loglari (son authentication):" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 10 --no-pager | tail -10"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

# Test dosyasını temizle
Invoke-VpsCmd "cd $BackendPath && rm -f test-smtp.js" | Out-Null

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST TAMAMLANDI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

