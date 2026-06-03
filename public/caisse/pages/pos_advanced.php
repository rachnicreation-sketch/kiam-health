<?php
/**
 * Système POS Avancé avec Scanner Code-Barres - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

requireRole(['admin', 'manager', 'cashier']);

$cashierId = $_SESSION['user_id'];
$message = '';
$error = '';

// Récupérer les clients pour le sélecteur
$clients = $pdo->query("SELECT id, name FROM clients ORDER BY id = 1 DESC, name ASC")->fetchAll();

// Obtenir la session de caisse actuelle
$sessionStmt = $pdo->prepare("SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'open' ORDER BY opened_at DESC LIMIT 1");
$sessionStmt->execute([$cashierId]);
$cashSession = $sessionStmt->fetch();

if (!$cashSession) {
    $error = "Aucune session de caisse ouverte. Veuillez ouvrir une session d'abord.";
}
?>

<script src="assets/js/kiam_global.js"></script>

<!-- Page POS Avancée avec Scanner -->
<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; height: 100vh; background: #f9fafb;">
    
    <!-- Zone Produits & Panier -->
    <div style="display: flex; flex-direction: column; gap: 15px; overflow-y: auto;">
        
        <!-- Barre Scanner -->
        <div style="background: white; border: 2px solid var(--erp-primary); border-radius: 4px; padding: 15px; position: sticky; top: 0; z-index: 100;">
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 5px; color: var(--erp-text-muted);">Scanner Code-Barres</label>
                    <input type="text" id="barcode_scanner" placeholder="Scannez le code-barres..." 
                        onkeypress="if(event.key==='Enter') scanBarcodeForSale(this.value)"
                        style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 1rem;"
                        autofocus>
                </div>
                <div style="display: flex; flex-direction: column; justify-content: flex-end;">
                    <button class="erp-btn erp-btn-secondary" onclick="document.getElementById('product_search_modal').style.display='flex'">
                        🔍 Recherche
                    </button>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: auto auto auto auto; gap: 8px;">
                <select id="sale_client_id" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 0.9rem;">
                    <option value="">-- Client de Passage --</option>
                    <?php foreach ($clients as $c): ?>
                        <option value="<?php echo $c['id']; ?>"><?php echo htmlspecialchars($c['name']); ?></option>
                    <?php endforeach; ?>
                </select>
                <button class="erp-btn erp-btn-secondary" onclick="clearCart()">🗑️ Vider</button>
                <button class="erp-btn erp-btn-secondary" onclick="loadLastSale()">⏮️ Dernière Vente</button>
                <button class="erp-btn erp-btn-success" onclick="validateAndCompleteSale()" style="background-color: #059669; color: white; font-weight: 600;">
                    ✓ VALIDER VENTE
                </button>
            </div>
        </div>
        
        <!-- Tableau du Panier -->
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto; flex: 1;">
            <table class="erp-list-view" style="width: 100%; margin: 0;">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th style="text-align: center;">Quantité</th>
                        <th style="text-align: right;">P.U.</th>
                        <th style="text-align: right;">Total</th>
                        <th style="text-align: center;">Action</th>
                    </tr>
                </thead>
                <tbody id="cart_items">
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 30px; color: #9ca3af;">
                            Le panier est vide - Scannez un produit ou utilisez la recherche
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Résumé Caisse (Droite) -->
    <div style="display: flex; flex-direction: column; gap: 15px; background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
        
        <?php if ($error): ?>
            <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 4px; padding: 12px; color: #991b1b;">
                <strong>⚠️ Erreur:</strong> <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>
        
        <div>
            <h3 style="margin: 0 0 15px 0; color: var(--erp-primary); font-size: 1.1rem;">Résumé de Vente</h3>
        </div>
        
        <!-- KPIs de la Vente -->
        <div style="background: #f9fafb; border-radius: 4px; padding: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280;">Nombre d'articles</span>
                <span style="font-size: 1.3rem; font-weight: 600;" id="cart_item_count">0</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280;">Sous-total</span>
                <span style="font-size: 1.2rem; font-weight: 600;" id="cart_subtotal">0 FCFA</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280;">Réduction</span>
                <input type="number" id="discount_amount" value="0" min="0" step="1000"
                    onchange="updateTotals()"
                    style="width: 120px; padding: 6px; border: 1px solid #e5e7eb; border-radius: 4px; text-align: right;">
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280;">TVA (18%)</span>
                <span style="font-size: 1.1rem;" id="cart_tax">0 FCFA</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                <span style="font-weight: 600; font-size: 1.1rem;">TOTAL À PAYER</span>
                <span style="font-size: 1.4rem; font-weight: 700; color: var(--erp-primary);" id="cart_total">0 FCFA</span>
            </div>
        </div>
        
        <!-- Moyen de Paiement -->
        <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px;">Moyen de Paiement</label>
            <select id="payment_method" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px;">
                <option value="cash">💵 Espèces</option>
                <option value="mobile_money">📱 Mobile Money</option>
                <option value="card">💳 Carte Bancaire</option>
            </select>
        </div>
        
        <!-- Montant Reçu -->
        <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px;">Montant Reçu</label>
            <input type="number" id="amount_received" value="0" step="500"
                onchange="calculateChange()"
                style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 1rem; font-weight: 600;">
        </div>
        
        <!-- Monnaie à Rendre -->
        <div style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 4px; padding: 12px;">
            <span style="font-size: 0.85rem; color: #059669;">Monnaie à Rendre</span>
            <div style="font-size: 1.5rem; font-weight: 700; color: #059669;" id="change_display">0 FCFA</div>
        </div>
        
        <!-- Boutons Actions -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button class="erp-btn erp-btn-secondary" onclick="openModal('payment_details_modal')" style="padding: 12px;">
                ⚙️ Options
            </button>
            <button class="erp-btn erp-btn-danger" onclick="cancelSale()" style="padding: 12px; background-color: #dc2626; color: white;">
                ✗ Annuler
            </button>
        </div>
        
        <!-- Info Session -->
        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 4px; padding: 12px; font-size: 0.85rem;">
            <strong>Session #<?php echo $cashSession['id'] ?? 'N/A'; ?></strong>
            <div style="color: #7c2d12; margin-top: 5px;">
                Ouverture: <?php echo $cashSession ? date('d/m/Y H:i', strtotime($cashSession['opened_at'])) : 'N/A'; ?>
            </div>
        </div>
    </div>
</div>

<!-- JavaScript pour le POS -->
<script>
    function updateTotals() {
        const cartItems = window.cartItems || [];
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = parseFloat(document.getElementById('discount_amount')?.value || 0);
        const taxable = subtotal - discount;
        const tax = taxable * 0.18;
        const total = taxable + tax;
        
        document.getElementById('cart_item_count').textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cart_subtotal').textContent = subtotal.toLocaleString('fr-FR') + ' FCFA';
        document.getElementById('cart_tax').textContent = tax.toLocaleString('fr-FR') + ' FCFA';
        document.getElementById('cart_total').textContent = total.toLocaleString('fr-FR') + ' FCFA';
    }
    
    function calculateChange() {
        const total = parseFloat(document.getElementById('cart_total').textContent) || 0;
        const received = parseFloat(document.getElementById('amount_received').value || 0);
        const change = received - total;
        
        document.getElementById('change_display').textContent = 
            (change >= 0 ? '+' : '') + change.toLocaleString('fr-FR') + ' FCFA';
    }
    
    function clearCart() {
        if (confirm('Êtes-vous sûr de vouloir vider le panier?')) {
            window.cartItems = [];
            updateCartDisplay();
            updateTotals();
        }
    }
    
    function cancelSale() {
        if (confirm('Annuler la vente en cours?')) {
            clearCart();
        }
    }
    
    // Initialiser
    document.addEventListener('DOMContentLoaded', () => {
        updateTotals();
    });
</script>

<!-- Modal Recherche Produit -->
<div id="product_search_modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
    <div style="background: white; border-radius: 4px; padding: 20px; max-width: 600px; width: 90%;">
        <h3 style="margin-top: 0;">Recherche Produit</h3>
        <input type="text" id="product_search_input" placeholder="Nom du produit..."
            style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; margin-bottom: 15px;">
        <div id="product_search_results" style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px;"></div>
        <div style="margin-top: 15px; text-align: right;">
            <button class="erp-btn erp-btn-secondary" onclick="closeModal('product_search_modal')">Fermer</button>
        </div>
    </div>
</div>

<style>
    #barcode_scanner {
        font-size: 1.2rem !important;
        letter-spacing: 2px;
        font-family: 'Courier New', monospace;
    }
    
    .erp-list-view tr {
        border-bottom: 1px solid #e5e7eb;
    }
    
    .erp-list-view tbody tr:hover {
        background-color: #f9fafb;
    }
    
    .erp-btn-success {
        background-color: #059669;
        color: white;
        border: none;
        cursor: pointer;
        border-radius: 4px;
        padding: 10px 15px;
        font-weight: 600;
        transition: background-color 0.2s;
    }
    
    .erp-btn-success:hover {
        background-color: #047857;
    }
</style>
