# Nginx Config Tam Kontrol
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
        Write-Host "Nginx Config Tam Kontrol..." -ForegroundColor Cyan
        
        # Tüm config'i oku
        Write-Host "`nTum config:" -ForegroundColor Yellow
        $fullConfig = Invoke-SSHCommand -SessionId $session.SessionId -Command "cat /etc/nginx/sites-available/api.pornras.com"
        Write-Host $fullConfig.Output
        
        # OPTIONS if bloğunu ara
        Write-Host "`nOPTIONS if blogu:" -ForegroundColor Yellow
        $optionsBlock = Invoke-SSHCommand -SessionId $session.SessionId -Command "grep -A 10 'if (\$request_method' /etc/nginx/sites-available/api.pornras.com"
        Write-Host $optionsBlock.Output
        
        # add_header satirlarini ara
        Write-Host "`nadd_header satirlari:" -ForegroundColor Yellow
        $addHeaders = Invoke-SSHCommand -SessionId $session.SessionId -Command "grep 'add_header' /etc/nginx/sites-available/api.pornras.com"
        Write-Host $addHeaders.Output
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


