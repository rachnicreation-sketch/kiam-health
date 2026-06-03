/**
 * Moteur JavaScript de l'Interface de Caisse (POS) - KIAM Caisse
 */

// État Local de la Caisse
const POSState = {
    cart: [],
    products: [],
    selectedCategoryId: 0,
    searchTerm: '',
    paymentMethod: 'cash',
    selectedClientId: 1,
    currentProduct: null  // Produit actuellement sélectionné pour quantité
};

// Éléments du DOM fréquemment sollicités
let domSearchInput;
let domProductsGrid;
let domCartItems;
let domSummaryBrut;
let domSummaryTax;
let domSummaryNet;
let domCheckoutModal;
let domCashTendered;
let domChangeDue;
let domPaymentCards;

document.addEventListener('DOMContentLoaded', () => {
    // Liaison des éléments DOM
    domSearchInput = document.getElementById('pos-search');
    domProductsGrid = document.getElementById('pos-products-grid');
    domCartItems = document.getElementById('pos-cart-items');
    domSummaryBrut = document.getElementById('summary-brut');
    domSummaryTax = document.getElementById('summary-tax');
    domSummaryNet = document.getElementById('summary-net');
    domCheckoutModal = document.getElementById('checkoutModal');
    domCashTendered = document.getElementById('cash-tendered-input');
    domChangeDue = document.getElementById('calc-change-due');
    domPaymentCards = document.querySelectorAll('.payment-method-card');

    // 1. Charger les produits initiaux (Tous)
    loadProducts();

    // 2. Événements sur la recherche et les catégories
    initCatalogEvents();

    // 3. Événement Lecteur Code-Barres Global
    initBarcodeScanner();

    // 4. Événements de paiement
    initCheckoutEvents();

    // 5. Raccourcis Clavier Pro
    initKeyboardShortcuts();

    // 6. Vérifier la session de caisse
    checkCashSession();
});

/**
 * 1. CHARGEMENT ET DESSIN DU CATALOGUE DE PRODUITS
 */
function loadProducts() {
    domProductsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-tertiary);">
            <svg class="spinner" viewBox="0 0 50 50" style="width:40px; height:40px; stroke: var(--accent); stroke-width: 4; fill:none; stroke-linecap:round; animation: spin 1s linear infinite; margin: 0 auto 10px auto;">
                <circle cx="25" cy="25" r="20"></circle>
            </svg>
            <p>Chargement des produits...</p>
        </div>
    `;
    
    const url = `api/products.php?category_id=${POSState.selectedCategoryId}&search=${encodeURIComponent(POSState.searchTerm)}`;
    
    fetch(url)
        .then(res => res.json())
        .then(products => {
            POSState.products = products;
            renderProductsGrid();
        })
        .catch(err => {
            console.error(err);
            domProductsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 40px;">
                    <p>Erreur lors du chargement des produits. Veuillez réessayer.</p>
                </div>
            `;
        });
}

