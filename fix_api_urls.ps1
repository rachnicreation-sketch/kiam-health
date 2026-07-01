$tenants = @("kiam_health", "kiam_hopital", "kiam_ecole", "kiam_erp", "kiam_ges", "kiam_hotel", "kiam_caisse", "kiam_saas")

# New dynamic API_BASE_URL that reads from the current URL path
$newLine = @'
// Auto-detect the app folder name from the URL (e.g., /kiam_health/dist/ => /kiam_health/api)
const _pathRoot = window.location.pathname.split('/').filter(Boolean)[0] || 'kiam';
const API_BASE_URL = `/${_pathRoot}/api`;
'@

foreach ($tenant in $tenants) {
    $apiServicePath = "C:\wamp64\www\kiam\$tenant\src\lib\api-service.ts"
    if (-Not (Test-Path $apiServicePath)) {
        Write-Host "Skipping $tenant (api-service.ts not found)"
        continue
    }

    $content = Get-Content $apiServicePath -Raw

    # Replace the hardcoded API_BASE_URL line
    $content = $content -replace 'const API_BASE_URL = "/kiam/api";', $newLine

    Set-Content $apiServicePath $content -NoNewline
    Write-Host "Fixed api-service.ts for $tenant"
}

Write-Host ""
Write-Host "Done! Now rebuilding all frontends..."

foreach ($tenant in $tenants) {
    $tenantDir = "C:\wamp64\www\kiam\$tenant"
    if (-Not (Test-Path $tenantDir)) { continue }

    Set-Location $tenantDir
    Write-Host "Building $tenant..."
    npm run build --silent

    # Copy dist to public/dist
    $distSrc  = "$tenantDir\dist"
    $distDest = "$tenantDir\public\dist"
    if (Test-Path $distDest) { Remove-Item -Recurse -Force $distDest }
    if (Test-Path $distSrc)  { Copy-Item -Recurse $distSrc $distDest }

    Write-Host "  $tenant built and copied!"
}

Write-Host ""
Write-Host "All apps rebuilt with correct API URLs!"
