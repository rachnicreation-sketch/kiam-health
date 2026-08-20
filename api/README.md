# API Kiam SaaS — Documentation Technique

## 1. Vue d'ensemble
L'API du SaaS Kiam est conçue sous forme de scripts PHP autonomes hébergés dans le dossier `/api/`. Elle est sécurisée par authentification JWT (JSON Web Tokens) transmise dans le header `Authorization: Bearer <token>`.

---

## 2. Endpoints d'infrastructure globale

### `auth.php`
Gère l'authentification globale et les redirections inter-tenants.
*   **POST `?action=login`**
    *   **Paramètres (JSON)** : `{ "username": "...", "password": "..." }`
    *   **Réponse** : `{ "status": "success", "token": "...", "user": { ... } }`

### `create_tenant.php`
Inscrit un nouveau locataire avec provisioning de base de données et chargement de données de démo par secteur (Hôtel, Santé, ERP, École, Stupéfiants, Entreprise).
*   **POST**
    *   **Paramètres (JSON)** : `{ "name": "Nom de l'entreprise", "sector": "hotel|health|erp|school|pharmacy|enterprise", "plan_id": "plan_standard", "admin_email": "admin@example.com" }`
    *   **Réponse** : `{ "status": "success", "tenant_id": "nomdelentreprise", "username": "admin" }`

---

## 3. Endpoints Plateforme Transverses

### `notifications.php`
Gère les alertes transversales par secteur (Restauration école, Housekeeping hôtel, Stupéfiants pharmacie, Tâches entreprise).
*   **GET**
    *   **Réponse** : Liste des notifications adaptées au secteur et au tenant.
*   **POST `?action=mark_read`**
    *   **Paramètres (JSON)** : `{ "notificationId": "..." }`

### `tenant_billing.php`
Gère la tarification et la facturation récurrente.
*   **POST `?action=pay_stripe` ou `?action=pay_mobile_money`**
    *   **Paramètres (JSON)** : `{ "plan_id": "...", "amount": 45000 }`
    *   **Réponse** : `{ "status": "success", "message": "Paiement réussi !", "subscription_id": "SUB-..." }`

---

## 4. Mode Diagnostics & Tests
Exécuter `php api/test_endpoints.php` en ligne de commande pour lancer l'audit automatisé de la base de données et valider la structure des tables.
