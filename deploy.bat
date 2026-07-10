@echo off
REM Script de déploiement pour Kiam sur Apache/WAMP

echo ============================================
echo Copie des fichiers compilés vers /kiam/
echo ============================================

REM Copier index.html
copy /Y "c:\wamp64\www\kiam\dist\index.html" "c:\wamp64\www\kiam\index.html"

REM Copier le dossier assets
xcopy /E /I /Y "c:\wamp64\www\kiam\dist\assets" "c:\wamp64\www\kiam\assets"

REM Vérifier que images et locales existent (déjà en place via npm run build)

echo.
echo ✓ Déploiement complété !
echo.
echo Accédez au site : http://localhost/kiam/
echo.
pause
