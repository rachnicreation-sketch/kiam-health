$tenants = @("kiam_health", "kiam_hopital", "kiam_ecole", "kiam_erp", "kiam_ges", "kiam_hotel", "kiam_caisse", "kiam_saas")
$phpPath = "C:\wamp64\bin\php\php8.2.18\php.exe"

foreach ($tenant in $tenants) {
    Write-Host "============================="
    Write-Host "Finalizing $tenant..."
    Write-Host "============================="
    
    $tenantDir = "C:\wamp64\www\kiam\$tenant"
    if (-Not (Test-Path $tenantDir)) { continue }
    
    Set-Location $tenantDir

    # 1. Generate app key
    Write-Host "  Generating app key..."
    & $phpPath artisan key:generate --force 2>&1 | Select-String -Pattern "(Application key set|Error)" | Write-Host

    # 2. Optimize (cache config, routes, views)
    Write-Host "  Optimizing Laravel cache..."
    & $phpPath artisan config:cache 2>&1 | Select-String -Pattern "(cached|Error)" | Write-Host
    & $phpPath artisan route:cache 2>&1 | Select-String -Pattern "(cached|Error)" | Write-Host

    # 3. Create storage link
    Write-Host "  Creating storage link..."
    & $phpPath artisan storage:link 2>&1 | Out-Null

    # 4. Set production env
    $envPath = "$tenantDir\.env"
    if (Test-Path $envPath) {
        $content = Get-Content $envPath
        # Fix APP_URL for each tenant
        $content = $content -replace "APP_URL=.*", "APP_URL=http://localhost/$tenant/public"
        $content = $content -replace "APP_ENV=.*", "APP_ENV=production"
        $content = $content -replace "APP_DEBUG=.*", "APP_DEBUG=false"
        Set-Content $envPath $content
    }

    Write-Host "  $tenant finalized!"
}

Write-Host ""
Write-Host "All tenants are deployment-ready!"