function renderProductsGrid() {
    if (POSState.products.length === 0) {
        domProductsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-tertiary);">
                <p style="font-size: 1.1rem; margin-bottom: 5px;">Aucun produit trouvé</p>
                <p style="font-size: 0.88rem;">Essayez d'ajuster vos filtres de recherche ou de catégorie.</p>
            </div>
        `;
        return;
    }

    domProductsGrid.innerHTML = '';
    POSState.products.forEach(p => {
        // Gérer le label de stock
        let stockClass = 'in-stock';
        let stockLabel = `${p.stock_qty} en stock`;
        
        if (p.stock_qty <= 0) {
            stockClass = 'out-of-stock';
            stockLabel = 'Rupture';
        } else if (p.stock_qty <= p.min_stock_alert) {
            stockClass = 'low-stock';
            stockLabel = `Faible (${p.stock_qty})`;
        }

        const card = document.createElement('div');
        card.className = `product-card ${p.stock_qty <= 0 ? 'disabled' : ''}`;
        if (p.stock_qty <= 0) {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
        }
        
        card.innerHTML = `
            <div class="product-card-header">
                <span class="product-card-category">${p.category_name || 'Autre'}</span>
                <h4 class="product-card-name" title="${p.name}">${p.name}</h4>
                <small style="color: var(--text-tertiary); font-family: monospace; font-size: 0.75rem;">${p.barcode || ''}</small>
            </div>
            <div class="product-card-footer">
                <span class="product-card-price">${formatCurrency(p.sale_price)}</span>
                <span class="product-card-stock ${stockClass}">${stockLabel}</span>
            </div>
        `;

        // Ajouter au panier lors du clic
        card.addEventListener('click', () => {
            if (p.stock_qty > 0) {
                openQuantitySelector(p);
            }
        });

        domProductsGrid.appendChild(card);
    });
}

/**
 * 2. INITIALISATION DES FILTRES DE CATALOGUE & DU RECHERCHE DEBOUCING
 */
function initCatalogEvents() {
    // Événement Saisie Recherche (Debounced à 250ms)
    let searchTimeout;
    domSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            POSState.searchTerm = domSearchInput.value.trim();
            loadProducts();
        }, 250);
    });

    // Événements Catégories
    const categoryPills = document.querySelectorAll('.category-pill');
    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            POSState.selectedCategoryId = parseInt(pill.dataset.id);
            loadProducts();
        });
    });

    // Client select
    const clientSelect = document.getElementById('pos-client-select');
    clientSelect.addEventListener('change', () => {
        POSState.selectedClientId = parseInt(clientSelect.value);
    });
}

/**
 * 3. SCANNER DE CODE-BARRES INTELLIGENT
 * Intercepte les frappes ultra-rapides du clavier simulant un lecteur de code-barres.
 */
function initBarcodeScanner() {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    window.addEventListener('keypress', (e) => {
        // Ignorer les touches saisies dans les champs d'input classiques pour éviter les interférences
        if (e.target.tagName === 'INPUT' && e.target !== domSearchInput) {
            return;
        }

        const currentTime = Date.now();
        
        // Si le délai entre deux touches est inférieur à 50ms, c'est probablement un lecteur de code-barres physique
        if (currentTime - lastKeyTime < 50) {
            if (e.key !== 'Enter') {
                barcodeBuffer += e.key;
            }
        } else {
            // Sinon, on réinitialise car c'est une frappe humaine lente
            barcodeBuffer = e.key;
        }

        lastKeyTime = currentTime;

        // Lorsque la touche "Entrée" conclut le scan du code-barres
        if (e.key === 'Enter' && barcodeBuffer.length >= 8) {
            e.preventDefault();
            const scannedBarcode = barcodeBuffer.trim();
            barcodeBuffer = '';
            
            handleBarcodeScan(scannedBarcode);
        }
    });
}

function handleBarcodeScan(barcode) {
    showNotification(`Code-barres détecté : ${barcode}`, 'info');
    
    // Rechercher le produit exact via API
    fetch(`api/products.php?search=${barcode}`)
        .then(res => res.json())
        .then(products => {
            if (products && products.length > 0) {
                // Trouver le produit exact
                const exactProduct = products.find(p => p.barcode === barcode);
                if (exactProduct && exactProduct.stock_qty > 0) {
                    openQuantitySelector(exactProduct);
                    showNotification(`Sélectionnez la quantité pour ${exactProduct.name}`, 'info');
                } else if (exactProduct && exactProduct.stock_qty <= 0) {
                    showNotification(`${exactProduct.name} est en rupture de stock !`, 'danger');
                } else {
                    showNotification("Produit trouvé mais stock indisponible.", "warning");
                }
            } else {
                showNotification("Produit inconnu au code-barres.", 'danger');
            }
        })
        .catch(err => {
            console.error(err);
            showNotification("Erreur lors de la lecture du code-barres.", 'danger');
        });
}

/**
 * 4. GESTION DU PANIER (AJOUTER, SUPPRIMER, CALCULS)
 */
function openQuantitySelector(product) {
    POSState.currentProduct = product;
    
    // Remplir les infos du modal
    document.getElementById('qty-modal-title').textContent = product.name;
    document.getElementById('qty-modal-price').textContent = formatCurrency(product.sale_price) + '/u';
    document.getElementById('qty-modal-stock').textContent = `Stock disponible: ${product.stock_qty}`;
    document.getElementById('custom-qty-input').value = '';
    
    // Réinitialiser les boutons
    document.querySelectorAll('.qty-preset-btn').forEach(btn => {
        btn.style.opacity = '1';
        btn.disabled = false;
    });
    
    openModal('quantityModal');
    
    // Focus sur le champ personnalisé
    setTimeout(() => {
        document.getElementById('custom-qty-input').focus();
    }, 100);
}

function selectQuantity(qty) {
    if (POSState.currentProduct) {
        addToCart(POSState.currentProduct, qty);
        closeModal('quantityModal');
    }
}

function submitCustomQuantity() {
    const qty = parseFloat(document.getElementById('custom-qty-input').value);
    
    if (!qty || qty <= 0) {
        showNotification("Veuillez entrer une quantité valide", "warning");
        return;
    }
    
    if (POSState.currentProduct) {
        if (qty > POSState.currentProduct.stock_qty) {
            showNotification(`Stock insuffisant (${POSState.currentProduct.stock_qty} disponible)`, "warning");
            return;
        }
        
        addToCart(POSState.currentProduct, qty);
        closeModal('quantityModal');
    }
}

function addToCart(product, qty = 1) {
    const existingItem = POSState.cart.find(item => item.id === product.id);

    if (existingItem) {
        // Vérifier si on ne dépasse pas la quantité en stock disponible
        const newQty = existingItem.qty + qty;
        if (newQty > product.stock_qty) {
            showNotification(`Stock maximal atteint pour ${product.name} (${product.stock_qty} max)`, 'warning');
            return;
        }
        existingItem.qty = newQty;
    } else {
        POSState.cart.push({
            id: product.id,
            name: product.name,
            price: product.sale_price,
            qty: qty,
            stock_qty: product.stock_qty
        });
    }

    updateCartUI();
    showNotification(`${product.name} ajouté x${qty}`, 'success');
}

function updateQty(productId, delta) {
    const item = POSState.cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    // Arrondir à 2 décimales
    item.qty = Math.round(item.qty * 100) / 100;

    if (item.qty <= 0) {
        removeFromCart(productId);
    } else if (item.qty > item.stock_qty) {
        showNotification(`Stock insuffisant (${item.stock_qty} disponible)`, 'warning');
        item.qty = item.stock_qty;
        updateCartUI();
    } else {
        updateCartUI();
    }
}

function removeFromCart(productId) {
    POSState.cart = POSState.cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateCartUI() {
    if (POSState.cart.length === 0) {
        domCartItems.innerHTML = `
            <div class="cart-empty-state">
                <svg viewBox="0 0 24 24">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <h3>Votre panier est vide</h3>
                <p>Cliquez sur un produit du catalogue à gauche ou scannez un article pour l'ajouter à la caisse.</p>
            </div>
        `;
        
        domSummaryBrut.textContent = '0 FCFA';
        domSummaryTax.textContent = '0 FCFA';
        domSummaryNet.textContent = '0 FCFA';
        return;
    }

    domCartItems.innerHTML = '';
    POSState.cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML = `
            <div class="cart-item-details">
                <h4 class="cart-item-title" title="${item.name}">${item.name}</h4>
                <span class="cart-item-price">${formatCurrency(item.price)}/u</span>
            </div>
            
            <div class="cart-item-qty-controls">
                <button class="qty-btn" onclick="updateQty(${item.id}, -0.25)">−</button>
                <span class="qty-val">${item.qty % 1 !== 0 ? item.qty.toFixed(2) : item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 0.25)">+</button>
            </div>

            <div class="cart-item-subtotal-col">
                <span class="cart-item-subtotal">${formatCurrency(item.price * item.qty)}</span>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Retirer l'article">
                    <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `;
        domCartItems.appendChild(row);
    });

    updateCartCalculations();
}

function updateCartCalculations() {
    let brut = 0;
    POSState.cart.forEach(item => {
        brut += item.price * item.qty;
    });

    const discountInput = document.getElementById('pos-discount-input');
    const discount = parseFloat(discountInput.value) || 0;

    let taxable = brut - discount;
    if (taxable < 0) taxable = 0;

    const applyTva = document.getElementById('apply-tva') ? document.getElementById('apply-tva').checked : true;
    const applyCss = document.getElementById('apply-css') ? document.getElementById('apply-css').checked : true;

    const tax = applyTva ? Math.round(taxable * (TAX_RATE / 100)) : 0;
    const css = applyCss ? Math.round(taxable * 0.05) : 0;
    
    const net = taxable + tax + css;

    domSummaryBrut.textContent = formatCurrency(brut);
    domSummaryTax.textContent = formatCurrency(tax);
    
    const domSummaryCss = document.getElementById('summary-css');
    if (domSummaryCss) {
        domSummaryCss.textContent = formatCurrency(css);
    }
    
    domSummaryNet.textContent = formatCurrency(net);
    
    // Mettre à jour l'état interne
    POSState.netTotal = net;
    POSState.discount = discount;
    POSState.taxApplied = applyTva;
    POSState.cssApplied = applyCss;
}

/**
 * 5. MODAL DE CAISSE (CHECKOUT, PAIEMENT ET CALCUL DU RENDU DE MONNAIE)
 */
function initCheckoutEvents() {
    // Gérer la sélection de la méthode de paiement
    domPaymentCards.forEach(card => {
        card.addEventListener('click', () => {
            domPaymentCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            POSState.paymentMethod = card.dataset.method;
            
            // Si ce n'est pas "espèces", forcer le montant reçu à être égal au montant net
            if (POSState.paymentMethod !== 'cash') {
                domCashTendered.value = POSState.netTotal;
                domCashTendered.disabled = true;
            } else {
                domCashTendered.value = '';
                domCashTendered.disabled = false;
            }
            calculateChange();
        });
    });
}

function openCheckoutModal() {
    if (POSState.cart.length === 0) {
        showNotification("Impossible de valider un panier vide.", "warning");
        return;
    }

    openModal('checkoutModal');
    
    // Calculs initiaux dans le panneau
    document.getElementById('calc-net-to-pay').textContent = formatCurrency(POSState.netTotal);
    domCashTendered.value = '';
    domCashTendered.disabled = false;
    domChangeDue.textContent = '0 FCFA';
    
    // Réinitialiser les boutons de paiement
    domPaymentCards.forEach(c => c.classList.remove('active'));
    document.querySelector('[data-method="cash"]').classList.add('active');
    POSState.paymentMethod = 'cash';

    // Rendre les raccourcis de billets courants dynamiques
    renderQuickCashButtons();
    
    // Focus sur la saisie de l'argent reçu
    setTimeout(() => domCashTendered.focus(), 100);
}

function renderQuickCashButtons() {
    const container = document.getElementById('quick-cash-buttons');
    container.innerHTML = '';
    
    const net = POSState.netTotal;
    
    // Billets de banque standards (CFA) à proposer
    const billets = [1000, 2000, 5000, 10000, 20000];
    
    // Proposer les billets immédiatement supérieurs au total net
    const options = billets.filter(b => b >= net).slice(0, 3);
    
    // Si aucun billet supérieur, proposer l'exact montant
    if (options.length === 0) {
        options.push(net);
    } else if (options[0] !== net) {
        // Toujours proposer le montant exact en premier
        options.unshift(net);
    }

    options.forEach(val => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.style.cssText = 'flex-grow:1; font-weight:700; padding:8px;';
        btn.textContent = formatCurrency(val);
        
        btn.addEventListener('click', () => {
            domCashTendered.value = val;
            calculateChange();
        });
        
        container.appendChild(btn);
    });
}

function calculateChange() {
    const cash = parseFloat(domCashTendered.value) || 0;
    const net = POSState.netTotal;
    let change = cash - net;
    
    if (change < 0 || POSState.paymentMethod !== 'cash') {
        change = 0;
    }
    
    domChangeDue.textContent = formatCurrency(change);
    POSState.changeDue = change;
    POSState.cashTendered = cash;
}

/**
 * ENVOI DE LA COMMANDE AU BACKEND PHP (AJAX CHECKOUT)
 */
function submitCheckout() {
    const cash = parseFloat(domCashTendered.value) || 0;
    
    if (POSState.paymentMethod === 'cash' && cash < POSState.netTotal) {
        showNotification("Le montant reçu est insuffisant !", "warning");
        domCashTendered.focus();
        return;
    }

    const payload = {
        client_id: POSState.selectedClientId,
        payment_method: POSState.paymentMethod,
        discount_amount: POSState.discount,
        apply_tax: POSState.taxApplied,
        apply_css: POSState.cssApplied,
        amount_paid: POSState.paymentMethod === 'cash' ? cash : POSState.netTotal,
        items: POSState.cart.map(item => ({
            id: item.id,
            qty: item.qty
        }))
    };

    // Bouton de validation en état de chargement
    const checkoutBtn = document.querySelector('#checkoutModal .btn-success');
    const originalText = checkoutBtn.innerHTML;
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = `Traitement en cours...`;

    fetch('api/cart_checkout.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = originalText;

        if (data.success) {
            closeModal('checkoutModal');
            showNotification(`Vente validée ! Facture : ${data.invoice.invoice_no}`, 'success');
            
            // Dessiner et afficher le ticket thermique dans l'aperçu modale
            renderThermalReceipt(data.invoice, data.shop);
            openModal('receiptModal');
            
            // Vider le panier et recharger le catalogue (car les stocks ont changé)
            POSState.cart = [];
            document.getElementById('pos-discount-input').value = 0;
            updateCartUI();
            loadProducts();
        } else {
            showNotification(data.error || "Une erreur est survenue lors de la vente.", 'danger');
        }
    })
    .catch(err => {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = originalText;
        console.error(err);
        showNotification("Erreur critique de communication avec le serveur.", 'danger');
    });
}

/**
 * DESSIN ET RENDER DU TICKET THERMIQUE
 */
function renderThermalReceipt(invoice, shop) {
    const container = document.getElementById('thermal-receipt-content');
    
    let itemsRowsHtml = '';
    invoice.items.forEach(item => {
        itemsRowsHtml += `
            <tr>
                <td colspan="2" class="ticket-item-name">${item.name}</td>
            </tr>
            <tr>
                <td class="ticket-item-calc">${item.qty} x ${formatCurrency(item.price)}</td>
                <td class="ticket-item-subtotal">${formatCurrency(item.subtotal)}</td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="ticket-header">
            ${shop.logo ? `<img src="${shop.logo}" style="max-height: 40px; display: block; margin: 0 auto 8px auto; border-radius: 4px;">` : ''}
            <div class="ticket-logo">${shop.name}</div>
            <div class="ticket-info">
                ${shop.address}<br>
                Téléphone : ${shop.phone}
            </div>
        </div>
        
        <div class="ticket-separator"></div>
        
        <div class="ticket-meta">
            <div class="ticket-meta-row">
                <span>Facture N° :</span>
                <strong>${invoice.invoice_no}</strong>
            </div>
            <div class="ticket-meta-row">
                <span>Date :</span>
                <span>${invoice.date}</span>
            </div>
            <div class="ticket-meta-row">
                <span>Caissier :</span>
                <span>${invoice.cashier}</span>
            </div>
            <div class="ticket-meta-row">
                <span>Client :</span>
                <span>${invoice.client_name}</span>
            </div>
        </div>
        
        <div class="ticket-separator"></div>
        
        <table class="ticket-items-table">
            <thead>
                <tr>
                    <th style="width: 70%;">Article</th>
                    <th style="text-align: right; width: 30%;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRowsHtml}
            </tbody>
        </table>
        
        <div class="ticket-separator"></div>
        
        <div class="ticket-totals">
            <div class="ticket-total-row">
                <span>Sous-Total Brut :</span>
                <span>${formatCurrency(invoice.total_brut)}</span>
            </div>
            ${invoice.discount > 0 ? `
            <div class="ticket-total-row">
                <span>Remise de caisse :</span>
                <span>-${formatCurrency(invoice.discount)}</span>
            </div>
            ` : ''}
            ${invoice.tax_amount > 0 ? `
            <div class="ticket-total-row">
                <span>TVA (18%) :</span>
                <span>${formatCurrency(invoice.tax_amount)}</span>
            </div>
            ` : ''}
            ${invoice.css_amount > 0 ? `
            <div class="ticket-total-row">
                <span>CSS/CA (5%) :</span>
                <span>${formatCurrency(invoice.css_amount)}</span>
            </div>
            ` : ''}
            <div class="ticket-total-row grand-total">
                <span>TOTAL NET :</span>
                <span>${formatCurrency(invoice.net_amount)}</span>
            </div>
            <div class="ticket-total-row" style="margin-top: 10px;">
                <span>Mode Paiement :</span>
                <span>${invoice.payment_method}</span>
            </div>
            <div class="ticket-total-row">
                <span>Montant reçu :</span>
                <span>${formatCurrency(invoice.amount_paid)}</span>
            </div>
            <div class="ticket-total-row" style="font-weight: bold;">
                <span>Monnaie rendue :</span>
                <span>${formatCurrency(invoice.change_amount)}</span>
            </div>
        </div>
        
        <div class="ticket-separator"></div>
        
        <div class="ticket-footer">
            <p>Merci pour votre visite !</p>
            <p>À bientôt chez KIAM.</p>
            <div class="ticket-barcode">
                *${invoice.invoice_no}*
            </div>
        </div>
    `;
}

/**
 * 6. AJOUT DE CLIENT À LA VOLÉE DEPUIS LA CAISSE (AJAX POST CLIENT)
 */
function submitQuickClient(e) {
    e.preventDefault();
    
    const name = document.getElementById('new-client-name').value.trim();
    const phone = document.getElementById('new-client-phone').value.trim();
    const address = document.getElementById('new-client-address').value.trim();

    if (!name) return;

    fetch('api/clients.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, phone, address })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeModal('addClientModal');
            showNotification(`Client ${name} créé avec succès !`, 'success');
            
            // Ajouter dynamiquement à la liste et le sélectionner
            const select = document.getElementById('pos-client-select');
            const newOption = document.createElement('option');
            newOption.value = data.client.id;
            newOption.textContent = `${data.client.name} ${phone ? '(' + phone + ')' : ''}`;
            newOption.selected = true;
            
            select.appendChild(newOption);
            POSState.selectedClientId = data.client.id;
            
            // Réinitialiser le formulaire
            document.getElementById('add-client-form').reset();
        } else {
            showNotification(data.error || "Échec de création du client.", 'danger');
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Erreur lors de la création du client.", 'danger');
    });
}

/**
 * 7. UTILITAIRES ET FORMATEURS DE DEVISE
 */
function formatCurrency(val) {
    const formatted = Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted} ${SHOP_CURRENCY}`;
}

