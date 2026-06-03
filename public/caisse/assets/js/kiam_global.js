/**
 * Fonctions Globales pour l'Application KIAM Caisse
 * Utilities partagées entre tous les modules (POS, Comptabilité, Gestion Clients, etc.)
 */

// ========== NOTIFICATIONS & MESSAGES ==========

function showNotification(message, type = 'info', duration = 3500) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        background-color: ${
            type === 'success' ? '#059669' :
            type === 'danger' ? '#dc2626' :
            type === 'warning' ? '#d97706' :
            '#2563eb'
        };
        color: white;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ========== GESTION DES MODALES ==========
// Définir les vraies fonctions modales qui utilisent classList
// Ces fonctions OVERRIDÉNT les anciennes versions et doivent être exécutées en dernier

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.warn(`Modal #${modalId} not found`);
        return;
    }
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.warn(`Modal #${modalId} not found`);
        return;
    }
    modal.classList.remove('active');
}

// ========== EXPORT / IMPORT ==========

function exportData(action, format = 'csv', filters = {}) {
    let url = `api/export_handler.php?action=${action}&format=${format}`;
    
    for (let key in filters) {
        url += `&${key}=${encodeURIComponent(filters[key])}`;
    }
    
    window.open(url, '_blank');
    showNotification('Téléchargement en cours...', 'success');
}

function importFile(action, fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput || !fileInput.files[0]) {
        showNotification('Veuillez sélectionner un fichier', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('import_file', fileInput.files[0]);
    formData.append('action', action);
    
    fetch(`api/barcode_handler.php`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`${data.message} (${data.imported || 0} éléments)`, 'success');
            if (data.errors && data.errors.length > 0) {
                console.log('Erreurs d\'import:', data.errors);
            }
            fileInput.value = '';
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification(data.message || 'Erreur lors de l\'import', 'danger');
        }
    })
    .catch(error => {
        showNotification('Erreur: ' + error.message, 'danger');
    });
}

// ========== GESTION CODE-BARRES ==========

let cartItems = [];

function generateBarcode() {
    fetch('api/barcode_handler.php?action=generate')
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showNotification(`Code généré: ${data.barcode}`, 'success');
                if (document.getElementById('barcode_input')) {
                    document.getElementById('barcode_input').value = data.barcode;
                }
            } else {
                showNotification(data.message || 'Erreur lors de la génération', 'danger');
            }
        })
        .catch(error => showNotification('Erreur: ' + error.message, 'danger'));
}

function scanBarcodeForSale(barcode) {
    if (!barcode) return;
    
    fetch('api/barcode_handler.php?action=scan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({barcode: barcode})
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.product) {
            addProductToCart(data.product);
            showNotification(`${data.product.name} ajouté`, 'success');
            // Nettoyer l'input code-barres
            if (document.getElementById('barcode_scanner')) {
                document.getElementById('barcode_scanner').value = '';
                document.getElementById('barcode_scanner').focus();
            }
        } else {
            showNotification(data.message || 'Produit non trouvé', 'warning');
        }
    })
    .catch(error => showNotification('Erreur: ' + error.message, 'danger'));
}

