
# ✅ CHECKLIST D'IMPLÉMENTATION - ISOLATION MULTI-TENANT

**Projet**: KIAM SaaS Multitenancy v2.0  
**Date Début**: ____________  
**Date Fin**: ____________  
**Responsable**: ____________  

---

## 📋 **PHASE 0: PRÉPARATION (15-30 min)**

- [ ] **0.1** Créer une branche Git dédiée
  ```bash
  git checkout -b feature/tenant-isolation-overhaul
  ```
  
- [ ] **0.2** Backup de la base de données
  ```bash
  mysqldump -u root kiam_saas > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
  
- [ ] **0.3** Vérifier les dépendances Laravel
  - [ ] Laravel 11.31+ : `php artisan --version`
  - [ ] Spatie Permission : `composer show spatie/laravel-permission`
  - [ ] Firebase JWT : `composer require firebase/php-jwt:^6.0`
  
- [ ] **0.4** Vérifier les dépendances Node.js
  - [ ] Node 20+ : `node --version`
  - [ ] React 18+ : `npm show react version`
  - [ ] TypeScript : `npm show typescript version`
  
- [ ] **0.5** Notifier l'équipe du déploiement
  - [ ] Email aux développeurs
  - [ ] Planifier les tests
  - [ ] Prévoir maintenance window

---

## 📋 **PHASE 1: INTÉGRATION DES FICHIERS (30 min)**

### Fichiers Backend
- [ ] **1.1** `app/Traits/TenantIsolated.php` ✅ CRÉÉ
  - [ ] Vérifier le contenu du trait
  - [ ] Vérifier que `getTenantId()` utilise la bonne clé JWT
  - [ ] Adapter si JWT utilise une clé personnalisée

- [ ] **1.2** `app/Http/Middleware/TenantIsolation.php` ✅ CRÉÉ
  - [ ] Vérifier la logique d'extraction du tenant_id
  - [ ] Vérifier la liste des routes publiques
  - [ ] Adapter si necessaire

### Fichiers Frontend
- [ ] **1.3** `src/config/tenant-modules.ts` ✅ CRÉÉ
  - [ ] Vérifier les chemins d'import des modules
  - [ ] Vérifier les secteurs correspondent à vos tenants
  - [ ] Adapter les couleurs si nécessaire
  - [ ] Vérifier les modules listés

- [ ] **1.4** `src/hooks/useTenantModules.ts` ✅ CRÉÉ
  - [ ] Vérifier les imports
  - [ ] Vérifier la logique de permissions

- [ ] **1.5** `src/hooks/useTenantTheme.ts` ✅ CRÉÉ
  - [ ] Vérifier les fonctions de couleur
  - [ ] Tester la génération des variantes de couleurs

- [ ] **1.6** `src/components/DynamicModuleRouter.tsx` ✅ CRÉÉ
  - [ ] Vérifier la logique de route protection
  - [ ] Vérifier le Suspense fallback

### Fichiers Avancés
- [ ] **1.7** `src/config/tenant-themes-advanced.ts` ✅ CRÉÉ
  - [ ] Lire les exemples
  - [ ] Adapter les configurations si nécessaire

### Documentation
- [ ] **1.8** `IMPLEMENTATION_GUIDE.md` ✅ CRÉÉ
- [ ] **1.9** `MULTITENANCY_README.md` ✅ CRÉÉ
- [ ] **1.10** `SOLUTION_SUMMARY.md` ✅ CRÉÉ
- [ ] **1.11** `scripts/test-isolation.php` ✅ CRÉÉ

**Status Phase 1**: ✅ COMPLÈTE

---

## 📋 **PHASE 2: PRÉPARATION BASE DE DONNÉES (1-2 h)**

### Migrations
- [ ] **2.1** Créer la migration tenant_isolation
  - [ ] Fichier : `database/migrations/2026_06_04_add_tenant_isolation.php` ✅ CRÉÉ
  - [ ] Vérifier les tables listées
  - [ ] Adapter si tables supplémentaires

- [ ] **2.2** Créer la migration populate_tenant_ids
  - [ ] Fichier : `database/migrations/2026_06_04_populate_tenant_ids.php` ✅ CRÉÉ
  - [ ] Vérifier les stratégies de peuplement
  - [ ] Adapter selon votre structure de données

### Exécution des Migrations
- [ ] **2.3** Vérifier l'état des migrations
  ```bash
  php artisan migrate:status
  ```

- [ ] **2.4** Exécuter les migrations (MODE DRY-RUN D'ABORD!)
  ```bash
  # Voir ce qui sera fait
  php artisan migrate --step --dry-run
  ```

- [ ] **2.5** Exécuter réellement
  ```bash
  php artisan migrate --step
  ```

- [ ] **2.6** Valider que les colonnes tenant_id ont été créées
  ```bash
  # Via MySQL
  SHOW COLUMNS FROM users WHERE Field='tenant_id';
  SHOW COLUMNS FROM articles WHERE Field='tenant_id';
  # ... vérifier pour d'autres tables
  ```

- [ ] **2.7** Vérifier les index
  ```bash
  SHOW INDEXES FROM users WHERE Column_name='tenant_id';
  ```

**Status Phase 2**: ⏳ EN COURS

---

## 📋 **PHASE 3: INTÉGRATION DANS LE CODE (2-3 h)**

### Enregistrer le Middleware
- [ ] **3.1** Ouvrir `bootstrap/app.php`

- [ ] **3.2** Trouver le bloc `withMiddleware()`
  ```php
  ->withMiddleware(function (Middleware $middleware) {
      // Ajouter ici
  })
  ```

- [ ] **3.3** Ajouter le middleware API
  ```php
  $middleware->api([
      \App\Http\Middleware\TenantIsolation::class,
  ]);
  ```

- [ ] **3.4** Sauvegarder et tester
  ```bash
  php artisan route:list | grep tenant
  ```

### Appliquer le Trait aux Modèles
- [ ] **3.5** Identifier tous les modèles à isoler
  - [ ] User
  - [ ] Article
  - [ ] Supplier
  - [ ] Warehouse
  - [ ] Patient (Health)
  - [ ] Student (School)
  - [ ] ...autres selon vos modules

- [ ] **3.6** Pour chaque modèle, ajouter le trait
  ```php
  // app/Models/Article.php
  use App\Traits\TenantIsolated;
  
  protected $fillable = ['tenant_id', 'nom', 'code', ...];
  ```

### Segmenter les Routes API (Optionnel mais Recommandé)
- [ ] **3.7** Ouvrir `routes/api.php`

- [ ] **3.8** Restructurer les routes par tenant
  ```php
  Route::prefix('erp')->middleware(['auth:sanctum', TenantIsolation::class])->group(...)
  Route::prefix('health')->middleware(['auth:sanctum', TenantIsolation::class])->group(...)
  // etc.
  ```

- [ ] **3.9** Vérifier que les routes sont bien groupées
  ```bash
  php artisan route:list
  ```

### Refactoriser src/App.tsx
- [ ] **3.10** Ouvrir `src/App.tsx`

- [ ] **3.11** Remplacer les imports statiques de modules
  ```tsx
  // AVANT (à supprimer)
  import Dashboard from "./modules/health/pages/Dashboard";
  import Patients from "./modules/health/pages/Patients";
  // ... (100+ imports)
  
  // APRÈS (ajouter)
  import { useTenantRoutes, DynamicModuleRouter } from '@/components/DynamicModuleRouter';
  ```

- [ ] **3.12** Utiliser DynamicModuleRouter
  ```tsx
  function App() {
    const tenantRoutes = useTenantRoutes();
    
    return (
      <DynamicModuleRouter>
        <Routes>
          {tenantRoutes.map((route, idx) => (
            <Route key={idx} {...route} />
          ))}
        </Routes>
      </DynamicModuleRouter>
    );
  }
  ```

- [ ] **3.13** Supprimer tous les imports inutilisés
  ```bash
  npm run lint -- --fix
  ```

**Status Phase 3**: ⏳ EN COURS

---

## 📋 **PHASE 4: MIGRATIONS DE DONNÉES (1-2 h)**

### Peupler les Données Existantes
- [ ] **4.1** Exécuter la migration de peuplement
  ```bash
  php artisan migrate --step
  ```

- [ ] **4.2** Vérifier que les tenant_id ont été peuplés
  ```bash
  SELECT COUNT(*) FROM users WHERE tenant_id IS NULL; # Doit être 0
  SELECT COUNT(*) FROM articles WHERE tenant_id IS NULL; # Doit être 0
  SELECT DISTINCT tenant_id FROM users; # Doit montrer les tenants
  ```

- [ ] **4.3** Si des enregistrements sont NULL, les assigner manuellement
  ```bash
  # Via tinker
  php artisan tinker
  
  >>> DB::table('users')->whereNull('tenant_id')->update(['tenant_id' => 'erp']);
  >>> DB::table('articles')->whereNull('tenant_id')->update(['tenant_id' => 'erp']);
  ```

### Créer des Modules RH Indépendants
- [ ] **4.4** Copier HealthHumanResources vers health/pages/HealthHumanResources.tsx
- [ ] **4.5** Créer ErpHumanResources dans erp/pages/ErpHumanResources.tsx
- [ ] **4.6** Créer SchoolHumanResources dans school/pages/SchoolHumanResources.tsx
- [ ] **4.7** Mettre à jour tenant-modules.ts pour pointer vers chacun

**Status Phase 4**: ⏳ EN COURS

---

## 📋 **PHASE 5: TESTS ET VALIDATION (1-2 h)**

### Tests Automatisés
- [ ] **5.1** Exécuter le script de test
  ```bash
  php scripts/test-isolation.php
  ```

- [ ] **5.2** Vérifier que tous les tests passent (✓)

- [ ] **5.3** Vérifier qu'aucun test échoue (✗)

### Tests Unitaires (Optionnel)
- [ ] **5.4** Créer tests/Unit/TenantIsolationTest.php
- [ ] **5.5** Exécuter tests PHPUnit
  ```bash
  php artisan test
  ```

### Tests Manuels - Scénario 1: Isolation des Données
- [ ] **5.6** Connexion avec user Health
  - [ ] Créer un patient
  - [ ] Note ID: ________________

- [ ] **5.7** Déconnexion

- [ ] **5.8** Connexion avec user ERP
  - [ ] Vérifier que le patient n'apparaît PAS dans le listing
  - [ ] Vérifier que personne ne peut le voir via API
  - [ ] ✅ Patient invisible = SUCCÈS

### Tests Manuels - Scénario 2: Modules Visibles
- [ ] **5.9** Connexion avec user ERP
  - [ ] Ouvrir le navigateur (F12 console)
  - [ ] Vérifier que seuls les modules ERP apparaissent
  - [ ] Chercher dans la console : modules listés
  ```bash
  # Console
  document.querySelectorAll('[data-module-id]') # Ne doit montrer que ERP
  ```

- [ ] **5.10** Déconnexion

- [ ] **5.11** Connexion avec user Health
  - [ ] Vérifier que seuls les modules Health apparaissent
  - [ ] ✅ Modules différents = SUCCÈS

### Tests Manuels - Scénario 3: Tentative d'Accès Croisé
- [ ] **5.12** Connexion avec user ERP

- [ ] **5.13** Tenter d'accéder à `/health/patients` directement en URL
  - [ ] Doit rediriger vers `/erp`
  - [ ] Doit afficher erreur 403 ou redirection
  - [ ] ✅ Accès bloqué = SUCCÈS

- [ ] **5.14** Tenter d'appeler l'API d'un autre tenant
  ```bash
  # Dans le navigateur console
  fetch('/api/patients', {
    headers: { 'Authorization': 'Bearer [token-erp]' }
  })
  # Doit retourner 403 ou 404
  ```

### Tests Manuels - Scénario 4: Thèmes
- [ ] **5.15** Vérifier les couleurs par tenant
  - [ ] Health: Cyan (#0ea5e9) ✓
  - [ ] ERP: Purple (#8b5cf6) ✓
  - [ ] School: Amber (#f59e0b) ✓

- [ ] **5.16** Tester Dark/Light Mode
  - [ ] Light mode s'applique ✓
  - [ ] Dark mode s'applique ✓
  - [ ] Couleurs du tenant respectées ✓

- [ ] **5.17** Vérifier le logo
  - [ ] Logo s'affiche correctement ✓
  - [ ] Logo tenant-spécifique ✓

**Status Phase 5**: ⏳ EN COURS

---

## 📋 **PHASE 6: DÉPLOIEMENT (30-45 min)**

### Build Frontend
- [ ] **6.1** Compiler TypeScript
  ```bash
  npm run build
  ```

- [ ] **6.2** Vérifier qu'il n'y a pas d'erreurs
  - [ ] Pas d'erreurs de compilation
  - [ ] Pas de warnings critiques

- [ ] **6.3** Vérifier la taille du bundle
  ```bash
  # Doit être acceptable (< 5MB total)
  ls -lah dist/
  ```

### Préparation Déploiement Production
- [ ] **6.4** Passer en mode maintenance
  ```bash
  php artisan down
  ```

- [ ] **6.5** Vérifier que le site affiche "Under Maintenance"

### Déploiement DB
- [ ] **6.6** Exécuter les migrations avec --force
  ```bash
  php artisan migrate --force
  ```

- [ ] **6.7** Vérifier qu'aucune migration n'a échoué

### Optimisation Laravel
- [ ] **6.8** Rafraîchir les caches
  ```bash
  php artisan optimize
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  ```

### Déploiement Frontend
- [ ] **6.9** Copier dist/ vers public/
  ```bash
  cp -r dist/* public/
  ```

- [ ] **6.10** Vérifier que les fichiers sont en place
  ```bash
  ls -la public/index.html
  ls -la public/assets/
  ```

### Retour en Ligne
- [ ] **6.11** Sortir du mode maintenance
  ```bash
  php artisan up
  ```

- [ ] **6.12** Vérifier que le site est accessible

**Status Phase 6**: ⏳ EN COURS

---

## 📋 **PHASE 7: POST-DÉPLOIEMENT (1 h)**

### Validation Production
- [ ] **7.1** Accéder au site depuis un navigateur
  - [ ] Page login accessible ✓
  - [ ] Pas d'erreurs 500 ✓

- [ ] **7.2** Test de login
  - [ ] Connexion Health réussit ✓
  - [ ] Connexion ERP réussit ✓
  - [ ] Connexion School réussit ✓

- [ ] **7.3** Test d'isolation (même que phase 5)
  - [ ] Scénario 1 (données) ✓
  - [ ] Scénario 2 (modules) ✓
  - [ ] Scénario 3 (accès croisé) ✓

### Monitoring et Logs
- [ ] **7.4** Consulter les logs d'erreur
  ```bash
  tail -f storage/logs/laravel.log
  ```

- [ ] **7.5** Vérifier les logs de sécurité
  ```bash
  grep "Security Event\|unauthorized" storage/logs/laravel.log
  ```

- [ ] **7.6** Vérifier la performance
  - [ ] Temps de réponse API < 200ms ✓
  - [ ] Pas d'erreurs de timeout ✓

### Documentation et Handoff
- [ ] **7.7** Documenter les issues trouvées
  - [ ] Issue 1: ________________
  - [ ] Issue 2: ________________

- [ ] **7.8** Créer des tickets pour corrections
  - [ ] Ticket #1: ________________
  - [ ] Ticket #2: ________________

- [ ] **7.9** Former l'équipe support
  - [ ] Expliquer l'architecture ✓
  - [ ] Expliquer les logs ✓
  - [ ] Expliquer les erreurs communes ✓

- [ ] **7.10** Mettre à jour la documentation interne
  - [ ] Wiki/Confluence ✓
  - [ ] Runbooks ✓
  - [ ] Architecture diagrams ✓

### Rollback Plan (En Cas de Problème)
- [ ] **7.11** En cas de problème critique, rollback
  ```bash
  # 1. Revert la BD
  mysql kiam_saas < backup_DATE.sql
  
  # 2. Revert le code
  git revert HEAD
  
  # 3. Redémarrer
  php artisan up
  ```

**Status Phase 7**: ⏳ EN COURS

---

## 📋 **PROBLÈMES POTENTIELS ET SOLUTIONS**

| Problème | Symptôme | Solution |
|----------|----------|----------|
| Tenant ID manquant | "Tenant ID not found" | Vérifier JWT dans api/auth.php |
| Modules ne chargent pas | Console error | Vérifier tenant-modules.ts paths |
| "Unauthorized tenant access" | 403 Forbidden | C'est normal! Vérifier logs |
| Performance dégradée | Requêtes > 500ms | Ajouter index sur tenant_id |
| Dark mode ne s'applique pas | Couleurs wrong | Vérifier useTenantTheme appel |
| Données mélangées | Data leakage | Vérifier TenantIsolated trait |

---

## 📊 **RÉSUMÉ DU PROJET**

| Élément | Status |
|---------|--------|
| Durée estimée | 6-9 heures |
| Risque | Moyen (bien mitigé) |
| Complexité | Moyenne |
| Impact utilisateur | Positif (meilleure isolation + UX) |
| Retour sur investissement | Très bon |

---

## 🎯 **SIGNATURE**

**Développeur**: ________________  
**Date**: ________________  
**Approuvé par**: ________________  

---

**Notes Supplémentaires**:
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**Document Version**: 1.0  
**Dernière mise à jour**: Juin 2026  
**Status**: Production-Ready ✅
