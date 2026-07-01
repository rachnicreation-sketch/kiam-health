# kiam_health: keep 'health'
Remove-Item -Recurse -Force c:\wamp64\www\kiam\kiam_health\src\modules\enterprise, c:\wamp64\www\kiam\kiam_health\src\modules\erp, c:\wamp64\www\kiam\kiam_health\src\modules\hotel, c:\wamp64\www\kiam\kiam_health\src\modules\pharmacy, c:\wamp64\www\kiam\kiam_health\src\modules\school -ErrorAction SilentlyContinue

# kiam_hopital: keep 'health'
Remove-Item -Recurse -Force c:\wamp64\www\kiam\kiam_hopital\src\modules\enterprise, c:\wamp64\www\kiam\kiam_hopital\src\modules\erp, c:\wamp64\www\kiam\kiam_hopital\src\modules\hotel, c:\wamp64\www\kiam\kiam_hopital\src\modules\pharmacy, c:\wamp64\www\kiam\kiam_hopital\src\modules\school -ErrorAction SilentlyContinue

# kiam_ecole: keep 'school'
Remove-Item -Recurse -Force c:\wamp64\www\kiam\kiam_ecole\src\modules\enterprise, c:\wamp64\www\kiam\kiam_ecole\src\modules\erp, c:\wamp64\www\kiam\kiam_ecole\src\modules\health, c:\wamp64\www\kiam\kiam_ecole\src\modules\hotel, c:\wamp64\www\kiam\kiam_ecole\src\modules\pharmacy -ErrorAction SilentlyContinue

# kiam_erp: keep 'erp'
Remove-Item -Recurse -Force c:\wamp64\www\kiam\kiam_erp\src\modules\enterprise, c:\wamp64\www\kiam\kiam_erp\src\modules\health, c:\wamp64\www\kiam\kiam_erp\src\modules\hotel, c:\wamp64\www\kiam\kiam_erp\src\modules\pharmacy, c:\wamp64\www\kiam\kiam_erp\src\modules\school -ErrorAction SilentlyContinue

# kiam_ges: keep 'enterprise'
Remove-Item -Recurse -Force c:\wamp64\www\kiam\kiam_ges\src\modules\erp, c:\wamp64\www\kiam\kiam_ges\src\modules\health, c:\wamp64\www\kiam\kiam_ges\src\modules\hotel, c:\wamp64\www\kiam\kiam_ges\src\modules\pharmacy, c:\wamp64\www\kiam\kiam_ges\src\modules\school -ErrorAction SilentlyContinue

# kiam_hotel: keep 'hotel'
Remove-Item -Recurse -Force c:\wamp64\www\kiam\kiam_hotel\src\modules\enterprise, c:\wamp64\www\kiam\kiam_hotel\src\modules\erp, c:\wamp64\www\kiam\kiam_hotel\src\modules\health, c:\wamp64\www\kiam\kiam_hotel\src\modules\pharmacy, c:\wamp64\www\kiam\kiam_hotel\src\modules\school -ErrorAction SilentlyContinue

# kiam_caisse: keep 'pharmacy'
Remove-Item -Recurse -Force c:\wamp64\www\kiam\kiam_caisse\src\modules\enterprise, c:\wamp64\www\kiam\kiam_caisse\src\modules\erp, c:\wamp64\www\kiam\kiam_caisse\src\modules\health, c:\wamp64\www\kiam\kiam_caisse\src\modules\hotel, c:\wamp64\www\kiam\kiam_caisse\src\modules\school -ErrorAction SilentlyContinue

# kiam_saas: remove all
Remove-Item -Recurse -Force c:\wamp64\www\kiam\kiam_saas\src\modules\* -ErrorAction SilentlyContinue
