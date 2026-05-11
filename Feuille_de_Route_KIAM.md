# Feuille de Route (Roadmap) KIAM ERP - Matiaba Firm

Ce document décrit les modules et fonctionnalités à développer pour transformer KIAM d'un système de gestion de stock (WMS) en un ERP (Enterprise Resource Planning) complet et performant.

## 1. Module Commercial (Achats & Ventes)
Objectif : Gérer le cycle de vie complet des commandes fournisseurs et clients.
- **Bons de Commande (Fournisseurs)** : Création, validation et génération de PDF pour les achats de réapprovisionnement.
- **Bons de Livraison & Facturation (Clients)** : Création de bons de livraison lors de la sortie de stock et génération de factures (avec calcul de TVA si applicable).
- **Proformas (Devis)** : Génération de devis pour les clients potentiels avant facturation.
- **Circuit de validation** : Suivi du statut des documents (Brouillon -> En attente -> Validé -> Réceptionné/Livré -> Facturé).

## 2. Module de Trésorerie & Finances
Objectif : Suivre la santé financière globale de l'entreprise au-delà de la seule valorisation du stock.
- **Suivi des Flux de Trésorerie (Cashflow)** : Dashboard des entrées (ventes) et sorties (achats, charges) d'argent.
- **Gestion des Caisses et Comptes Bancaires** : Suivi des soldes par compte bancaire ou caisse physique, avec rapprochement.
- **Notes de Frais** : Interface permettant aux collaborateurs de soumettre leurs dépenses professionnelles pour remboursement.

## 3. Logistique Avancée & Mobilité
Objectif : Optimiser le travail physique dans l'entrepôt et assurer une traçabilité parfaite.
- **Application Mobile (PWA)** : Interface responsif optimisée pour mobile permettant d'utiliser l'appareil photo du smartphone comme lecteur de code-barres pour les inventaires, réceptions et expéditions.
- **Génération & Impression d'Étiquettes** : Module pour générer des planches d'étiquettes code-barres (format A4 ou imprimantes thermiques type Zebra) pour les articles et emplacements.
- **Traçabilité Avancée** :
  - *Gestion des Lots* : Suivi des articles par numéro de lot de fabrication.
  - *Dates de Péremption (DLC/DLUO)* : Alertes proactives pour les produits approchant de leur date d'expiration.
  - *Numéros de Série* : Suivi unitaire pour le matériel coûteux ou sous garantie.

## 4. Module Ressources Humaines (RH)
Objectif : Gérer les collaborateurs de Matiaba Firm accédant au système ou travaillant sur le terrain.
- **Dossier Employé** : Informations contractuelles, coordonnées, historique au sein de l'entreprise.
- **Gestion des Présences / Pointage** : Suivi des heures travaillées, particulièrement utile pour les agents de terrain ou magasiniers.
- **Gestion des Congés** : Demandes et validations des absences.

## 5. Intelligence d'Affaires (Business Intelligence & Reporting)
Objectif : Fournir des indicateurs de performance (KPI) pour la prise de décision stratégique.
- **Dashboards Personnalisés** : Tableaux de bord dynamiques (top ventes, top fournisseurs, rotation des stocks).
- **IA & Prévisions** : Algorithmes pour prédire les ruptures de stock futures en fonction de l'historique de consommation (vitesse d'écoulement).
- **Analyses de Rentabilité** : Calcul des marges réelles tenant compte des fluctuations des prix d'achat.

---
*Document généré pour Matiaba Firm.*
