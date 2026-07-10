# 🚀 Guide de déploiement — Kiam sur Apache/WAMP

## 📋 Vue d'ensemble

Pour accéder à la suite Kiam via **`http://localhost/kiam/`** sur Apache/WAMP :

1. Compiler le projet React
2. Placer les fichiers compilés dans le bon répertoire
3. Configurer Apache (`.htaccess` déjà en place)
4. Accéder via le navigateur

---

## 🔧 Étapes de déploiement

### **Étape 1 : Builder le projet**

```bash
cd c:\wamp64\www\kiam
npm run build
```

Cela crée le dossier `dist/` avec tous les fichiers compilés.

### **Étape 2 : Copier les fichiers vers le dossier Apache**

Après le build, les fichiers se trouvent dans `c:\wamp64\www\kiam\dist/`.

**Copier le contenu de `dist/` vers `c:\wamp64\www\kiam/` :**

```bash
# PowerShell
Copy-Item -Path "c:\wamp64\www\kiam\dist\*" -Destination "c:\wamp64\www\kiam\" -Recurse -Force
```

Ou avec le script existant dans `package.json` :

```bash
npm run build
```

(Le script build copie déjà les assets publiques via `xcopy`)

### **Étape 3 : Vérifier la structure**

Après le build et la copie, la structure devrait ressembler à :

```
c:\wamp64\www\kiam\
├── index.html (généré par Vite)
├── dist/
│   ├── index.html
│   ├── assets/
│   │   ├── main.js
│   │   ├── main.css
│   │   └── ...
│   ├── images/
│   └── locales/
├── .htaccess (configuré pour React Router)
├── vite.config.ts (base: '/kiam/')
├── package.json
└── src/
```

### **Étape 4 : Démarrer Apache/WAMP**

Assurez-vous que WAMP est démarré et que Apache écoute correctement.

```bash
# Dans WAMP Control Panel, cliquer sur "Start All"
```

### **Étape 5 : Accéder au site**

Ouvrir le navigateur et aller à :

```
http://localhost/kiam/
```

---

## 🌐 URLs d'accès après déploiement

### **Pages publiques**

| Page | URL |
|------|-----|
| **Accueil** | http://localhost/kiam/ |
| **Solutions** | http://localhost/kiam/#/solutions |
| **Tarifs** | http://localhost/kiam/#/pricing |
| **Démo** | http://localhost/kiam/#/demo |
| **À propos** | http://localhost/kiam/#/about |
| **Blog** | http://localhost/kiam/#/blog |
| **Contact** | http://localhost/kiam/#/contact |
| **FAQ** | http://localhost/kiam/#/faq |
| **Carrières** | http://localhost/kiam/#/careers |
| **Documentation** | http://localhost/kiam/#/docs |
| **Confidentialité** | http://localhost/kiam/#/privacy |
| **Conditions** | http://localhost/kiam/#/terms |

### **Solutions détaillées**

| Solution | URL |
|----------|-----|
| Kiam Health | http://localhost/kiam/#/solutions/health |
| Kiam ERP | http://localhost/kiam/#/solutions/erp |
| Kiam School | http://localhost/kiam/#/solutions/school |
| Kiam Hotel | http://localhost/kiam/#/solutions/hotel |
| Kiam Pharmacy | http://localhost/kiam/#/solutions/pharmacy |
| Kiam Enterprise | http://localhost/kiam/#/solutions/enterprise |

### **Authentification**

| Page | URL |
|------|-----|
| Connexion | http://localhost/kiam/#/login |
| Inscription | http://localhost/kiam/#/signup |

---

## ⚙️ Configuration appliquée

### **vite.config.ts**

```typescript
export default defineConfig(({ mode }) => ({
  base: '/kiam/',
  publicDir: 'public',
  // ...
}));
```

### **.htaccess**

```apache
RewriteEngine On
RewriteBase /kiam/

# Rediriger les requêtes vers index.html pour React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

---

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. **Ouvrir le navigateur** → `http://localhost/kiam/`
2. **Vérifier le menu** → Cliquer sur les liens (Solutions, Tarifs, etc.)
3. **Vérifier les routes dynamiques** → Cliquer sur une solution
4. **Vérifier la console** → F12 → Console (pas d'erreurs)
5. **Vérifier le responsive** → F12 → Toggle device toolbar

---

## 🐛 Dépannage

### **Erreur 404**

- Vérifier que `.htaccess` est présent dans `/kiam/`
- Vérifier que `mod_rewrite` est activé dans Apache
- Redémarrer Apache

### **CSS/JS ne charge pas**

- Vérifier que les fichiers compilés sont dans `/kiam/`
- Vérifier que `base: '/kiam/'` est dans `vite.config.ts`
- Vider le cache du navigateur (Ctrl+Shift+Delete)

### **Images ne s'affichent pas**

- Vérifier que `/kiam/images/` existe
- Vérifier que le script build a bien copié les images
- Vérifier le chemin des images dans le code (doit commencer par `/`)

---

## 📝 Script build complet

Le script `package.json` fait déjà :

```json
"build": "tsc && vite build && xcopy public\\images dist\\images /E /I /Y && xcopy public\\locales dist\\locales /E /I /Y"
```

Cela compile, puis copie les assets. Après, il suffit de copier le contenu de `dist/` vers `/kiam/`.

---

## 🚀 Accès rapide

### **Après build, une seule commande pour tout :**

```bash
npm run build && Copy-Item -Path "c:\wamp64\www\kiam\dist\*" -Destination "c:\wamp64\www\kiam\" -Recurse -Force
```

Puis ouvrir : **http://localhost/kiam/**

---

## ✅ Checklist déploiement

- [ ] `npm run build` exécuté avec succès
- [ ] Fichiers compilés dans `dist/`
- [ ] Fichiers copiés vers `/kiam/`
- [ ] `.htaccess` présent dans `/kiam/`
- [ ] `vite.config.ts` a `base: '/kiam/'`
- [ ] Apache/WAMP démarré
- [ ] `http://localhost/kiam/` accessible
- [ ] Menu fonctionne correctement
- [ ] Routes dynamiques (`/solutions/:slug`) fonctionnent
- [ ] Console navigateur sans erreurs

---

**Créé le**: 2026-07-10  
**Dernière mise à jour**: 2026-07-10
