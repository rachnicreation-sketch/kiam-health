# Module ERP Complet - KIAM Caisse
## Documentation Complète d'Implémentation

### 📋 Vue d'Ensemble

Ce module ajoute un système ERP/Commerce complet au système KIAM Caisse avec les fonctionnalités suivantes :

1. **Gestion des Unités et Fractions de Produits**
2. **Gestion Avancée des Stocks et Inventaire**
3. **Module Approvisionnement/Achats**
4. **Comptabilité Conforme OHADA**
5. **Gestion des Clients et Ventes à Crédit**
6. **Gestion Documentaire Commerciale**
7. **Synchronisation Globale des Modules**

---

## 🚀 Installation et Configuration

### Étape 1 : Exécuter la Migration SQL

```bash
# Via phpMyAdmin ou en ligne de commande :
mysql -u root -p kiam_caisse < migrations/migration_phase3_erp_complete.sql
```

Ou via l'interface d'administration du système.

### Étape 2 : Vérifier les Tables Créées

Les tables suivantes doivent être créées :
- `product_units` - Unités de mesure
- `product_unit_fractions` - Fractions de produits
- `stock_movements` - Mouvements de stock
- `warehouses` - Entrepôts
- `stock_levels` - Niveaux actuels de stock
- `physical_inventories` - Inventaires physiques
- `inventory_items` - Articles d'inventaire
- `purchase_orders` - Commandes d'achat
- `purchase_order_details` - Détails des commandes
- `purchase_payments` - Paiements fournisseurs
- `accounting_chart` - Plan comptable
- `accounting_journal` - Journaux comptables
- `accounting_entries` - Écritures comptables
- `accounting_entry_lines` - Lignes d'écritures
- `accounting_balances` - Balances par période
- `credit_transactions` - Transactions de crédit client
- `credit_payment_schedule` - Plan de paiement
- `quotations` - Devis
- `quotation_items` - Articles de devis
- `invoices` - Factures
- `invoice_items` - Articles de factures
- `invoice_payments` - Paiements de factures
- `delivery_notes` - Bons de livraison
- `sync_logs` - Journal de synchronisation
- `audit_trail` - Piste d'audit

---

## 📱 Endpoints API

### 1. Unités et Fractions (`api/units_fractions.php`)

#### Récupérer les unités disponibles
```
GET /api/units_fractions.php?action=get_units
Response: { success: true, data: [...] }
```

#### Récupérer les fractions d'un produit
```
GET /api/units_fractions.php?action=get_unit_fractions&product_id=1
```

#### Ajouter une unité personnalisée
```
POST /api/units_fractions.php?action=add_unit
Body: {
  "code": "KG",
  "name": "Kilogramme",
  "abbreviation": "kg",
  "type": "base",
  "conversion_factor": 1
}
```

#### Ajouter une fraction de produit
```
POST /api/units_fractions.php?action=add_product_fraction
Body: {
  "product_id": 1,
  "unit_id": 2,
  "quantity": 500,
  "price_multiplier": 0.5,
  "display_name": "500g (1/2 kg)"
}
```

#### Calculer le prix pour une unité
```
GET /api/units_fractions.php?action=calculate_unit_price&product_id=1&unit_id=2&quantity=2
```

---

### 2. Gestion des Stocks (`api/stock_management.php`)

#### Créer un entrepôt
```
POST /api/stock_management.php?action=create_warehouse
Body: {
  "code": "ENT-PRINCIPALE",
  "name": "Entrepôt Principal",
  "is_main": true
}
```

#### Enregistrer un mouvement de stock
```
POST /api/stock_management.php?action=record_stock_movement
Body: {
  "product_id": 1,
  "movement_type": "entry",
  "quantity": 100,
  "unit_id": 1,
  "reason": "Achat fournisseur"
}
```

Types de mouvements : `entry`, `exit`, `transfer`, `adjustment`, `inventory`, `return`

#### Récupérer les niveaux de stock
```
GET /api/stock_management.php?action=get_stock_levels&warehouse_id=1
```

#### Obtenir les alertes de stock
```
GET /api/stock_management.php?action=get_stock_alerts
```

#### Créer un inventaire physique
```
POST /api/stock_management.php?action=create_physical_inventory
Body: {
  "warehouse_id": 1,
  "comments": "Inventaire mensuel"
}
```

