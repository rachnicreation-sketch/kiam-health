$tenants = @("kiam_health", "kiam_hopital", "kiam_ecole", "kiam_erp", "kiam_ges", "kiam_hotel", "kiam_caisse", "kiam_saas")

foreach ($tenant in $tenants) {
    Write-Host "============================="
    Write-Host "Deploying $tenant..."
    Write-Host "============================="
    
    $tenantPath = "c:\wamp64\www\kiam\$tenant"
    if (-Not (Test-Path $tenantPath)) {
        Write-Host "$tenantPath does not exist, skipping."
        continue
    }
    
    Set-Location $tenantPath

    # 1. Setup .env
    if (-Not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
    }

    # Make it production
    $envContent = Get-Content ".env"
    $envContent = $envContent -replace "APP_ENV=local", "APP_ENV=production"
    $envContent = $envContent -replace "APP_DEBUG=true", "APP_DEBUG=false"
    
    # Optionally set DB name prefix - maybe later if user specifies, for now just basic production setup
    
    Set-Content ".env" $envContent

    # 2. PHP artisan
    Write-Host "Generating application key..."
    php artisan key:generate

    # 3. Dependencies
    Write-Host "Running composer install..."
    composer install --no-dev --optimize-autoloader --quiet

    Write-Host "Running npm install..."
    npm install --silent

    Write-Host "Running npm run build..."
    npm run build

    # 4. Optimize Laravel
    Write-Host "Optimizing Laravel cache..."
    php artisan optimize

    Write-Host "$tenant is ready!"
}

Write-Host "All tenants prepared for deployment successfully!"
