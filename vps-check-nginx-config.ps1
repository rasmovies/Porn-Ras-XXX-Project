# Nginx Config Kontrolu
$vpsIP = "72.61.139.145"
$vpsUser = "root"
$vpsPassword = "Oyunbozan1907+"

if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Install-PackageProvider -Name NuGet -Force -Scope CurrentUser | Out-Null
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser -AllowClobber
}

try {
    $securePassword = ConvertTo-SecureString $vpsPassword -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($vpsUser, $securePassword)
    $session = New-SSHSession -ComputerName $vpsIP -Credential $credential -AcceptKey
    
    if ($session) {
        Write-Host "Mevcut Nginx config:" -ForegroundColor Cyan
        $config = Invoke-SSHCommand -SessionId $session.SessionId -Command "cat /etc/nginx/sites-available/default"
        Write-Host $config.Output
        
        Write-Host "`nNginx sites-enabled linkleri:" -ForegroundColor Cyan
        $links = Invoke-SSHCommand -SessionId $session.SessionId -Command "ls -la /etc/nginx/sites-enabled/"
        Write-Host $links.Output
        
        Write-Host "`nNginx error log (son 10 satir):" -ForegroundColor Cyan
        $errors = Invoke-SSHCommand -SessionId $session.SessionId -Command "tail -10 /var/log/nginx/error.log"
        Write-Host $errors.Output
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


