$tenants = @("kiam_hotel", "kiam_hopital", "kiam_caisse", "kiam_saas")

foreach ($tenant in $tenants) {
    Write-Host "============================="
    Write-Host "Frontend Build for $tenant..."
    Write-Host "============================="
    
    $tenantPath = "c:\wamp64\www\kiam\$tenant"
    if (-Not (Test-Path $tenantPath)) {
        continue
    }
    
    Set-Location $tenantPath

    Write-Host "Running npm install..."
    npm install --silent

    Write-Host "Running npm run build..."
    npm run build

    Write-Host "$tenant frontend is ready!"
}

Write-Host "Frontend builds completed!"
