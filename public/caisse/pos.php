<?php
/**
 * Interface de Caisse Immersive (POS) - KIAM Caisse
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';

// Protection : Caissiers, Managers et Admins autorisés
requireLogin();

// Récupérer les catégories pour les filtres
$categories = $pdo->query("SELECT * FROM categories ORDER BY name ASC")->fetchAll();

// Récupérer les clients pour le sélecteur
$clients = $pdo->query("SELECT * FROM clients ORDER BY name ASC")->fetchAll();

// Récupérer les paramètres par défaut (TVA et Devise)
$settingsStmt = $pdo->query("SELECT * FROM settings LIMIT 1");
$shopSettings = $settingsStmt->fetch();
$taxRate = $shopSettings['tax_rate'] ?? 18.00;
$currency = $shopSettings['currency'] ?? 'FCFA';
?>
<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Caisse - KIAM Caisse</title>
    <!-- Google Fonts Outfit -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Styles Globaux + POS + Impression -->
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/pos.css">
    <link rel="stylesheet" href="assets/css/receipt.css">
    
    <script>
        (function() {
            const savedTheme = localStorage.getItem('kiam_theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', theme);
        })();
    </script>
</head>
<body>

<div class="pos-container">
    <!-- 1. En-tête de la Caisse -->
    <header class="pos-header">
        <div class="pos-logo">
            <svg viewBox="0 0 24 24" width="28" height="28" style="color: var(--accent); fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;">
                <rect x="2" y="4" width="20" height="8" rx="2" ry="2"></rect>
                <path d="M6 12v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"></path>
                <circle cx="12" cy="20" r="1"></circle>
            </svg>
            <h1>KIAM<span>Caisse</span></h1>
        </div>

        <div class="pos-session-info">
            <span class="status-dot"></span>
            <span>Caissier actif : <strong><?php echo htmlspecialchars($_SESSION['user_name']); ?></strong></span>
        </div>

        <div class="pos-header-actions">
            <!-- Bascule Thème -->
            <button class="navbar-btn" id="theme-toggle" title="Changer le thème">
                <!-- Injecté en JS -->
            </button>
            <!-- Bouton Clôturer la caisse -->
            <button class="btn btn-danger" id="btn-close-session" onclick="openCloseSessionModal()" style="padding: 8px 16px; display: none;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Clôturer la Caisse
            </button>
            <!-- Bouton Retour Tableau de bord -->
            <a href="index.php" class="btn btn-secondary" style="padding: 8px 16px;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Quitter la Caisse
            </a>
        </div>
    </header>

    <!-- 2. Corps Principal -->
    <div class="pos-body">
        
        <!-- Section Catalogue Produits (Gauche) -->
        <section class="pos-catalog">
            
            <!-- Barre de Recherche & Code-barres -->
            <div class="catalog-search-row">
                <div class="search-input-wrapper">
                    <svg viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" id="pos-search" placeholder="Rechercher par nom ou scanner un code-barres..." autofocus>
                </div>
                
                <div class="barcode-badge">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 5v14M6 5v14M10 5v14M14 5v14M17 5v14M21 5v14"></path>
                    </svg>
                    <span>Lecteur Actif</span>
                </div>
            </div>

            <!-- Curseur de Catégories -->
            <div class="category-slider">
                <div class="category-pill active" data-id="0">Tous les produits</div>
                <?php foreach ($categories as $cat): ?>
                    <div class="category-pill" data-id="<?php echo $cat['id']; ?>">
                        <?php echo htmlspecialchars($cat['name']); ?>
                    </div>
                <?php endforeach; ?>
            </div>

            <!-- Grille des Produits Remplie en AJAX -->
            <div class="products-grid" id="pos-products-grid">
                <!-- Généré en JS -->
            </div>
            
        </section>

        <!-- Section Panier Caisse (Droite) -->
        <section class="pos-cart">
            
            <!-- Sélecteur de Client -->
            <div class="cart-client-bar">
                <select id="pos-client-select">
                    <option value="1">Client de Passage (Standard)</option>
                    <?php foreach ($clients as $cli): if ($cli['id'] == 1) continue; ?>
                        <option value="<?php echo $cli['id']; ?>">
                            <?php echo htmlspecialchars($cli['name']); ?> <?php echo $cli['phone'] ? '('.$cli['phone'].')' : ''; ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <button class="btn btn-primary" onclick="openModal('addClientModal')" title="Ajouter un client à la volée" style="padding: 8px 12px; border-radius: var(--border-radius-sm);">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>

            <!-- Liste des Produits Choisis -->
            <div class="cart-items-wrapper" id="pos-cart-items">
                <!-- Rempli dynamiquement en JS ou état Vide -->
                <div class="cart-empty-state">
                    <svg viewBox="0 0 24 24">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h3>Votre panier est vide</h3>
                    <p>Cliquez sur un produit du catalogue à gauche ou scannez un article pour l'ajouter à la caisse.</p>
                </div>
            </div>

            <!-- Sommaire Financier (Taxes, Remises) -->
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Sous-Total Brut :</span>
                    <span class="val" id="summary-brut">0 FCFA</span>
                </div>
                <div class="summary-row" style="align-items: center;">
                    <span>Remise de Caisse :</span>
                    <input type="number" id="pos-discount-input" min="0" value="0" style="width: 80px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); text-align: right;" onchange="updateCartCalculations()">
                </div>
                <div class="summary-row">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-secondary); font-size: 0.95rem;">
                        <input type="checkbox" id="apply-tva" checked onchange="updateCartCalculations()" style="accent-color: var(--erp-primary); width: 16px; height: 16px;"> TVA (<?php echo $taxRate; ?>%)
                    </label>
                    <span class="val" id="summary-tax">0 FCFA</span>
                </div>
                <div class="summary-row">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-secondary); font-size: 0.95rem;">
                        <input type="checkbox" id="apply-css" checked onchange="updateCartCalculations()" style="accent-color: var(--erp-primary); width: 16px; height: 16px;"> CSS/CA (5%)
                    </label>
                    <span class="val" id="summary-css">0 FCFA</span>
                </div>
                <div class="summary-row total-payable">
                    <span>Total Net :</span>
                    <span class="val" id="summary-net">0 FCFA</span>
                </div>
            </div>

            <!-- Action Finale de Paiement -->
            <div class="cart-actions">
                <button class="btn btn-success" id="btn-trigger-checkout" onclick="openCheckoutModal()">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    Valider le Paiement (F9)
                </button>
            </div>
            
        </section>
    </div>
</div>

<!-- ==========================================================================
     MODALS POPUPS
     ========================================================================== -->

<!-- 1. Modal Validation du Paiement & Rendu Monnaie -->
<div class="modal" id="checkoutModal">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h3>Paiement & Rendu de Monnaie</h3>
            <button class="modal-close">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        
        <div class="modal-body">
            <!-- Méthode de paiement -->
            <label class="form-label">Mode de Paiement</label>
            <div class="payment-methods-grid">
                <div class="payment-method-card active" data-method="cash">
                    <svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                    <span>Espèces</span>
                </div>
                <div class="payment-method-card" data-method="mobile_money">
                    <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                    <span>Mobile Money</span>
                </div>
                <div class="payment-method-card" data-method="card">
                    <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                    <span>Carte Bancaire</span>
                </div>
            </div>

            <!-- Calculateur Rendu -->
            <div class="checkout-calc-panel">
                <div class="calc-net-row">
                    <span>Total Net à Payer :</span>
                    <span class="val" id="calc-net-to-pay">0 FCFA</span>
                </div>
                
                <div class="form-group" style="margin-top: 15px;">
                    <label class="form-label">Montant Reçu du Client</label>
                    <input type="number" class="form-control" id="cash-tendered-input" style="font-size: 1.4rem; font-weight: 700; text-align: right;" oninput="calculateChange()">
                </div>

                <!-- Raccourcis billets courants -->
                <div style="display: flex; gap: 8px; margin-bottom: 15px;" id="quick-cash-buttons">
                    <!-- Rempli dynamiquement en fonction du total net -->
                </div>

                <div class="calc-change-row">
                    <span>Monnaie à Rendre :</span>
                    <span class="val" id="calc-change-due">0 FCFA</span>
                </div>
            </div>
            
            <button class="btn btn-success" style="width: 100%; padding: 14px; font-size: 1.1rem; justify-content: center;" onclick="submitCheckout()">
                Confirmer la Vente & Imprimer le Ticket
            </button>
        </div>
    </div>
</div>

<!-- 2. Modal Ticket de Caisse Imprimable (Aperçu) -->
<div class="modal" id="receiptModal">
    <div class="modal-content" style="max-width: 90mm; padding: 15px;">
        <div class="modal-header" style="border: none; padding-bottom: 0; margin-bottom: 10px;">
            <h3>Aperçu du Ticket</h3>
            <button class="modal-close" onclick="closeModal('receiptModal')">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        
        <div class="modal-body" style="padding: 0;">
            <!-- Conteneur d'Aperçu du reçu thermique -->
            <div class="receipt-preview-container">
                <div class="ticket printable-ticket" id="thermal-receipt-content">
                    <!-- Rempli dynamiquement par JS -->
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn btn-secondary" style="flex-grow: 1; justify-content: center;" onclick="closeModal('receiptModal')">
                    Fermer (Échap)
                </button>
                <button class="btn btn-primary" style="flex-grow: 1; justify-content: center;" onclick="window.print()">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Imprimer (Ctrl+P)
                </button>
            </div>
        </div>
    </div>
</div>

<!-- 3. Modal Création de Client rapide -->
<div class="modal" id="addClientModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Ajouter un Client</h3>
            <button class="modal-close">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        
        <div class="modal-body">
            <form id="add-client-form" onsubmit="submitQuickClient(event)">
                <div class="form-group">
                    <label class="form-label" for="new-client-name">Nom complet *</label>
                    <input class="form-control" type="text" id="new-client-name" required placeholder="Ex: Khady Ndiaye">
                </div>
                <div class="form-group">
                    <label class="form-label" for="new-client-phone">Téléphone</label>
                    <input class="form-control" type="text" id="new-client-phone" placeholder="Ex: +221 77 000 00 00">
                </div>
                <div class="form-group">
                    <label class="form-label" for="new-client-address">Adresse</label>
                    <input class="form-control" type="text" id="new-client-address" placeholder="Ex: Grand Yoff, Dakar">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px; margin-top: 10px;">
                    Enregistrer le Client
                </button>
            </form>
        </div>
    </div>
</div>

<!-- 4. Modal d'Ouverture de Caisse (Fond de caisse) -->
<div class="modal" id="openSessionModal" style="backdrop-filter: blur(15px);">
    <div class="modal-content" style="max-width: 450px; margin-top: 10%;">
        <div class="modal-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
            <h3 style="display: flex; align-items: center; gap: 10px;">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--accent)" stroke-width="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
                Ouverture de Caisse
            </h3>
        </div>
        <div class="modal-body" style="padding-top: 20px;">
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.95rem;">
                Avant de pouvoir enregistrer des ventes, veuillez ouvrir votre tiroir-caisse en indiquant le montant du fond de caisse initial (pour le rendu de monnaie).
            </p>
            <form id="open-session-form" onsubmit="submitOpenSession(event)">
                <div class="form-group">
                    <label class="form-label" for="opening-balance-input">Fond de caisse initial (FCFA) *</label>
                    <input class="form-control" type="number" id="opening-balance-input" min="0" required value="5000" style="font-size: 1.4rem; font-weight: 700; text-align: right; color: var(--accent);">
                </div>
                <div class="form-group">
                    <label class="form-label" for="opening-notes-input">Notes d'ouverture (Optionnel)</label>
                    <textarea class="form-control" id="opening-notes-input" placeholder="Ex: Billets de 1000 et 2000 FCFA uniquement..." rows="2"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-size: 1.1rem; margin-top: 15px;">
                    Valider l'Ouverture & Démarrer
                </button>
            </form>
        </div>
    </div>
</div>

<!-- 5. Modal de Clôture de Caisse -->
<div class="modal" id="closeSessionModal">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h3 style="display: flex; align-items: center; gap: 10px;">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--danger)" stroke-width="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Clôture de Session de Caisse
            </h3>
            <button class="modal-close" onclick="closeModal('closeSessionModal')">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div class="modal-body" style="padding-top: 15px;">
            <div id="close-session-summary" style="margin-bottom: 20px;">
                <!-- Rempli en AJAX -->
            </div>
            
            <form id="close-session-form" onsubmit="submitCloseSession(event)">
                <div class="form-group">
                    <label class="form-label" for="actual-balance-input">Montant Réel en Espèces Compté (FCFA) *</label>
                    <input class="form-control" type="number" id="actual-balance-input" min="0" required placeholder="Saisir le montant physique du tiroir-caisse" style="font-size: 1.4rem; font-weight: 700; text-align: right; color: var(--success);" oninput="calculateClosingDifference()">
                </div>
                
                <div class="calc-change-row" style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <span>Écart de caisse :</span>
                    <span class="val" id="closing-difference-display" style="font-weight: 700;">0 FCFA</span>
                </div>

                <div class="form-group">
                    <label class="form-label" for="closing-notes-input">Notes de clôture (Optionnel)</label>
                    <textarea class="form-control" id="closing-notes-input" placeholder="Explication de l'écart si applicable..." rows="2"></textarea>
                </div>
                
                <button type="submit" class="btn btn-danger" style="width: 100%; justify-content: center; padding: 14px; font-size: 1.1rem;">
                    Valider la Clôture de la Caisse
                </button>
            </form>
        </div>
    </div>
</div>

<!-- 6. Modal Ticket Z-Report de Clôture -->
<div class="modal" id="zReportModal">
    <div class="modal-content" style="max-width: 90mm; padding: 15px;">
        <div class="modal-header" style="border: none; padding-bottom: 0; margin-bottom: 10px;">
            <h3>Aperçu du Rapport Z</h3>
            <button class="modal-close" onclick="closeModal('zReportModal'); window.location.href='index.php';">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        
        <div class="modal-body" style="padding: 0;">
            <div class="receipt-preview-container">
                <div class="ticket printable-ticket" id="zreport-receipt-content">
                    <!-- Rempli dynamiquement par JS -->
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn btn-secondary" style="flex-grow: 1; justify-content: center;" onclick="closeModal('zReportModal'); window.location.href='index.php';">
                    Fermer & Quitter
                </button>
                <button class="btn btn-primary" style="flex-grow: 1; justify-content: center;" onclick="printZReport()">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Imprimer (Ctrl+P)
                </button>
            </div>
        </div>
    </div>
</div>

<!-- 7. Modal Sélection de Quantité (Fractionnement) -->
<div class="modal" id="quantityModal">
    <div class="modal-content" style="max-width: 450px;">
        <div class="modal-header">
            <h3 id="qty-modal-title">Sélectionner la Quantité</h3>
            <button class="modal-close" onclick="closeModal('quantityModal')">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        
        <div class="modal-body">
            <div style="text-align: center; margin-bottom: 20px;">
                <p id="qty-modal-price" style="font-size: 1.3rem; font-weight: 700; color: var(--accent); margin: 0;">0 FCFA</p>
                <p id="qty-modal-stock" style="color: var(--text-secondary); margin: 5px 0 0 0;">Stock disponible: 0</p>
            </div>

            <!-- Boutons Rapides de Quantité -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px;">
                <button type="button" class="qty-preset-btn" data-qty="0.25" onclick="selectQuantity(0.25)">
                    <span style="font-size: 0.8rem;">1/4</span>
                    <span style="font-weight: 700; display: block;">0.25</span>
                </button>
                <button type="button" class="qty-preset-btn" data-qty="0.50" onclick="selectQuantity(0.50)">
                    <span style="font-size: 0.8rem;">1/2</span>
                    <span style="font-weight: 700; display: block;">0.50</span>
                </button>
                <button type="button" class="qty-preset-btn" data-qty="1" onclick="selectQuantity(1)">
                    <span style="font-weight: 700;">1</span>
                </button>
                <button type="button" class="qty-preset-btn" data-qty="2" onclick="selectQuantity(2)">
                    <span style="font-weight: 700;">2</span>
                </button>
                <button type="button" class="qty-preset-btn" data-qty="3" onclick="selectQuantity(3)">
                    <span style="font-weight: 700;">3</span>
                </button>
                <button type="button" class="qty-preset-btn" data-qty="4" onclick="selectQuantity(4)">
                    <span style="font-weight: 700;">4</span>
                </button>
                <button type="button" class="qty-preset-btn" data-qty="5" onclick="selectQuantity(5)">
                    <span style="font-weight: 700;">5</span>
                </button>
                <button type="button" class="qty-preset-btn" data-qty="10" onclick="selectQuantity(10)">
                    <span style="font-weight: 700;">10</span>
                </button>
            </div>

            <!-- Saisie Personnalisée -->
            <div style="display: flex; gap: 10px;">
                <input type="number" id="custom-qty-input" class="form-control" placeholder="Quantité personnalisée" min="0.01" step="0.01" style="flex-grow: 1;">
                <button type="button" class="btn btn-primary" onclick="submitCustomQuantity()" style="padding: 10px 20px;">
                    Ajouter
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Scripts globaux de la caisse -->
<script src="assets/js/main.js"></script>
<script>
    // Variables globales de taxe configurées par le backend PHP
    const TAX_RATE = <?php echo $taxRate; ?>;
    const SHOP_CURRENCY = '<?php echo $currency; ?>';
</script>
<script src="assets/js/pos.js"></script>

</body>
</html>
