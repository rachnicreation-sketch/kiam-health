$tenants = @("kiam_health", "kiam_hopital", "kiam_ecole", "kiam_erp", "kiam_ges", "kiam_hotel", "kiam_caisse", "kiam_saas")
$phpPath = "C:\wamp64\bin\php\php8.2.18\php.exe"
$adminScript = "C:\wamp64\www\kiam\create_admin.php"

foreach ($tenant in $tenants) {
    $tenantDir = "C:\wamp64\www\kiam\$tenant"
    if (-Not (Test-Path $tenantDir)) { continue }

    # Copy the admin creation script into the tenant dir
    Copy-Item $adminScript "$tenantDir\create_admin.php" -Force

    Set-Location $tenantDir
    Write-Host "Creating admin for $tenant..."
    & $phpPath create_admin.php
    Remove-Item "$tenantDir\create_admin.php" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Admin users created! Credentials: admin@kiam.local / Admin@1234"