#### Enregistrer un comptage d'inventaire
```
POST /api/stock_management.php?action=record_inventory_count
Body: {
  "inventory_item_id": 1,
  "counted_quantity": 95,
  "expected_quantity": 100,
  "variance_reason": "Casse"
}
```

#### Valider un inventaire
```
POST /api/stock_management.php?action=validate_inventory
Data: inventory_id=1
```

---

### 3. Achats et Approvisionnement (`api/purchase_management.php`)

#### Créer une commande d'achat
```
POST /api/purchase_management.php?action=create_purchase_order
Body: {
  "supplier_id": 1,
  "expected_delivery_date": "2026-06-15",
  "items": [
    {
      "product_id": 1,
      "quantity": 50,
      "unit_id": 1,
      "purchase_price": 100,
      "suggested_selling_price": 150,
      "brand": "Marque X",
      "color": "Noir",
      "pieces_count": 50
    }
  ]
}
```

#### Récupérer les commandes d'achat
```
GET /api/purchase_management.php?action=get_purchase_orders&status=pending
```

#### Mettre à jour le statut d'une commande
```
POST /api/purchase_management.php?action=update_po_status
Body: {
  "po_id": 1,
  "status": "received"
}
```

#### Enregistrer un paiement fournisseur
```
POST /api/purchase_management.php?action=record_purchase_payment
Body: {
  "purchase_order_id": 1,
  "amount": 5000,
  "payment_method": "bank_transfer",
  "payment_date": "2026-06-01"
}
```

Méthodes de paiement : `cash`, `credit`, `bank_transfer`, `check`, `mobile_money`, `other`

---

### 4. Comptabilité OHADA (`api/accounting.php`)

#### Récupérer le plan comptable
```
GET /api/accounting.php?action=get_accounting_chart&account_type=asset
```

#### Créer une écriture comptable
```
POST /api/accounting.php?action=create_entry
Body: {
  "journal_id": 1,
  "entry_date": "2026-06-01",
  "description": "Achat marchandises",
  "lines": [
    {
      "account_id": 10,
      "debit": 5000,
      "credit": 0,
      "description": "Achat"
    },
    {
      "account_id": 20,
      "debit": 0,
      "credit": 5000,
      "description": "Paiement"
    }
  ]
}
```

#### Valider une écriture
```
POST /api/accounting.php?action=validate_entry
Data: entry_id=1
```

#### Obtenir la balance générale
```
GET /api/accounting.php?action=get_trial_balance&period=2026-06
```

#### Obtenir le compte de résultat
```
GET /api/accounting.php?action=get_income_statement&period=2026-06
```

#### Obtenir le bilan
```
GET /api/accounting.php?action=get_balance_sheet&period=2026-06
```

---

### 5. Gestion des Clients et Crédits (`api/clients_credit.php`)

#### Configurer le crédit client
```
POST /api/clients_credit.php?action=setup_client_credit
Body: {
  "client_id": 1,
  "credit_limit": 50000,
  "credit_type": "both",
  "payment_terms": 30
}
```

#### Obtenir le compte client
```
GET /api/clients_credit.php?action=get_client_account&client_id=1
```

#### Enregistrer une vente à crédit
```
POST /api/clients_credit.php?action=record_credit_sale
Body: {
  "client_id": 1,
  "amount": 10000,
  "due_date": "2026-07-01",
  "reference_type": "invoice",
  "reference_id": 1
}
```

#### Enregistrer un paiement de crédit
```
POST /api/clients_credit.php?action=record_credit_payment
Body: {
  "client_id": 1,
  "amount": 5000,
  "payment_date": "2026-06-15",
  "description": "Paiement partiel"
}
```

#### Obtenir les comptes en arriéré
```
GET /api/clients_credit.php?action=get_overdue_accounts
```

#### Rapport des crédits
```
GET /api/clients_credit.php?action=get_credit_report
```

---

### 6. Documents Commerciaux (`api/commercial_documents.php`)

#### Créer un devis
```
POST /api/commercial_documents.php?action=create_quotation
Body: {
  "client_id": 1,
  "expiry_date": "2026-07-01",
  "items": [
    {
      "product_id": 1,
      "unit_id": 1,
      "quantity": 5,
      "unit_price": 1000
    }
  ]
}
```

#### Mettre à jour le statut d'un devis
```
POST /api/commercial_documents.php?action=update_quotation_status
Body: {
  "quotation_id": 1,
  "status": "sent"
}
```

#### Créer une facture
```
POST /api/commercial_documents.php?action=create_invoice
Body: {
  "client_id": 1,
  "sale_type": "credit",
  "items": [...]
}
```

