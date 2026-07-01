$tenants = @("kiam_ecole", "kiam_erp", "kiam_ges", "kiam_hotel", "kiam_hopital", "kiam_caisse", "kiam_saas")
foreach ($tenant in $tenants) {
    Write-Host "Copying to $tenant..."
    robocopy c:\wamp64\www\kiam c:\wamp64\www\kiam\$tenant /E /XD kiam_* node_modules vendor .git dist /NFL /NDL /NJH /NJS /nc /ns /np
}
Write-Host "Done!"
