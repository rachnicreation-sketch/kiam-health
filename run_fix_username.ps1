$tenants = @("kiam_health", "kiam_hopital", "kiam_ecole", "kiam_erp", "kiam_ges", "kiam_hotel", "kiam_caisse", "kiam_saas")
$phpPath = "C:\wamp64\bin\php\php8.2.18\php.exe"

foreach ($tenant in $tenants) {
    $tenantDir = "C:\wamp64\www\kiam\$tenant"
    if (-Not (Test-Path $tenantDir)) { continue }

    Copy-Item "C:\wamp64\www\kiam\fix_username.php" "$tenantDir\fix_username.php" -Force
    Set-Location $tenantDir
    Write-Host "Fixing username in $tenant..."
    & $phpPath fix_username.php
}
