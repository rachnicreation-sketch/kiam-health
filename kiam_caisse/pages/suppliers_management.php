<?php
/**
 * Page Gestion des Fournisseurs
 * Module d'Approvisionnement / Achats - Phase 1
 */

require_once '../config/auth.php';
require_once '../config/db.php';

// Vérifier les permissions (admin ou gestionnaire achat)
// À adapter selon votre système de permissions
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Fournisseurs - KIAM Caisse</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <link rel="stylesheet" href="../assets/css/erp.css">
    <style>
        /* Styles spécifiques pour la gestion fournisseurs */
        .suppliers-container {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 20px;
            height: calc(100vh - 100px);
        }

        .suppliers-sidebar {
            background: var(--bg-secondary);
            border-radius: var(--border-radius-md);
            padding: 15px;
            overflow-y: auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .suppliers-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .suppliers-list li {
            margin-bottom: 8px;
        }

        .supplier-item {
            padding: 10px 12px;
            border-radius: var(--border-radius-sm);
            cursor: pointer;
            transition: all 0.2s;
            border-left: 3px solid transparent;
        }

        .supplier-item:hover {
            background-color: var(--accent-light);
            border-left-color: var(--accent);
        }

        .supplier-item.active {
            background-color: var(--accent-light);
            border-left-color: var(--accent);
            color: var(--accent);
            font-weight: 600;
        }

        .supplier-item-name {
            font-weight: 600;
            font-size: 0.9rem;
        }

        .supplier-item-meta {
            font-size: 0.75rem;
            color: var(--text-tertiary);
            margin-top: 4px;
        }

        .suppliers-main {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .suppliers-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            background: var(--bg-secondary);
            padding: 12px;
            border-radius: var(--border-radius-md);
        }

        .search-box {
            flex: 1;
            max-width: 300px;
        }

        .search-box input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-sm);
            background: var(--bg-primary);
            color: var(--text-primary);
        }

        .suppliers-detail {
            background: var(--bg-secondary);
            border-radius: var(--border-radius-md);
            padding: 20px;
            overflow-y: auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--border-color);
        }

        .supplier-name {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
        }

        .supplier-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .supplier-status.active {
            background: rgba(26, 173, 26, 0.2);
            color: #1aad1a;
        }

        .supplier-status.inactive {
            background: rgba(168, 85, 247, 0.2);
            color: #a855f7;
        }

        .supplier-status.suspended {
            background: rgba(255, 107, 107, 0.2);
            color: #ff6b6b;
        }

        .detail-section {
            margin-bottom: 25px;
        }

        .section-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--accent-light);
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }

        .info-group {
            display: flex;
            flex-direction: column;
        }

        .info-label {
            font-size: 0.85rem;
            color: var(--text-secondary);
            font-weight: 600;
            margin-bottom: 4px;
        }

        .info-value {
            font-size: 0.95rem;
            color: var(--text-primary);
            word-break: break-word;
        }

        .info-value.highlight {
            color: var(--accent);
            font-weight: 600;
        }

        .tabs {
            display: flex;
            gap: 10px;
            border-bottom: 2px solid var(--border-color);
            margin-bottom: 15px;
        }

        .tab {
            padding: 10px 15px;
            border: none;
            background: none;
            cursor: pointer;
            color: var(--text-secondary);
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            transition: all 0.2s;
        }

        .tab:hover {
            color: var(--text-primary);
        }

        .tab.active {
            color: var(--accent);
            border-bottom-color: var(--accent);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .contacts-list, .products-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .contact-item, .product-item {
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-sm);
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .contact-item-info, .product-item-info {
            flex: 1;
        }

        .contact-name, .product-name {
            font-weight: 600;
            color: var(--text-primary);
        }

        .contact-detail, .product-detail {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-top: 3px;
        }

        .btn-group {
            display: flex;
            gap: 8px;
        }

        .btn-small {
            padding: 6px 10px;
            font-size: 0.85rem;
            border-radius: var(--border-radius-sm);
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-edit {
            background: var(--accent-light);
            color: var(--accent);
        }

        .btn-delete {
            background: rgba(255, 107, 107, 0.1);
            color: #ff6b6b;
        }

        .btn-primary {
            background: var(--accent);
            color: white;
            padding: 10px 15px;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-tertiary);
        }

        .empty-state svg {
            width: 64px;
            height: 64px;
            margin-bottom: 15px;
            opacity: 0.5;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: var(--bg-primary);
            border-radius: var(--border-radius-md);
            padding: 25px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }

        .modal-header {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 20px;
            color: var(--text-primary);
        }

        .form-group {
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
        }

        .form-label {
            font-weight: 600;
            margin-bottom: 5px;
            color: var(--text-primary);
        }

        .form-input, .form-select, .form-textarea {
            padding: 10px;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-sm);
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-family: inherit;
        }

        .form-textarea {
            resize: vertical;
            min-height: 80px;
        }

        .rating-input {
            display: flex;
            gap: 5px;
            font-size: 1.5rem;
        }

        .rating-input .star {
            cursor: pointer;
            color: #ddd;
            transition: color 0.2s;
        }

        .rating-input .star:hover,
        .rating-input .star.active {
            color: #ffc107;
        }

        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: var(--bg-tertiary);
            padding: 15px;
            border-radius: var(--border-radius-md);
            text-align: center;
            border-left: 3px solid var(--accent);
        }

        .stat-value {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--accent);
        }

        .stat-label {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-top: 5px;
        }

        @media (max-width: 1200px) {
            .suppliers-container {
                grid-template-columns: 1fr;
            }

            .suppliers-sidebar {
                max-height: 300px;
            }

            .info-grid {
                grid-template-columns: 1fr;
            }

            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="erp-container">
        <!-- Header -->
        <div class="topbar">
            <div class="topbar-left">
                <h2>📦 Gestion des Fournisseurs</h2>
            </div>
            <div class="topbar-right">
                <button class="btn btn-primary" onclick="openAddSupplierModal()">+ Nouveau Fournisseur</button>
            </div>
        </div>

        <!-- Main Content -->
        <div class="content">
            <div class="suppliers-container">
                <!-- Sidebar - Liste Fournisseurs -->
                <div class="suppliers-sidebar">
                    <div class="suppliers-toolbar" style="grid-column: 1; margin-bottom: 10px;">
                        <div class="search-box">
                            <input type="text" id="searchInput" placeholder="Chercher..." onkeyup="filterSuppliers()">
                        </div>
                        <select id="statusFilter" onchange="loadSuppliers()" style="padding: 8px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); background: var(--bg-primary); color: var(--text-primary);">
                            <option value="">Tous</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                            <option value="suspended">Suspendus</option>
                        </select>
                    </div>

                    <ul class="suppliers-list" id="suppliersList">
                        <li class="empty-state" style="grid-column: 1;">
                            <p>Chargement...</p>
                        </li>
                    </ul>
                </div>

                <!-- Main - Détail Fournisseur -->
                <div class="suppliers-main">
                    <div class="suppliers-detail" id="detailPanel">
                        <div class="empty-state">
                            <svg fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                            </svg>
                            <p>Sélectionnez un fournisseur pour voir les détails</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Ajouter/Modifier Fournisseur -->
    <div class="modal" id="supplierModal">
        <div class="modal-content">
            <div class="modal-header" id="modalTitle">Nouveau Fournisseur</div>
            
            <form id="supplierForm" onsubmit="saveSupplier(event)">
                <div class="form-group">
                    <label class="form-label">Nom du fournisseur *</label>
                    <input type="text" id="supplierName" class="form-input" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Raison Sociale</label>
                    <input type="text" id="supplierCompany" class="form-input">
                </div>

                <div class="info-grid" style="margin-bottom: 15px;">
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" id="supplierEmail" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Téléphone</label>
                        <input type="tel" id="supplierPhone" class="form-input">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Adresse</label>
                    <input type="text" id="supplierAddress" class="form-input">
                </div>

                <div class="info-grid" style="margin-bottom: 15px;">
                    <div class="form-group">
                        <label class="form-label">RCCM</label>
                        <input type="text" id="supplierRCCM" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">NIU (Fiscal)</label>
                        <input type="text" id="supplierNIU" class="form-input">
                    </div>
                </div>

                <div class="info-grid" style="margin-bottom: 15px;">
                    <div class="form-group">
                        <label class="form-label">Délai livraison (jours)</label>
                        <input type="number" id="supplierLeadTime" class="form-input" value="5" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Conditions paiement</label>
                        <select id="supplierPaymentTerms" class="form-select">
                            <option value="immediate">Immédiat</option>
                            <option value="net_7">Net 7 jours</option>
                            <option value="net_15">Net 15 jours</option>
                            <option value="net_30" selected>Net 30 jours</option>
                            <option value="net_60">Net 60 jours</option>
                            <option value="consignment">Consignation</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Statut</label>
                    <select id="supplierStatus" class="form-select">
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="suspended">Suspendu</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea id="supplierNotes" class="form-textarea"></textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn" onclick="closeSupplierModal()">Annuler</button>
                    <button type="submit" class="btn btn-primary">Enregistrer</button>
                </div>
            </form>
        </div>
    </div>

    <script src="../assets/js/main.js"></script>
    <script>
        let currentSupplierId = null;
        let suppliersData = [];

        // Charger la liste des fournisseurs
        async function loadSuppliers() {
            try {
                const status = document.getElementById('statusFilter').value;
                const url = `../api/suppliers.php?action=list${status ? '&status=' + status : ''}`;
                
                const response = await fetch(url);
                const result = await response.json();
                
                if (!result.success) throw new Error(result.error);
                
                suppliersData = result.data;
                displaySuppliersList();
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur: ' + error.message, 'danger');
            }
        }

        // Afficher la liste des fournisseurs
        function displaySuppliersList() {
            const list = document.getElementById('suppliersList');
            
            if (suppliersData.length === 0) {
                list.innerHTML = '<li class="empty-state"><p>Aucun fournisseur</p></li>';
                return;
            }
            
            list.innerHTML = suppliersData.map(supplier => `
                <li>
                    <div class="supplier-item ${currentSupplierId === supplier.id ? 'active' : ''}" 
                         onclick="selectSupplier(${supplier.id})">
                        <div class="supplier-item-name">${supplier.name}</div>
                        <div class="supplier-item-meta">
                            ${supplier.product_count || 0} produits • Rating: ${(parseFloat(supplier.rating) || 0).toFixed(1)}/5
                        </div>
                    </div>
                </li>
            `).join('');
            
            // Charger le détail du premier si aucun sélectionné
            if (!currentSupplierId && suppliersData.length > 0) {
                selectSupplier(suppliersData[0].id);
            }
        }

        // Sélectionner et afficher détail fournisseur
        async function selectSupplier(supplierId) {
            currentSupplierId = supplierId;
            
            try {
                const response = await fetch(`../api/suppliers.php?id=${supplierId}`);
                const result = await response.json();
                
                if (!result.success) throw new Error(result.error);
                
                const supplier = result.data;
                displaySupplierDetail(supplier);
                displaySuppliersList(); // Refresh list
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur: ' + error.message, 'danger');
            }
        }

        // Afficher le détail du fournisseur
        function displaySupplierDetail(supplier) {
            const detailPanel = document.getElementById('detailPanel');
            
            const statusClass = {
                'active': 'active',
                'inactive': 'inactive',
                'suspended': 'suspended'
            }[supplier.status] || '';
            
            const statusText = {
                'active': '✅ Actif',
                'inactive': '⏸️  Inactif',
                'suspended': '🚫 Suspendu'
            }[supplier.status] || '';
            
            detailPanel.innerHTML = `
                <div class="detail-header">
                    <div>
                        <div class="supplier-name">${supplier.name}</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 5px;">
                            ${supplier.company_name || 'N/A'}
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <span class="supplier-status ${statusClass}">${statusText}</span>
                        <button class="btn btn-small btn-edit" onclick="editSupplier(${supplier.id})">✏️</button>
                        <button class="btn btn-small btn-delete" onclick="deleteSupplier(${supplier.id})">🗑️</button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${supplier.product_count || 0}</div>
                        <div class="stat-label">Produits</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${supplier.contact_count || 0}</div>
                        <div class="stat-label">Contacts</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${supplier.total_orders || 0}</div>
                        <div class="stat-label">Commandes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${(parseFloat(supplier.rating) || 0).toFixed(1)}</div>
                        <div class="stat-label">Note /5</div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title">Informations Générales</div>
                    <div class="info-grid">
                        <div class="info-group">
                            <div class="info-label">Email</div>
                            <div class="info-value">${supplier.email || 'N/A'}</div>
                        </div>
                        <div class="info-group">
                            <div class="info-label">Téléphone</div>
                            <div class="info-value">${supplier.phone || 'N/A'}</div>
                        </div>
                        <div class="info-group">
                            <div class="info-label">Adresse</div>
                            <div class="info-value">${supplier.address || 'N/A'}</div>
                        </div>
                        <div class="info-group">
                            <div class="info-label">Contact Principal</div>
                            <div class="info-value">${supplier.contact_person || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title">Paramètres Commerciaux</div>
                    <div class="info-grid">
                        <div class="info-group">
                            <div class="info-label">Délai Livraison</div>
                            <div class="info-value highlight">${supplier.delivery_lead_time_days || 0} jours</div>
                        </div>
                        <div class="info-group">
                            <div class="info-label">Conditions Paiement</div>
                            <div class="info-value">${supplier.payment_terms || 'N/A'}</div>
                        </div>
                        <div class="info-group">
                            <div class="info-label">Montant Total Acheté</div>
                            <div class="info-value highlight">${formatCurrency(supplier.total_purchases || 0)}</div>
                        </div>
                        <div class="info-group">
                            <div class="info-label">Dernier Achat</div>
                            <div class="info-value">${supplier.last_purchase_date || 'Jamais'}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title">Identifiants Fiscaux</div>
                    <div class="info-grid">
                        <div class="info-group">
                            <div class="info-label">RCCM</div>
                            <div class="info-value">${supplier.rccm || 'N/A'}</div>
                        </div>
                        <div class="info-group">
                            <div class="info-label">NIU</div>
                            <div class="info-value">${supplier.niu || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                ${supplier.notes ? `
                <div class="detail-section">
                    <div class="section-title">Notes</div>
                    <div style="padding: 10px; background: var(--bg-tertiary); border-radius: var(--border-radius-sm);">
                        ${supplier.notes}
                    </div>
                </div>
                ` : ''}

                <div class="tabs">
                    <button class="tab active" onclick="showTab('contacts')">Contacts (${supplier.contact_count || 0})</button>
                    <button class="tab" onclick="showTab('products')">Produits (${supplier.product_count || 0})</button>
                </div>

                <div id="contactsTab" class="tab-content active">
                    ${supplier.contacts && supplier.contacts.length > 0 ? `
                        <ul class="contacts-list">
                            ${supplier.contacts.map(contact => `
                                <li class="contact-item">
                                    <div class="contact-item-info">
                                        <div class="contact-name">
                                            ${contact.name}
                                            ${contact.is_primary ? ' <span style="color: var(--accent); font-weight: 600;">[Principal]</span>' : ''}
                                        </div>
                                        <div class="contact-detail">${contact.phone} • ${contact.email || 'N/A'}</div>
                                        ${contact.title ? `<div class="contact-detail">${contact.title}</div>` : ''}
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<div class="empty-state"><p>Aucun contact</p></div>'}
                    <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="openAddContactModal(${supplier.id})">+ Ajouter Contact</button>
                </div>

                <div id="productsTab" class="tab-content">
                    ${supplier.products && supplier.products.length > 0 ? `
                        <ul class="products-list">
                            ${supplier.products.map(product => `
                                <li class="product-item">
                                    <div class="product-item-info">
                                        <div class="product-name">${product.product_name}</div>
                                        <div class="product-detail">
                                            Prix: ${formatCurrency(product.purchase_price)} • Marge: ${product.margin_percent.toFixed(1)}%
                                        </div>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<div class="empty-state"><p>Aucun produit</p></div>'}
                    <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="openAddProductModal(${supplier.id})">+ Ajouter Produit</button>
                </div>
            `;
        }

        // Filtrer les fournisseurs
        function filterSuppliers() {
            const search = document.getElementById('searchInput').value.toLowerCase();
            const items = document.querySelectorAll('.supplier-item');
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.closest('li').style.display = text.includes(search) ? '' : 'none';
            });
        }

        // Ouvrir modal nouveau fournisseur
        function openAddSupplierModal() {
            document.getElementById('modalTitle').textContent = 'Nouveau Fournisseur';
            document.getElementById('supplierForm').reset();
            document.getElementById('supplierName').focus();
            openModal('supplierModal');
        }

        // Modifier fournisseur
        async function editSupplier(id) {
            try {
                const response = await fetch(`../api/suppliers.php?id=${id}`);
                const result = await response.json();
                
                if (!result.success) throw new Error(result.error);
                
                const supplier = result.data;
                
                document.getElementById('modalTitle').textContent = 'Modifier Fournisseur';
                document.getElementById('supplierName').value = supplier.name;
                document.getElementById('supplierCompany').value = supplier.company_name || '';
                document.getElementById('supplierEmail').value = supplier.email;
                document.getElementById('supplierPhone').value = supplier.phone || '';
                document.getElementById('supplierAddress').value = supplier.address || '';
                document.getElementById('supplierRCCM').value = supplier.rccm || '';
                document.getElementById('supplierNIU').value = supplier.niu || '';
                document.getElementById('supplierLeadTime').value = supplier.delivery_lead_time_days || 5;
                document.getElementById('supplierPaymentTerms').value = supplier.payment_terms || 'net_30';
                document.getElementById('supplierStatus').value = supplier.status || 'active';
                document.getElementById('supplierNotes').value = supplier.notes || '';
                
                document.getElementById('supplierForm').dataset.supplierId = id;
                openModal('supplierModal');
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur: ' + error.message, 'danger');
            }
        }

        // Enregistrer fournisseur
        async function saveSupplier(e) {
            e.preventDefault();
            
            const supplierId = document.getElementById('supplierForm').dataset.supplierId;
            
            const data = {
                name: document.getElementById('supplierName').value,
                company_name: document.getElementById('supplierCompany').value,
                email: document.getElementById('supplierEmail').value,
                phone: document.getElementById('supplierPhone').value,
                address: document.getElementById('supplierAddress').value,
                rccm: document.getElementById('supplierRCCM').value,
                niu: document.getElementById('supplierNIU').value,
                delivery_lead_time_days: parseInt(document.getElementById('supplierLeadTime').value),
                payment_terms: document.getElementById('supplierPaymentTerms').value,
                status: document.getElementById('supplierStatus').value,
                notes: document.getElementById('supplierNotes').value
            };
            
            try {
                const response = await fetch(
                    `../api/suppliers.php${supplierId ? '?id=' + supplierId : ''}`,
                    {
                        method: supplierId ? 'PUT' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    }
                );
                
                const result = await response.json();
                
                if (!result.success) throw new Error(result.error);
                
                closeModal('supplierModal');
                delete document.getElementById('supplierForm').dataset.supplierId;
                loadSuppliers();
                showNotification('Fournisseur ' + (supplierId ? 'modifié' : 'créé') + ' avec succès', 'success');
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur: ' + error.message, 'danger');
            }
        }

        // Supprimer fournisseur
        async function deleteSupplier(id) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur?')) return;
            
            try {
                const response = await fetch(`../api/suppliers.php?id=${id}`, { method: 'DELETE' });
                const result = await response.json();
                
                if (!result.success) throw new Error(result.error);
                
                currentSupplierId = null;
                loadSuppliers();
                showNotification('Fournisseur supprimé', 'success');
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur: ' + error.message, 'danger');
            }
        }

        // Afficher/masquer tab
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
            
            document.getElementById(tabName + 'Tab').classList.add('active');
            event.target.classList.add('active');
        }

        // Ajouter contact
        function openAddContactModal(supplierId) {
            // Placeholder - à implémenter
            showNotification('Fonctionnalité à venir', 'info');
        }

        // Ajouter produit
        function openAddProductModal(supplierId) {
            // Placeholder - à implémenter
            showNotification('Fonctionnalité à venir', 'info');
        }

        // Fermer modal
        function closeSupplierModal() {
            closeModal('supplierModal');
            delete document.getElementById('supplierForm').dataset.supplierId;
        }

        // Format currency
        function formatCurrency(value) {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0
            }).format(value);
        }

        // Charger au démarrage
        document.addEventListener('DOMContentLoaded', loadSuppliers);
    </script>
</body>
</html>
