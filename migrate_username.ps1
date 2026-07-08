$tenants = @("kiam_health", "kiam_hopital", "kiam_ecole", "kiam_erp", "kiam_ges", "kiam_hotel", "kiam_caisse", "kiam_saas")
$phpPath = "C:\wamp64\bin\php\php8.2.18\php.exe"

foreach ($tenant in $tenants) {
    $tenantDir = "C:\wamp64\www\kiam\$tenant"
    if (-Not (Test-Path $tenantDir)) { continue }

    # Copy the new migration
    Copy-Item "C:\wamp64\www\kiam\database\migrations\2026_07_02_110157_add_username_to_users_table.php" "$tenantDir\database\migrations\" -Force

    # Run migration
    Set-Location $tenantDir
    Write-Host "Migrating $tenant..."
    & $phpPath artisan migrate --force
}
