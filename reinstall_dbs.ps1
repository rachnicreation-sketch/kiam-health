$tenants = @("kiam_health", "kiam_hopital", "kiam_ecole", "kiam_erp", "kiam_ges", "kiam_hotel", "kiam_caisse", "kiam_saas")
$phpPath = "C:\wamp64\bin\php\php8.2.18\php.exe"

foreach ($tenant in $tenants) {
    Write-Host "============================="
    Write-Host "Reinstalling DB for $tenant..."
    Write-Host "============================="
    
    $tenantDir = "c:\wamp64\www\kiam\$tenant"
    if (-Not (Test-Path $tenantDir)) {
        continue
    }

    # 1. Update .env
    $envPath = "$tenantDir\.env"
    if (Test-Path $envPath) {
        $content = Get-Content $envPath
        $content = $content -replace "DB_DATABASE=.*", "DB_DATABASE=$tenant"
        Set-Content $envPath $content
        Write-Host "Updated .env DB_DATABASE=$tenant"
    }

    # 2. Update api/config.php
    $apiConfigPath = "$tenantDir\api\config.php"
    if (Test-Path $apiConfigPath) {
        $content = Get-Content $apiConfigPath
        $content = $content -replace "define\('DB_NAME',\s*'.*?'\);", "define('DB_NAME', '$tenant');"
        Set-Content $apiConfigPath $content
        Write-Host "Updated api/config.php DB_NAME=$tenant"
    }

    # 3. Create Database
    Write-Host "Creating MySQL database $tenant..."
    $phpCode = "`$pdo = new PDO('mysql:host=localhost', 'root', ''); `$pdo->exec('CREATE DATABASE IF NOT EXISTS $tenant');"
    & $phpPath -r $phpCode

    # 4. Run Artisan Migrate:fresh
    Set-Location $tenantDir
    Write-Host "Running php artisan migrate:fresh --force..."
    & $phpPath artisan migrate:fresh --force

    Write-Host "$tenant database reinstalled successfully!"
}

Write-Host "All databases reinstalled!"
