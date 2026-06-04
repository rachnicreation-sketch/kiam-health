# 🏢 Guide Complet : Isolation Multi-Tenant KIAM

## 📌 Vue d'Ensemble

Ce guide fournit une solution complète pour **cloisonner entièrement** les tenants de votre application KIAM SaaS. Chaque tenant (Health, ERP, School, Hotel, Pharmacy, Enterprise) aura :

- ✅ **Données isolées** - Aucune fuite de données entre tenants
- ✅ **Modules séparés** - Seuls ses modules sont visibles et chargés
- ✅ **Thème personnalisé** - Identité visuelle propre à chaque tenant
- ✅ **RH indépendant** - Module RH spécifique à chaque secteur
- ✅ **Contrôle d'accès strict** - Permissions granulaires par tenant

## 🎯 Problèmes Résolus

| Problème | Solution |
|----------|----------|
| Données du tenant Health visibles dans ERP | Middleware + Scope Eloquent |
| Tous les modules chargés pour tous les tenants | Module loader dynamique |
| Pas de distinction visuelle entre tenants | Thèmes tenant-spécifiques |
| Module RH partagé entre tenants | RH indépendant par secteur |
| Pas d'audits des accès non autorisés | Logging de sécurité complet |

## 📂 Fichiers Créés

### Backend (Laravel/PHP)

| Fichier | Rôle | Obligatoire |
|---------|------|------------|
| `app/Traits/TenantIsolated.php` | Scope global d'isolation Eloquent | ⭐⭐⭐ |
| `app/Http/Middleware/TenantIsolation.php` | Validation tenant au niveau routes | ⭐⭐⭐ |
| `database/migrations/2026_06_04_add_tenant_isolation.php` | Ajouter tenant_id aux tables | ⭐⭐⭐ |

### Frontend (React/TypeScript)

| Fichier | Rôle | Obligatoire |
|---------|------|------------|
| `src/config/tenant-modules.ts` | Configuration des modules par tenant | ⭐⭐⭐ |
| `src/hooks/useTenantModules.ts` | Hook chargement dynamique modules | ⭐⭐⭐ |
| `src/hooks/useTenantTheme.ts` | Hook gestion thèmes tenant | ⭐⭐ |
| `src/components/DynamicModuleRouter.tsx` | Routeur modules dynamique | ⭐⭐⭐ |

### Documentation

| Fichier | Contenu |
|---------|---------|
| `IMPLEMENTATION_GUIDE.md` | Guide complet d'implémentation (7 phases) |
| `scripts/test-isolation.php` | Script de test et validation |

## 🚀 Quick Start (15 minutes)

### 1️⃣ Ajouter tenant_id aux tables

```bash
# Créer la migration
php artisan make:migration add_tenant_isolation

# Exécuter
php artisan migrate
```

### 2️⃣ Enregistrer le middleware

Éditer `bootstrap/app.php` :

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api([
        \App\Http\Middleware\TenantIsolation::class,
    ]);
})
```

### 3️⃣ Appliquer le trait aux modèles

Pour chaque modèle à isoler (Article, User, Supplier, etc.) :

```php
namespace App\Models;

use App\Traits\TenantIsolated;

class Article extends Model
{
    use TenantIsolated;  // ← Ajouter cette ligne
    
    protected $fillable = [
        'tenant_id',      // ← Ajouter à fillable
        'nom',
        'code',
        // ...
    ];
}
```

### 4️⃣ Refactoriser src/App.tsx

Remplacer les imports statiques de modules par le chargement dynamique :

```tsx
import { useTenantRoutes, DynamicModuleRouter } from '@/components/DynamicModuleRouter';

function AppRoutes() {
  const tenantRoutes = useTenantRoutes();
  
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<Login />} />
      
      {/* Routes tenant-spécifiques - chargées dynamiquement */}
      {tenantRoutes.map((route, idx) => (
        <Route key={idx} {...route} />
      ))}
    </Routes>
  );
}

export default function App() {
  return (
    <DynamicModuleRouter>
      <AppRoutes />
    </DynamicModuleRouter>
  );
}
```

### 5️⃣ Tester l'isolation

```bash
# Exécuter les tests d'isolation
php scripts/test-isolation.php
```

## 📊 Architecture Résultante

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │     Frontend (React)          │
        │  DynamicModuleRouter          │
        │  useTenantModules             │
        │  useTenantTheme               │
        └──────────────┬────────────────┘
                       │
                       ▼ (API Requests)
        ┌──────────────────────────────┐
        │  TenantIsolation Middleware   │ ← Valide tenant_id
        └──────────────┬────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Controllers (Laravel)        │
        │  Récupèrent tenant_id de la  │
        │  requête validée             │
        └──────────────┬────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  TenantIsolated Scope        │ ← Filtre automatiquement
        │  Models (Eloquent)            │   par tenant_id
        └──────────────┬────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Base de Données             │
        │  (données isolées)            │
        └──────────────────────────────┘
```

## 🔐 Isolation Garantie

### Niveau API
- Middleware `TenantIsolation` valide chaque requête
- Rejette les accès cross-tenant
- Enregistre les tentatives suspectes

### Niveau Base de Données
- Scope Eloquent `TenantIsolated` filtre automatiquement
- Impossible d'accéder à des données d'un autre tenant
- Même si le code l'essaie