/**
 * 8. RACCOURCIS CLAVIER PROFESSIONNELS
 */
function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        // F9 : Ouvrir la validation de paiement
        if (e.key === 'F9') {
            e.preventDefault();
            openCheckoutModal();
        }
        
        // F1 : Refocaliser sur la recherche produit
        if (e.key === 'F1') {
            e.preventDefault();
            domSearchInput.focus();
            domSearchInput.value = '';
            POSState.searchTerm = '';
            loadProducts();
        }
    });
}

/**
 * 9. GESTION DES SESSIONS DE CAISSE (OUVERTURE & CLÔTURE)
 */
let currentSession = null;
let closeSessionSummaryData = null;

function checkCashSession() {
    fetch('api/cash_session.php?action=check')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.active) {
                    currentSession = data.session;
                    document.getElementById('btn-close-session').style.display = 'inline-flex';
                } else {
                    // Pas de session active : bloquer l'écran avec le modal d'ouverture
                    openModal('openSessionModal');
                    const modal = document.getElementById('openSessionModal');
                    modal.querySelector('.modal-close')?.remove();
                }
            } else {
                showNotification("Erreur lors de la vérification de la session: " + data.error, "danger");
            }
        })
        .catch(err => {
            console.error(err);
            showNotification("Erreur de connexion lors de la vérification de la caisse.", "danger");
        });
}