#### Enregistrer un paiement de facture
```
POST /api/commercial_documents.php?action=record_invoice_payment
Body: {
  "invoice_id": 1,
  "payment_amount": 5000,
  "payment_date": "2026-06-15",
  "payment_method": "cash"
}
```

#### Récupérer les factures
```
GET /api/commercial_documents.php?action=get_invoices&status=paid&from_date=2026-06-01
```

---

### 7. Synchronisation (`api/sync_modules.php`)

#### Lancer la synchronisation
```
GET /api/sync_modules.php?action=sync_all
```

#### Obtenir le statut de synchronisation
```
GET /api/sync_modules.php?action=get_sync_status
```

---

## 🔄 Flux de Synchronisation

### Flux de Vente (Vente → Stock → Comptabilité)

```
1. Création facture
   ├→ Enregistrement articles
   ├→ Mouvements de stock (exit)
   └→ Écriture comptable (ventes)

2. Paiement facture
   ├→ Mise à jour statut facture
   ├→ Solde client
   └→ Écriture comptable (paiement)
```

### Flux d'Achat (Achat → Stock → Comptabilité)

```
1. Création commande d'achat
   ├→ Enregistrement articles
   └→ État : pending

2. Réception commande
   ├→ Mouvements de stock (entry)
   ├→ Mise à jour niveaux
   └→ État : received

3. Paiement fournisseur
   ├→ Mise à jour statut paiement
   └→ Écriture comptable
```

### Flux de Crédit Client

```
1. Vente à crédit
   ├→ Transaction de crédit
   ├→ Plan de paiement
   ├→ Solde client
   └→ Vérification limite

2. Paiement
   ├→ Mise à jour plan paiement
   ├→ Solde client
   └→ Déverrouillage si nécessaire
```

---

## 🔐 Sécurité et Contrôles

- **Authentification** : Toutes les API requièrent une session connectée
- **Autorisation** : Vérification des rôles utilisateur
- **Validation** : Validation des données en entrée
- **Audit** : Traçabilité complète dans `audit_trail`
- **Synchronisation** : Journal dans `sync_logs`

---

## 📊 Rapports Disponibles

1. **Stock** : Niveaux actuels, alertes, mouvements
2. **Finances** : Balance générale, compte de résultat, bilan
3. **Clients** : Comptes en arriéré, historique
4. **Fournisseurs** : Achats, historique, performance
5. **Documents** : Devis, factures, commandes, livraisons
6. **Inventaire** : Écarts, pertes, vols

---

## ✅ Checklist d'Implémentation

### Phase 1 : Structure (✅ Complétée)
- [x] Migration SQL complète
- [x] Tables créées et optimisées
- [x] Indexes pour performance

### Phase 2 : APIs (✅ Complétée)
- [x] API Unités/Fractions
- [x] API Stock Management
- [x] API Achats
- [x] API Comptabilité
- [x] API Clients/Crédit
- [x] API Documents Commerciaux
- [x] Module Synchronisation

### Phase 3 : Interfaces (⏳ À faire)
- [ ] Pages de gestion des unités
- [ ] Pages de gestion des stocks
- [ ] Pages de gestion des achats
- [ ] Pages de comptabilité
- [ ] Pages de gestion des clients
- [ ] Pages de documents commerciaux
- [ ] Tableaux de bord

### Phase 4 : Tests (⏳ À faire)
- [ ] Tests unitaires APIs
- [ ] Tests d'intégration
- [ ] Tests de synchronisation
- [ ] Tests de performance
- [ ] Tests de sécurité

---

## 🐛 Dépannage

### Erreur de synchronisation
```
Vérifier sync_logs pour les détails de l'erreur
SELECT * FROM sync_logs WHERE status = 'failed'
```

### Écarts de stock
```
Générer un rapport d'inventaire physique
Comparer avec les niveaux théoriques
```

### Problèmes de crédit
```
Vérifier la limite et le solde actuels
SELECT * FROM clients WHERE id = ?
Consulter l'historique de crédit
```

---

## 📞 Support

Pour les questions ou problèmes d'implémentation :
- Consultez la piste d'audit : `audit_trail`
- Consultez le journal de synchronisation : `sync_logs`
- Vérifiez les logs des erreurs PHP

---

**Développé pour KIAM Caisse - Module ERP Complet**
**Date : 2026-06-01**
**Version : 1.0**
