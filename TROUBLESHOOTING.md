# 🔧 Guide de dépannage — Kiam sur http://localhost/kiam/

## ❌ Erreur 500 rencontrée et résolue

**Cause**: Le module Apache `mod_headers` n'était pas activé, et le `.htaccess` contenait des directives `Header`.

**Solution appliquée**: 
- Modification du `.htaccess` pour envelopper les directives `Header` dans `<IfModule mod_headers.c>`
- Ajout de `DirectoryIndex index.html index.php` pour que React `index.html` soit servi en priorité
- Copie des fichiers compilés de `dist/` vers la racine `/kiam/`

---

## ✅ Structure correcte après le fix

```
c:\wamp64\www\kiam\
├── .htaccess (configuration Apache)
├── index.html (React app compilée)
├── assets/
│   ├── main.js
│   ├── main.css
│   └── ...
├── images/
├── locales/
├── api/ (endpoints PHP)
├── src/ (source TypeScript/React)
├── dist/ (fichiers compilés)
└── ... autres fichiers
```

---

## 🌐 Accès au site

Après les corrections, vous devriez pouvoir accéder à :

**http://localhost/kiam/**

---

## 📋 Vérification de la configuration

### 1. Apache service running
```bash
Get-Service wampapache64
```

### 2. Fichiers en place
```bash
Test-Path "c:\wamp64\www\kiam\index.html"          # Doit être TRUE
Test-Path "c:\wamp64\www\kiam\assets"              # Doit être TRUE
Test-Path "c:\wamp64\www\kiam\.htaccess"           # Doit être TRUE
```

### 3. .htaccess valide
- Pas d'erreurs "Invalid command" dans les logs Apache
- `mod_rewrite` doit être activé
- Directives `Header` enveloppées dans `<IfModule>`

---

## 🧪 Test du navigateur

1. Ouvrir **http://localhost/kiam/**
2. Vérifier que la page d'accueil charge
3. Cliquer sur un lien dans le menu
4. Vérifier que l'URL change (ex: `http://localhost/kiam/#/solutions`)
5. Vérifier la console du navigateur (F12) pour les erreurs JS

---

## 📱 Routes testées

| Route | Comportement attendu |
|-------|----------------------|
| `/` | Accueil avec démo interactive |
| `/solutions` | Galerie de 6 solutions |
| `/solutions/health` | Fiche Kiam Health |
| `/pricing` | Tableau tarifaire |
| `/demo` | Formulaire de demande |
| `/about` | À propos |
| `/blog` | Articles + recherche |
| `/contact` | Formulaire + coordonnées |

---

## 🔄 Si le problème persiste

### Option 1 : Vider le cache navigateur
- Ctrl + Shift + Delete
- Effacer tout
- Relancer le navigateur

### Option 2 : Vérifier les logs Apache
```bash
Get-Content "C:\wamp64\logs\apache_error.log" -Tail 30
```

Chercher les lignes avec `ERROR` ou `ALERT`.

### Option 3 : Redémarrer manuellement Apache
1. WAMP Control Panel → Stop All
2. Attendre 5 secondes
3. WAMP Control Panel → Start All
4. Tester http://localhost/kiam/

### Option 4 : Recompiler et redéployer
```bash
cd c:\wamp64\www\kiam
npm run build
Copy-Item -Path ".\dist\*" -Destination "." -Recurse -Force
```

---

## 📞 Support

Si le problème continue, vérifier :

1. **Apache écoute sur le port 80** : `http://localhost/` doit fonctionner
2. **Alias `/kiam/` configuré correctement** dans httpd.conf
3. **Aucun autre conflit de ports**
4. **Permissions fichiers** : `/kiam/` doit être accessible à Apache

---

**Créé le**: 2026-07-10  
**Dernière mise à jour**: 2026-07-10 (après fix erreur 500)