function submitOpenSession(e) {
    e.preventDefault();
    const openingBalance = parseFloat(document.getElementById('opening-balance-input').value) || 0;
    const notes = document.getElementById('opening-notes-input').value.trim();

    const submitBtn = document.querySelector('#openSessionModal button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Ouverture en cours...";

    fetch('api/cash_session.php?action=open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_balance: openingBalance, notes: notes })
    })
    .then(res => res.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Valider l'Ouverture & Démarrer";
        
        if (data.success) {
            closeModal('openSessionModal');
            showNotification("Caisse ouverte avec succès !", "success");
            document.getElementById('btn-close-session').style.display = 'inline-flex';
            loadProducts();
        } else {
            showNotification(data.error || "Une erreur est survenue.", "danger");
        }
    })
    .catch(err => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Valider l'Ouverture & Démarrer";
        console.error(err);
        showNotification("Erreur de communication avec le serveur.", "danger");
    });
}

function openCloseSessionModal() {
    const summaryContainer = document.getElementById('close-session-summary');
    summaryContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <svg viewBox="0 0 50 50" style="width:30px; height:30px; stroke: var(--accent); stroke-width: 4; fill:none; stroke-linecap:round; animation: spin 1s linear infinite; margin: 0 auto 10px auto;">
                <circle cx="25" cy="25" r="20"></circle>
            </svg>
            <p>Calcul des totaux de session...</p>
        </div>
    `;
    
    openModal('closeSessionModal');

    fetch('api/cash_session.php?action=summary')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeSessionSummaryData = data;
                summaryContainer.innerHTML = `
                    <div style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Date d'ouverture :</span>
                            <strong>${new Date(data.opened_at).toLocaleString('fr-FR')}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
                            <span style="color: var(--text-secondary);">Caissier :</span>
                            <strong>${data.cashier_name}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Fond de caisse initial :</span>
                            <span style="font-weight: 600;">${formatCurrency(data.opening_balance)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: var(--success);">
                            <span>+ Ventes Espèces :</span>
                            <span style="font-weight: 600;">+ ${formatCurrency(data.cash_sales)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: var(--danger);">
                            <span>- Dépenses Espèces :</span>
                            <span style="font-weight: 600;">- ${formatCurrency(data.expenses)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem;">
                            <span>Solde Espèces Attendu :</span>
                            <strong style="color: var(--accent); font-size: 1.2rem;">${formatCurrency(data.expected_closing_balance)}</strong>
                        </div>
                        <div style="border-top: 1px dashed var(--border-color); margin-top: 5px; padding-top: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-secondary);">
                                <span>Ventes Mobile Money :</span>
                                <span>${formatCurrency(data.momo_sales)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-secondary);">
                                <span>Ventes Carte Bancaire :</span>
                                <span>${formatCurrency(data.card_sales)}</span>
                            </div>
                        </div>
                    </div>
                `;
                
                document.getElementById('actual-balance-input').value = '';
                document.getElementById('closing-difference-display').textContent = '0 FCFA';
                document.getElementById('closing-difference-display').style.color = 'inherit';
                setTimeout(() => document.getElementById('actual-balance-input').focus(), 150);
            } else {
                showNotification(data.error || "Impossible de récupérer le résumé de session.", "danger");
                closeModal('closeSessionModal');
            }
        })
        .catch(err => {
            console.error(err);
            showNotification("Erreur de connexion lors du chargement du résumé.", "danger");
            closeModal('closeSessionModal');
        });
}

function calculateClosingDifference() {
    if (!closeSessionSummaryData) return;
    
    const actual = parseFloat(document.getElementById('actual-balance-input').value) || 0;
    const expected = closeSessionSummaryData.expected_closing_balance;
    const diff = actual - expected;
    
    const diffDisplay = document.getElementById('closing-difference-display');
    diffDisplay.textContent = (diff >= 0 ? '+ ' : '') + formatCurrency(diff);
    
    if (diff === 0) {
        diffDisplay.style.color = 'var(--success)';
    } else if (diff > 0) {
        diffDisplay.style.color = 'var(--warning)';
    } else {
        diffDisplay.style.color = 'var(--danger)';
    }
}

function submitCloseSession(e) {
    e.preventDefault();
    if (!closeSessionSummaryData) return;
    
    const actual = parseFloat(document.getElementById('actual-balance-input').value) || 0;
    const notes = document.getElementById('closing-notes-input').value.trim();
    
    const submitBtn = document.querySelector('#closeSessionModal button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Clôture en cours...";
    
    fetch('api/cash_session.php?action=close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_closing_balance: actual, notes: notes })
    })
    .then(res => res.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Valider la Clôture de la Caisse";
        
        if (data.success) {
            closeModal('closeSessionModal');
            showNotification("Caisse clôturée avec succès !", "success");
            
            renderZReportReceipt(data.session, data.totals, data.cashier_name);
            openModal('zReportModal');
        } else {
            showNotification(data.error || "Une erreur est survenue.", "danger");
        }
    })
    .catch(err => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Valider la Clôture de la Caisse";
        console.error(err);
        showNotification("Erreur de communication avec le serveur.", "danger");
    });
}

function renderZReportReceipt(session, totals, cashierName) {
    const container = document.getElementById('zreport-receipt-content');
    
    const openingStr = new Date(session.opened_at).toLocaleString('fr-FR');
    const closingStr = new Date(session.closed_at).toLocaleString('fr-FR');
    
    let diffColor = 'inherit';
    let diffSign = '';
    if (totals.difference > 0) {
        diffColor = 'var(--warning)';
        diffSign = '+';
    } else if (totals.difference < 0) {
        diffColor = 'var(--danger)';
    } else {
        diffColor = 'var(--success)';
    }

    container.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-logo">RAPPORT Z</div>
            <div class="ticket-info">
                KIAM Supermarché & Boutique<br>
                Clôture de Caisse
            </div>
        </div>
        
        <div class="ticket-separator"></div>
        
        <div class="ticket-meta">
            <div class="ticket-meta-row">
                <span>Session N° :</span>
                <strong>SESSION-${session.id}</strong>
            </div>
            <div class="ticket-meta-row">
                <span>Caissier :</span>
                <span>${cashierName}</span>
            </div>
            <div class="ticket-meta-row" style="font-size:0.8rem;">
                <span>Ouvert le :</span>
                <span>${openingStr}</span>
            </div>
            <div class="ticket-meta-row" style="font-size:0.8rem;">
                <span>Fermé le :</span>
                <span>${closingStr}</span>
            </div>
        </div>
        
        <div class="ticket-separator"></div>
        
        <table class="ticket-items-table" style="font-size: 0.9rem; width: 100%;">
            <tbody>
                <tr>
                    <td style="padding: 4px 0;">Fond de Caisse Initial</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(totals.opening_balance)}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 0; color: var(--success);">+ Ventes Espèces</td>
                    <td style="text-align: right; color: var(--success); font-weight: bold;">+ ${formatCurrency(totals.cash_sales)}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 0; color: var(--danger);">- Dépenses Caisse</td>
                    <td style="text-align: right; color: var(--danger); font-weight: bold;">- ${formatCurrency(totals.expenses)}</td>
                </tr>
                <tr style="border-top: 1px solid var(--border-color);">
                    <td style="padding: 6px 0; font-weight: bold;">Solde Espèces Attendu</td>
                    <td style="text-align: right; font-weight: bold; font-size: 1rem; color: var(--accent);">${formatCurrency(totals.expected)}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Solde Espèces Réel</td>
                    <td style="text-align: right; font-weight: bold; font-size: 1rem; color: var(--success);">${formatCurrency(totals.actual)}</td>
                </tr>
                <tr style="border-top: 1px dashed var(--border-color);">
                    <td style="padding: 6px 0; font-weight: bold;">Écart de caisse</td>
                    <td style="text-align: right; font-weight: bold; color: ${diffColor};">${diffSign}${formatCurrency(totals.difference)}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="ticket-separator"></div>
        
        <div class="ticket-totals" style="font-size: 0.85rem;">
            <div class="ticket-total-row">
                <span>Ventes Mobile Money :</span>
                <span>${formatCurrency(totals.momo_sales)}</span>
            </div>
            <div class="ticket-total-row">
                <span>Ventes Carte Bancaire :</span>
                <span>${formatCurrency(totals.card_sales)}</span>
            </div>
            <div class="ticket-total-row" style="font-weight: bold; margin-top: 5px; border-top: 1px solid var(--border-color); padding-top: 5px;">
                <span>TOTAL VENTES SESSION :</span>
                <span>${formatCurrency(totals.cash_sales + totals.momo_sales + totals.card_sales)}</span>
            </div>
        </div>
        
        <div class="ticket-separator"></div>
        
        <div class="ticket-footer" style="margin-top: 15px;">
            <p>Rapport Z validé électroniquement.</p>
            <p>Session Clôturée</p>
        </div>
    `;
}

function printZReport() {
    const printContent = document.getElementById('zreport-receipt-content').innerHTML;
    
    document.body.innerHTML = `
        <div class="receipt-preview-container" style="background: white; color: black; display: flex; justify-content: center; padding: 20px;">
            <div class="ticket printable-ticket" style="background: white; color: black; box-shadow: none; border: none; padding: 0; width: 80mm;">
                ${printContent}
            </div>
        </div>
    `;
    window.print();
    window.location.reload();
}