### Niveau Frontend
- `useTenantModules` charge seulement les modules autorisés
- `DynamicModuleRouter` bloque les routes d'autres tenants
- Les composants ne sont jamais chargés

## 🎨 Personnalisation par Tenant

Chaque tenant possède sa propre configuration dans `src/config/tenant-modules.ts` :

```typescript
export const ERP_MODULES: TenantModuleConfig = {
  sector: 'erp',
  theme: {
    primaryColor: '#8b5cf6',      // Purple
    secondaryColor: '#a855f7',
    accentColor: '#7c3aed',
    logoUrl: '/logos/erp-logo.svg',
  },
  features: {
    pos: true,
    inventory: true,
    procurement: true,
    humanResources: true,  // RH spécifique à ERP
    // ...
  },
  modules: [
    // Modules spécifiques à ERP
  ]
};
```

## 📖 Documentation Détaillée

Pour une implémentation complète et étape par étape, consulter :

👉 **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)**

Ce guide couvre :
- **Phase 1** : Intégration des fichiers (30 min)
- **Phase 2** : Préparation BD (1 h)
- **Phase 3** : Intégration code (2 h)
- **Phase 4** : Migrations données (1 h)
- **Phase 5** : Tests et validation (1-2 h)
- **Phase 6** : Déploiement (30 min)
- **Phase 7** : Post-déploiement

## ✅ Checklist de Déploiement

```
□ Backup de la BD effectué
□ Toutes les migrations exécutées (php artisan migrate)
□ tenant_id peuplé pour les données existantes
□ Traits TenantIsolated appliqués aux modèles
□ Middleware TenantIsolation enregistré
□ Routes API groupées par tenant (optionnel mais recommandé)
□ src/App.tsx refactorisé avec DynamicModuleRouter
□ Tests d'isolation passent (php scripts/test-isolation.php)
□ Modules se chargent correctement pour chaque tenant
□ Dark/Light mode fonctionne
□ Thèmes tenant-spécifiques appliqués
□ Données de tenants différents ne sont jamais visibles
□ Logs de sécurité examinés
□ Performances acceptables (< 200ms par requête)
□ Build frontend réussi (npm run build)
```

## 🧪 Tests Manuels

### Test 1 : Isolation des données
```bash
# Connexion avec user Health
# Créer un patient
# Déconnexion

# Connexion avec user ERP
# Vérifier que le patient n'est PAS visible
# ✓ Patient invisible = succès
```

### Test 2 : Modules visibles
```bash
# Connexion avec user ERP
# Vérifier que seuls les modules ERP apparaissent dans le menu
# ✓ Modules Health/School absents = succès
```

### Test 3 : Tentative d'accès croisé
```bash
# Connexion avec user ERP
# Tenter d'accéder directement à /health/patients en URL
# ✓ Redirection vers /erp = succès
```

### Test 4 : Thèmes
```bash
# Vérifier que chaque tenant a ses couleurs
# Health: cyan (#0ea5e9)
# ERP: purple (#8b5cf6)
# School: amber (#f59e0b)
# ✓ Couleurs différentes = succès
```

## 🔍 Debugging

### Vérifier l'isolation
```php
// Dans tinker
php artisan tinker

// User ERP ne voit que les articles ERP
>>> Auth::loginUsingId('user-erp-id');
>>> App\Models\Article::all(); // Seuls les articles ERP

// Vérifier le tenant_id
>>> auth()->user()->tenant_id; // "erp"
```

### Examiner les logs de sécurité
```bash
# Voir les tentatives d'accès non autorisé
tail -f storage/logs/laravel.log | grep "Security Event"
```

### Vérifier les routes
```bash
# Lister les routes avec middlewares
php artisan route:list | grep tenant
```

## 📊 Monitoring et Métriques

Les éléments clés à surveiller :

| Métrique | Seuil Alerte |
|----------|-------------|
| Tentatives d'accès non autorisé | > 10 par jour |
| Temps de réponse API | > 500ms |
| Erreurs de chargement de module | > 1% |
| Absence de tenant_id | > 0.1% |

Voir les logs : `storage/logs/laravel.log`

## 🆘 Support et Dépannage

### "Tenant ID non trouvé"
**Cause** : JWT ne contient pas tenant_id
**Solution** : Vérifier `api/auth.php` ligne où JWT est encodé

### "Unauthorized tenant access"
**Cause** : Utilisateur tente d'accéder à un autre tenant
**Solution** : C'est normal et sécurisé! Vérifier les logs.

### Modules ne se chargent pas
**Cause** : Erreur dans `useTenantModules`
**Solution** : Vérifier la console browser pour les erreurs

### Dark mode ne s'applique pas
**Cause** : `useTenantTheme` non appelé dans AppLayout
**Solution** : Ajouter `useTenantTheme()` dans le composant wrapper

## 📚 Ressources Supplémentaires

- [Laravel Eloquent Scopes](https://laravel.com/docs/11.x/eloquent#global-scopes)
- [Laravel Middleware](https://laravel.com/docs/11.x/middleware)
- [React Suspense & Code Splitting](https://react.dev/reference/react/Suspense)
- [JWT.io - Debugger](https://jwt.io)

## 📝 Licence et Attribution

Cette solution est fournie comme part intégrante du système KIAM SaaS.

---

**Besoin d'aide?** Consulter [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) pour plus de détails.

**Dernière mise à jour** : Juin 2026
