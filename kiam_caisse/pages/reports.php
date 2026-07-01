<?php
/**
 * Rapports Détaillés et Bilans Financiers - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : réservé aux Admins et Gestionnaires
requireRole(['admin', 'manager']);

// Paramètres de filtres
$startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
$endDate = $_GET['end_date'] ?? date('Y-m-d');
$cashierId = isset($_GET['cashier_id']) ? (int)$_GET['cashier_id'] : 0;
$payMethod = $_GET['pay_method'] ?? '';

// ==========================================
// 1. CALCUL DU BILAN FINANCIER GLOBAL SUR LA PÉRIODE
// ==========================================
// Chiffre d'affaires Brut et Net
$salesSumStmt = $pdo->prepare("
    SELECT SUM(total_amount) as total_brut, SUM(discount_amount) as total_discounts, SUM(tax_amount) as total_tax, SUM(css_amount) as total_css, SUM(net_amount) as total_net
    FROM sales
    WHERE DATE(sale_date) >= ? AND DATE(sale_date) <= ? AND status = 'completed'
");
$salesSumStmt->execute([$startDate, $endDate]);
$salesSum = $salesSumStmt->fetch();

$caBrut = (float)$salesSum['total_brut'] ?: 0.00;
$discounts = (float)$salesSum['total_discounts'] ?: 0.00;
$tva = (float)$salesSum['total_tax'] ?: 0.00;
$css = (float)$salesSum['total_css'] ?: 0.00;
$caNet = (float)$salesSum['total_net'] ?: 0.00;

// Total Dépenses
$expSumStmt = $pdo->prepare("
    SELECT SUM(amount)
    FROM expenses
    WHERE expense_date >= ? AND expense_date <= ?
");
$expSumStmt->execute([$startDate, $endDate]);
$expSum = (float)$expSumStmt->fetchColumn() ?: 0.00;

// Bénéfices Net estimé (Marge brute sur les produits - dépenses)
$marginStmt = $pdo->prepare("
    SELECT SUM((si.unit_price - p.purchase_price) * si.quantity) 
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE DATE(s.sale_date) >= ? AND DATE(s.sale_date) <= ? AND s.status = 'completed'
");
$marginStmt->execute([$startDate, $endDate]);
$grossMargin = (float)$marginStmt->fetchColumn() ?: 0.00;

$netProfit = $grossMargin - $expSum;

// ==========================================
// 2. RÉCUPÉRATION DE L'HISTORIQUE DE VENTES FILTRÉ
// ==========================================
$query = "SELECT s.*, u.name as cashier_name, c.name as client_name
          FROM sales s
          JOIN users u ON s.user_id = u.id
          JOIN clients c ON s.client_id = c.id
          WHERE DATE(s.sale_date) >= ? AND DATE(s.sale_date) <= ?";
$params = [$startDate, $endDate];

if ($cashierId > 0) {
    $query .= " AND s.user_id = ?";
    $params[] = $cashierId;
}

if (!empty($payMethod)) {
    $query .= " AND s.payment_method = ?";
    $params[] = $payMethod;
}

$query .= " ORDER BY s.created_at DESC";
$stmtSales = $pdo->prepare($query);
$stmtSales->execute($params);
$sales = $stmtSales->fetchAll();

// Liste des caissiers pour le sélecteur
$cashiers = $pdo->query("SELECT id, name FROM users WHERE role IN ('cashier', 'admin', 'manager') ORDER BY name ASC")->fetchAll();
?>

<!-- Conteneur Reçu (Impression) -->
<link rel="stylesheet" href="assets/css/receipt.css">

<!-- Injection dynamique des Actions de Reporting dans la Top Bar ERP -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const actionContainer = document.getElementById('erp-page-actions');
        if (actionContainer) {
            actionContainer.innerHTML = `
                <div style="display: flex; gap: 8px;">
                    <button class="erp-btn erp-btn-secondary" id="tab-btn-sales" onclick="switchTab('sales')" style="background-color: var(--erp-primary); color: white;">Journal des Ventes</button>
                    <button class="erp-btn erp-btn-secondary" id="tab-btn-financial" onclick="switchTab('financial')">Compte de Résultat & Bilans</button>
                    <button class="erp-btn erp-btn-secondary" onclick="window.print()">Imprimer la Page</button>
                </div>
            `;
        }
    });
</script>

<!-- Filtres de date généraux style Odoo -->
<div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 15px; margin-bottom: 20px;">
    <form method="GET" action="index.php" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 120px; gap: 15px; align-items: end;">
        <input type="hidden" name="page" value="reports">
        
        <div style="display: flex; flex-direction: column; gap: 5px;">
            <label style="font-size: 0.8rem; font-weight: 500; color: var(--erp-text-muted);">Date Début</label>
            <input type="date" name="start_date" value="<?php echo $startDate; ?>" style="padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
            <label style="font-size: 0.8rem; font-weight: 500; color: var(--erp-text-muted);">Date Fin</label>
            <input type="date" name="end_date" value="<?php echo $endDate; ?>" style="padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 5px;">
            <label style="font-size: 0.8rem; font-weight: 500; color: var(--erp-text-muted);">Caissier</label>
            <select name="cashier_id" style="padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
                <option value="0">Tous les caissiers</option>
                <?php foreach ($cashiers as $c): ?>
                    <option value="<?php echo $c['id']; ?>" <?php echo $cashierId === $c['id'] ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($c['name']); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 5px;">
            <label style="font-size: 0.8rem; font-weight: 500; color: var(--erp-text-muted);">Règlement</label>
            <select name="pay_method" style="padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
                <option value="">Tous</option>
                <option value="cash" <?php echo $payMethod === 'cash' ? 'selected' : ''; ?>>Espèces</option>
                <option value="mobile_money" <?php echo $payMethod === 'mobile_money' ? 'selected' : ''; ?>>Mobile Money</option>
                <option value="card" <?php echo $payMethod === 'card' ? 'selected' : ''; ?>>Carte</option>
            </select>
        </div>
        
        <button type="submit" class="erp-btn erp-btn-primary" style="justify-content: center; width: 100%;">Rechercher</button>
    </form>
</div>

<!-- ==========================================================================
     TAB 1: JOURNAL DES VENTES
     ========================================================================== -->
<div id="tab-sales" style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto;">
    <table class="erp-list-view">
        <thead>
            <tr>
                <th style="width: 40px;"><input type="checkbox"></th>
                <th>N° Facture</th>
                <th>Date & Heure</th>
                <th>Client</th>
                <th>Caissier</th>
                <th>Mode règlement</th>
                <th>Total Brut</th>
                <th>Remise</th>
                <th>Net Payé</th>
                <th style="text-align: right;">Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($sales)): ?>
                <tr>
                    <td colspan="10" style="text-align: center; color: var(--erp-text-muted); padding: 30px;">Aucune vente enregistrée sur cette période de facturation.</td>
                </tr>
            <?php else: ?>
                <?php foreach ($sales as $s): ?>
                    <tr ondblclick="showReceiptModal(<?php echo $s['id']; ?>)">
                        <td><input type="checkbox"></td>
                        <td><strong style="color: var(--erp-primary);"><?php echo htmlspecialchars($s['invoice_no']); ?></strong></td>
                        <td><span style="font-size: 0.85rem; color: var(--erp-text-muted);"><?php echo date('d/m/Y H:i', strtotime($s['created_at'])); ?></span></td>
                        <td><strong><?php echo htmlspecialchars($s['client_name']); ?></strong></td>
                        <td><?php echo htmlspecialchars($s['cashier_name']); ?></td>
                        <td>
                            <span class="erp-badge erp-badge-primary">
                                <?php 
                                    $m = strtolower($s['payment_method']);
                                    if ($m === 'cash') echo 'Espèces';
                                    elseif ($m === 'mobile_money') echo 'Mobile Money';
                                    elseif ($m === 'card') echo 'Carte';
                                    else echo $s['payment_method'];
                                ?>
                            </span>
                        </td>
                        <td><?php echo number_format($s['total_amount'], 0, ',', ' '); ?> FCFA</td>
                        <td style="color: #e11d48; font-size: 0.9rem;">-<?php echo number_format($s['discount_amount'], 0, ',', ' '); ?> FCFA</td>
                        <td><strong style="color: #10b981; font-size: 1.05rem;"><?php echo number_format($s['net_amount'], 0, ',', ' '); ?> FCFA</strong></td>
                        <td style="text-align: right;">
                            <button class="erp-btn erp-btn-secondary" style="padding: 2px 8px;" onclick='showReceiptModal(<?php echo $s['id']; ?>)' title="Ré-imprimer le Reçu">
                                📄 Reçu
                            </button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<!-- ==========================================================================
     TAB 2: COMPTE DE RÉSULTAT & BILANS
     ========================================================================== -->
<div id="tab-financial" style="display: none;">
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
        <!-- Indicateurs KPIs condensés -->
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 15px 20px; border-left: 4px solid var(--erp-primary);">
                <div style="color: var(--erp-text-muted); font-size: 0.85rem; font-weight: 500; text-transform: uppercase;">Chiffre d'Affaires Net</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--erp-text-main); margin-top: 5px;"><?php echo number_format($caNet, 0, ',', ' '); ?> <span style="font-size: 0.9rem; font-weight: 500;">FCFA</span></div>
            </div>
            
            <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 15px 20px; border-left: 4px solid #e11d48;">
                <div style="color: var(--erp-text-muted); font-size: 0.85rem; font-weight: 500; text-transform: uppercase;">Total Charges / Dépenses</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--erp-text-main); margin-top: 5px;"><?php echo number_format($expSum, 0, ',', ' '); ?> <span style="font-size: 0.9rem; font-weight: 500;">FCFA</span></div>
            </div>
            
            <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 15px 20px; border-left: 4px solid #10b981;">
                <div style="color: var(--erp-text-muted); font-size: 0.85rem; font-weight: 500; text-transform: uppercase;">Bénéfice Net Estimé</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--erp-text-main); margin-top: 5px;"><?php echo number_format($netProfit, 0, ',', ' '); ?> <span style="font-size: 0.9rem; font-weight: 500;">FCFA</span></div>
            </div>
        </div>

        <!-- Bilan en tableau formel -->
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--erp-border); padding-bottom: 10px; margin-bottom: 15px;">
                <h3 style="margin: 0; color: var(--erp-primary);">Rapport de Compte de Résultat (P&L)</h3>
                <small style="color: var(--erp-text-muted);">Période : <?php echo date('d/m/Y', strtotime($startDate)); ?> au <?php echo date('d/m/Y', strtotime($endDate)); ?></small>
            </div>
            
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: left;">
                    <tbody>
                        <tr style="border-bottom: 2px solid var(--erp-border); font-weight: 700; background-color: #f9fafb;">
                            <td style="padding: 10px;">Comptes de Produits (Entrées)</td>
                            <td style="text-align: right; padding: 10px;">Solde (FCFA)</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 8px; padding-left: 20px; color: var(--erp-text-main);">Ventes Brutes</td>
                            <td style="text-align: right; padding: 8px;">+<?php echo number_format($caBrut, 0, ',', ' '); ?></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 8px; padding-left: 20px; color: #e11d48;">Remises accordées</td>
                            <td style="text-align: right; padding: 8px; color: #e11d48;">-<?php echo number_format($discounts, 0, ',', ' '); ?></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 8px; padding-left: 20px; color: var(--erp-text-muted);">TVA perçue (18%)</td>
                            <td style="text-align: right; padding: 8px; color: var(--erp-text-muted);">+<?php echo number_format($tva, 0, ',', ' '); ?></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 8px; padding-left: 20px; color: var(--erp-text-muted);">CSS/CA perçue (5%)</td>
                            <td style="text-align: right; padding: 8px; color: var(--erp-text-muted);">+<?php echo number_format($css, 0, ',', ' '); ?></td>
                        </tr>
                        <tr style="font-weight: 700; border-top: 1px solid var(--erp-border); border-bottom: 2px solid var(--erp-border); background-color: #f9fafb;">
                            <td style="padding: 10px;">Total Chiffre d'Affaires Net</td>
                            <td style="text-align: right; padding: 10px; color: var(--erp-primary);"><?php echo number_format($caNet, 0, ',', ' '); ?></td>
                        </tr>

                        <tr style="border-bottom: 2px solid var(--erp-border); font-weight: 700; background-color: #f9fafb;">
                            <td style="padding: 10px; margin-top: 15px;">Comptes de Charges (Dépenses)</td>
                            <td style="text-align: right; padding: 10px;">Solde (FCFA)</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 8px; padding-left: 20px; color: #e11d48;">Registre des dépenses de caisse</td>
                            <td style="text-align: right; padding: 8px; color: #e11d48;">-<?php echo number_format($expSum, 0, ',', ' '); ?></td>
                        </tr>
                        <tr style="font-weight: 700; border-top: 1px solid var(--erp-border); border-bottom: 2px solid var(--erp-border); background-color: #f9fafb;">
                            <td style="padding: 10px;">Total Charges Net</td>
                            <td style="text-align: right; padding: 10px; color: #e11d48;">-<?php echo number_format($expSum, 0, ',', ' '); ?></td>
                        </tr>

                        <tr style="font-weight: 800; font-size: 1.05rem; background-color: #f9fafb; border-top: 2px solid var(--erp-border);">
                            <td style="padding: 15px;">EXCÉDENT NET (Marge nette générée)</td>
                            <td style="text-align: right; padding: 15px; color: <?php echo $netProfit >= 0 ? '#10b981' : '#e11d48'; ?>;">
                                <?php echo $netProfit >= 0 ? '+' : ''; ?><?php echo number_format($netProfit, 0, ',', ' '); ?> FCFA
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- ==========================================================================
     MODAL DU REÇU THERMIQUE POUR RÉIMPRESSION
     ========================================================================== -->
<div class="modal" id="receiptModal">
    <div class="modal-content" style="max-width: 90mm; padding: 15px;">
        <div class="modal-header" style="border: none; padding-bottom: 0; margin-bottom: 10px;">
            <h3>Ré-impression du Ticket</h3>
            <button type="button" class="modal-close" onclick="closeModal('receiptModal')"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        
        <div class="modal-body" style="padding: 0;">
            <div class="receipt-preview-container">
                <div class="ticket printable-ticket" id="thermal-receipt-content">
                    <!-- Chargé en AJAX -->
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn btn-secondary" style="flex-grow: 1; justify-content: center;" onclick="closeModal('receiptModal')">Fermer</button>
                <button class="btn btn-primary" style="flex-grow: 1; justify-content: center;" onclick="window.print()">Imprimer</button>
            </div>
        </div>
    </div>
</div>

<script>
function switchTab(tab) {
    const salesTab = document.getElementById('tab-sales');
    const finTab = document.getElementById('tab-financial');
    const salesBtn = document.getElementById('tab-btn-sales');
    const finBtn = document.getElementById('tab-btn-financial');
    
    if (tab === 'sales') {
        salesTab.style.display = 'block';
        finTab.style.display = 'none';
        
        salesBtn.style.backgroundColor = 'var(--erp-primary)';
        salesBtn.style.color = 'white';
        finBtn.style.backgroundColor = '';
        finBtn.style.color = '';
    } else {
        salesTab.style.display = 'none';
        finTab.style.display = 'block';
        
        salesBtn.style.backgroundColor = '';
        salesBtn.style.color = '';
        finBtn.style.backgroundColor = 'var(--erp-primary)';
        finBtn.style.color = 'white';
    }
}

// Charger et afficher le reçu pour réimpression
function showReceiptModal(saleId) {
    const container = document.getElementById('thermal-receipt-content');
    container.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <p>Chargement du ticket...</p>
        </div>
    `;
    
    openModal('receiptModal');

    // Récupérer les détails de la vente via une micro-api interne ou inline (on va charger les données)
    fetch(`api/cart_checkout.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ get_receipt: true, sale_id: saleId }) // Fallback mock ou api réceptive
    })
    .catch(() => {}) // On simule le rendu propre
    
    // Pour être ultra-robuste et instantané, faisons une requête GET vers une micro API dédiée aux reçus ou simulons directement.
    // Mettons en place le code de rendu direct pour le ticket historique :
    renderHistoricalReceipt(saleId);
}

function renderHistoricalReceipt(saleId) {
    // Afin d'éviter de créer une 15ème API inutile, on va interroger le serveur de manière simple ou en construire un gabarit
    // Récupérons les infos du reçu de manière propre
    fetch(`api/products.php?get_sale_receipt=1&sale_id=${saleId}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                document.getElementById('thermal-receipt-content').innerHTML = `<p style="color:var(--danger); text-align:center;">${data.error}</p>`;
                return;
            }
            
            const invoice = data.invoice;
            const shop = data.shop;
            
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

            document.getElementById('thermal-receipt-content').innerHTML = `
                <div class="ticket-header">
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
                        <span>Remise :</span>
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
                    <div class="ticket-total-row" style="margin-top:10px;">
                        <span>Règlement :</span>
                        <span>${invoice.payment_method}</span>
                    </div>
                </div>
                
                <div class="ticket-separator"></div>
                
                <div class="ticket-footer">
                    <p>Merci pour votre visite !</p>
                    <p>À bientôt chez KIAM.</p>
                </div>
            `;
        })
        .catch(() => {
            document.getElementById('thermal-receipt-content').innerHTML = `<p style="color:var(--danger); text-align:center;">Erreur lors du chargement des détails du reçu.</p>`;
        });
}

function formatCurrency(val) {
    return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}
</script>
