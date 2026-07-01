$tenants = @("kiam_health", "kiam_hopital", "kiam_ecole", "kiam_erp", "kiam_ges", "kiam_hotel", "kiam_caisse", "kiam_saas")
$phpPath = "C:\wamp64\bin\php\php8.2.18\php.exe"
$composerPath = "C:\wamp64\bin\composer\composer.phar"
$sourceVendor = "C:\wamp64\www\kiam\vendor"

# Check if source vendor exists
if (-Not (Test-Path $sourceVendor)) {
    Write-Host "ERROR: Source vendor directory not found at $sourceVendor"
    exit 1
}

foreach ($tenant in $tenants) {
    $tenantDir = "C:\wamp64\www\kiam\$tenant"
    $vendorDest = "$tenantDir\vendor"

    if (-Not (Test-Path $tenantDir)) {
        Write-Host "Skipping $tenant (directory not found)"
        continue
    }

    # Remove existing vendor (if any)
    if (Test-Path $vendorDest) {
        Remove-Item -Recurse -Force $vendorDest
    }

    # Create a junction (symlink for directories on Windows)
    Write-Host "Linking vendor for $tenant..."
    cmd /c mklink /J "$vendorDest" "$sourceVendor"

    # Now run migrations
    Write-Host "Running migrations for $tenant..."
    Set-Location $tenantDir
    & $phpPath artisan migrate:fresh --force 2>&1
    
    Write-Host "$tenant migrations done!"
}

Write-Host ""
Write-Host "All migrations completed!"