function printBarcode(productId) {
    fetch(`api/barcode_handler.php?action=print_barcode&product_id=${productId}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const printWindow = window.open('', '', 'width=800,height=600');
            printWindow.document.write('<html><head><title>Code-barres</title></head><body>');
            printWindow.document.write(data.barcode_svg);
            printWindow.document.write(`<p>${data.product.name} - ${data.product.barcode}</p>`);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        } else {
            showNotification('Erreur: ' + data.message, 'danger');
        }
    });
}

// ========== GESTION DU PANIER (POS) ==========

function addProductToCart(product) {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.selling_price || product.price || 0),
            quantity: 1,
            quantity_in_stock: product.quantity_in_stock || 999
        });
    }
    
    updateCartDisplay();
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('cart_items');
    if (!cartContainer) return;
    
    if (cartItems.length === 0) {
        cartContainer.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #9ca3af;">Panier vide</td></tr>';
        updateTotals();
        return;
    }
    
    let html = '';
    cartItems.forEach((item, index) => {
        html += `
            <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">
                    <input type="number" value="${item.quantity}" min="1" max="${item.quantity_in_stock}" 
                        onchange="updateItemQuantity(${item.id}, this.value)" 
                        style="width: 50px; padding: 4px; text-align: center; border: 1px solid var(--erp-border);">
                </td>
                <td style="text-align: right;">${number_format(item.price, 0, ',', ' ')} FCFA</td>
                <td style="text-align: right;">${number_format(item.price * item.quantity, 0, ',', ' ')} FCFA</td>
                <td style="text-align: center;">
                    <button class="erp-btn erp-btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" 
                        onclick="removeFromCart(${item.id})">🗑️ Retirer</button>
                </td>
            </tr>
        `;
    });
    
    cartContainer.innerHTML = html;
    updateTotals();
}

function updateItemQuantity(productId, newQuantity) {
    const item = cartItems.find(i => i.id === productId);
    if (item) {
        const qty = parseInt(newQuantity) || 0;
        item.quantity = Math.max(1, Math.min(qty, item.quantity_in_stock));
        updateCartDisplay();
    }
}

function updateQuantity(productId, change) {
    const item = cartItems.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity < 1) item.quantity = 1;
        if (item.quantity > item.quantity_in_stock) item.quantity = item.quantity_in_stock;
        updateCartDisplay();
    }
}

function updateTotals() {
    const cartItems_local = window.cartItems || [];
    const subtotal = cartItems_local.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discount_amount')?.value || 0);
    const taxable = subtotal - discount;
    const tax = taxable * 0.18; // 18% TVA
    const total = taxable + tax;
    
    // Mettre à jour l'affichage des totaux
    if (document.getElementById('subtotal_display')) {
        document.getElementById('subtotal_display').textContent = number_format(subtotal, 0, ',', ' ');
    }
    if (document.getElementById('discount_display')) {
        document.getElementById('discount_display').textContent = number_format(discount, 0, ',', ' ');
    }
    if (document.getElementById('tax_display')) {
        document.getElementById('tax_display').textContent = number_format(tax, 0, ',', ' ');
    }
    if (document.getElementById('total_display')) {
        document.getElementById('total_display').textContent = number_format(total, 0, ',', ' ');
    }
    if (document.getElementById('cart_total')) {
        document.getElementById('cart_total').value = total;
    }
    
    // Calculer la monnaie
    const amountPaid = parseFloat(document.getElementById('amount_paid')?.value || 0);
    const change = Math.max(0, amountPaid - total);
    if (document.getElementById('change_amount')) {
        document.getElementById('change_amount').textContent = number_format(change, 0, ',', ' ');
    }
}

function calculateChange() {
    updateTotals();
}

function clearCart() {
    if (confirm('Êtes-vous sûr de vouloir vider le panier?')) {
        cartItems = [];
        updateCartDisplay();
        showNotification('Panier vidé', 'success');
    }
}

function cancelSale() {
    if (confirm('Êtes-vous sûr d\'annuler cette vente?')) {
        clearCart();
        // Réinitialiser les champs de paiement
        if (document.getElementById('discount_amount')) document.getElementById('discount_amount').value = '';
        if (document.getElementById('amount_paid')) document.getElementById('amount_paid').value = '';
        if (document.getElementById('payment_method')) document.getElementById('payment_method').value = 'cash';
    }
}

function validateAndCompleteSale() {
    if (cartItems.length === 0) {
        showNotification('Le panier est vide', 'warning');
        return;
    }
    
    const discount = parseFloat(document.getElementById('discount_amount')?.value || 0);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxable = subtotal - discount;
    const tax = taxable * 0.18;
    const total = taxable + tax;
    
    const amountPaid = parseFloat(document.getElementById('amount_paid')?.value || 0);
    if (amountPaid < total) {
        showNotification('Montant insuffisant', 'warning');
        return;
    }
    
    const paymentMethod = document.getElementById('payment_method')?.value || 'cash';
    const clientId = document.getElementById('client_id')?.value || null;
    
    // Préparer les données
    const saleData = {
        client_id: clientId,
        discount_amount: discount,
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        items: cartItems
    };
    
    // Envoyer au serveur
    fetch('api/cart_checkout.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(saleData)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showNotification('Vente complétée! Facture: ' + data.invoice_no, 'success');
            clearCart();
            // Recharger ou rediriger vers la reçu
            if (data.receipt_url) {
                window.open(data.receipt_url, '_blank');
            }
        } else {
            showNotification(data.message || 'Erreur lors de la validation', 'danger');
        }
    })
    .catch(error => showNotification('Erreur: ' + error.message, 'danger'));
}

// ========== GESTION FINANCIÈRE ==========

function loadFinancialSummary(startDate, endDate) {
    let url = 'api/accounting_api.php?action=get_financial_summary';
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayFinancialSummary(data.data);
            } else {
                showNotification(data.message || 'Erreur lors du chargement', 'danger');
            }
        })
        .catch(error => showNotification('Erreur: ' + error.message, 'danger'));
}

function displayFinancialSummary(summary) {
    const container = document.getElementById('financial_summary');
    if (!container) return;
    
    const profitPercent = summary.ca_brut > 0 ? ((summary.net_profit / summary.ca_brut) * 100).toFixed(2) : 0;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div class="financial-card">
                <h4>Chiffre d'affaires</h4>
                <p class="amount">${number_format(summary.ca_net, 0, ',', ' ')} FCFA</p>
                <small>${summary.nb_ventes || 0} ventes</small>
            </div>
            <div class="financial-card">
                <h4>Marge Brute</h4>
                <p class="amount" style="color: #059669;">${number_format(summary.gross_margin, 0, ',', ' ')} FCFA</p>
                <small>${summary.gross_margin_percent}%</small>
            </div>
            <div class="financial-card">
                <h4>Dépenses & Salaires</h4>
                <p class="amount" style="color: #dc2626;">-${number_format((summary.operating_expenses || 0) + (summary.payroll || 0), 0, ',', ' ')} FCFA</p>
                <small>Dépenses: ${number_format(summary.operating_expenses || 0, 0, ',', ' ')} | Paie: ${number_format(summary.payroll || 0, 0, ',', ' ')}</small>
            </div>
            <div class="financial-card">
                <h4>Bénéfice Net</h4>
                <p class="amount" style="color: ${summary.net_profit >= 0 ? '#059669' : '#dc2626'};">
                    ${number_format(summary.net_profit, 0, ',', ' ')} FCFA (${profitPercent}%)
                </p>
            </div>
            <div class="financial-card">
                <h4>Position Clients</h4>
                <p class="amount">${number_format(summary.net_client_position || 0, 0, ',', ' ')} FCFA</p>
                <small>Dû au client: ${number_format(summary.client_credit || 0, 0, ',', ' ')} | Dû par client: ${number_format(summary.client_debt || 0, 0, ',', ' ')}</small>
            </div>
        </div>
    `;
}

// ========== UTILITAIRES GÉNÉRALES ==========

function number_format(number, decimals = 0, dec_point = '.', thousands_sep = ',') {
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentDateTime() {
    return new Date().toISOString();
}

// ========== ANIMATIONS & STYLES CSS ==========

const styles = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.95); }
    }
    
    .financial-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 15px;
        text-align: center;
    }
    .financial-card h4 {
        margin: 0 0 10px 0;
        font-size: 0.9rem;
        color: #6b7280;
        font-weight: 500;
    }
    .financial-card .amount {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 5px 0;
    }
    .financial-card small {
        display: block;
        font-size: 0.8rem;
        color: #9ca3af;
        margin-top: 5px;
    }
`;

if (!document.getElementById('kiam-global-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'kiam-global-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// ========== INITIALISATION ==========

document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ kiam_global.js chargé avec succès');
    
    // Ajouter les écouteurs de clics pour fermer les modales
    document.querySelectorAll('[id$="Modal"]').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Ajouter l'écouteur de discount
    const discountInput = document.getElementById('discount_amount');
    if (discountInput) {
        discountInput.addEventListener('change', updateTotals);
        discountInput.addEventListener('input', updateTotals);
    }
    
    // Ajouter l'écouteur d'amount_paid
    const amountPaidInput = document.getElementById('amount_paid');
    if (amountPaidInput) {
        amountPaidInput.addEventListener('change', calculateChange);
        amountPaidInput.addEventListener('input', calculateChange);
    }
});
