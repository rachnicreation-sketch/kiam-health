<?php
/**
 * Comptabilité Avancée - Bilan Financier Complet - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

requireRole(['admin', 'manager', 'comptable']);

// Récupérer les paramètres de filtrage
$startDate = $_GET['start_date'] ?? date('Y-m-01');
$endDate = $_GET['end_date'] ?? date('Y-m-d');
$comparisonMonth = $_GET['comparison_month'] ?? null;

// ========== CALCUL DU BILAN ==========

// 1. Chiffre d'affaires brut
$caStmt = $pdo->prepare("
    SELECT 
        SUM(total_amount) as ca_brut,
        SUM(discount_amount) as discounts,
        SUM(tax_amount) as taxes,
        COUNT(*) as nb_transactions
    FROM sales
    WHERE DATE(sale_date) >= ? AND DATE(sale_date) <= ? AND status = 'completed'
");
$caStmt->execute([$startDate, $endDate]);
$ca = $caStmt->fetch();

$caBrut = (float)($ca['ca_brut'] ?? 0);
$discounts = (float)($ca['discounts'] ?? 0);
$taxes = (float)($ca['taxes'] ?? 0);
$caNet = $caBrut - $discounts;

// 2. Coût des marchandises vendues (COGS)
$cogsStmt = $pdo->prepare("
    SELECT SUM(p.purchase_price * si.quantity) as cogs
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE DATE(s.sale_date) >= ? AND DATE(s.sale_date) <= ? AND s.status = 'completed'
");
$cogsStmt->execute([$startDate, $endDate]);
$cogs = (float)($cogsStmt->fetchColumn() ?? 0);

// 3. Marge brute
$marginStmt = $pdo->prepare("
    SELECT SUM((si.unit_price - p.purchase_price) * si.quantity) as margin
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE DATE(s.sale_date) >= ? AND DATE(s.sale_date) <= ? AND s.status = 'completed'
");
$marginStmt->execute([$startDate, $endDate]);
$marginBrute = (float)($marginStmt->fetchColumn() ?? 0);

// 4. Dépenses
$expensesStmt = $pdo->prepare("
    SELECT 
        category,
        SUM(amount) as amount
    FROM expenses
    WHERE expense_date >= ? AND expense_date <= ?
    GROUP BY category
");
$expensesStmt->execute([$startDate, $endDate]);
$expensesByCategory = $expensesStmt->fetchAll();

$totalExpenses = array_reduce($expensesByCategory, fn($sum, $exp) => $sum + (float)$exp['amount'], 0);

// 5. Masse salariale & charges
$salaryStmt = $pdo->prepare("
    SELECT 
        SUM(gross_salary) as total_gross,
        SUM(cnss_deduction) as cnss,
        SUM(net_salary) as total_net,
        COUNT(*) as nb_payslips
    FROM payslips
    WHERE period_start >= ? AND period_start <= ?
");
$salaryStmt->execute([$startDate, $endDate]);
$salary = $salaryStmt->fetch();

$totalGrossSalary = (float)($salary['total_gross'] ?? 0);
$cnssCharges = (float)($salary['cnss'] ?? 0);
$totalNetSalary = (float)($salary['total_net'] ?? 0);

// 6. Situation clients
$clientsStmt = $pdo->query("
    SELECT 
        SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as credits_given,
        SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) as credits_received
    FROM clients
");
$clientSituation = $clientsStmt->fetch();
$creditsGiven = (float)($clientSituation['credits_given'] ?? 0);
$creditsReceived = (float)($clientSituation['credits_received'] ?? 0);

// Calculs finaux
$operatingExpenses = $totalExpenses + $totalGrossSalary;
$ebit = $marginBrute - $totalExpenses; // Bénéfice avant salaires
$netProfit = $marginBrute - $totalExpenses - $totalGrossSalary;
$profitMargin = $caBrut > 0 ? ($netProfit / $caBrut) * 100 : 0;

// KPIs supplémentaires
$avgTicket = $ca['nb_transactions'] > 0 ? $caNet / $ca['nb_transactions'] : 0;
$stockValue = $pdo->query("SELECT SUM(stock_qty * purchase_price) as value FROM products")->fetchColumn() ?: 0;
?>

<link rel="stylesheet" href="assets/css/receipt.css">
<script src="assets/js/kiam_global.js"></script>

<!-- Actions dans la top-bar -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const actionContainer = document.getElementById('erp-page-actions');
        if (actionContainer) {
            actionContainer.innerHTML = `
                <div style="display: flex; gap: 8px;">
                    <button class="erp-btn erp-btn-secondary" onclick="exportData('export_financial_report', 'csv', {start_date: '<?php echo $startDate; ?>', end_date: '<?php echo $endDate; ?>'})">
                        📊 Exporter Excel
                    </button>
                    <button class="erp-btn erp-btn-secondary" onclick="window.print()">
                        🖨️ Imprimer
                    </button>
                </div>
            `;
        }
    });
</script>

<!-- Filtres de Période -->
<div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 15px; margin-bottom: 20px;">
    <form method="GET" action="index.php" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 120px; gap: 15px; align-items: end;">
        <input type="hidden" name="page" value="accounting">
        
        <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; margin-bottom: 5px; color: var(--erp-text-muted);">Date Début</label>
            <input type="date" name="start_date" value="<?php echo $startDate; ?>" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;">
        </div>
        <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; margin-bottom: 5px; color: var(--erp-text-muted);">Date Fin</label>
            <input type="date" name="end_date" value="<?php echo $endDate; ?>" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;">
        </div>
        <div></div>
        <div></div>
        <button type="submit" class="erp-btn erp-btn-primary">Filtrer</button>
    </form>
</div>

<!-- TABLEAU DE BORD FINANCIER -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 30px;">
    
    <!-- KPI 1: Chiffre d'affaires -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
            <div>
                <p style="margin: 0; font-size: 0.85rem; color: var(--erp-text-muted); font-weight: 500;">Chiffre d'Affaires</p>
                <h2 style="margin: 5px 0 0 0; color: var(--erp-primary);">
                    <?php echo number_format($caBrut, 0, ',', ' '); ?> FCFA
                </h2>
            </div>
            <div style="font-size: 2rem;">📈</div>
        </div>
        <small style="color: var(--erp-text-muted);">
            Brut: <?php echo number_format($caBrut, 0, ',', ' '); ?> | 
            Net: <?php echo number_format($caNet, 0, ',', ' '); ?> | 
            Transactions: <?php echo $ca['nb_transactions']; ?>
        </small>
    </div>
    
    <!-- KPI 2: Marge brute -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
            <div>
                <p style="margin: 0; font-size: 0.85rem; color: var(--erp-text-muted); font-weight: 500;">Marge Brute</p>
                <h2 style="margin: 5px 0 0 0; color: #059669;">
                    <?php echo number_format($marginBrute, 0, ',', ' '); ?> FCFA
                </h2>
            </div>
            <div style="font-size: 2rem;">💚</div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
            <div style="flex: 1; text-align: center;">
                <small style="display: block; color: var(--erp-text-muted);">Pourcentage</small>
                <strong style="font-size: 1.2rem;"><?php echo number_format(($marginBrute / $caBrut) * 100, 1); ?>%</strong>
            </div>
            <div style="flex: 1; text-align: center;">
                <small style="display: block; color: var(--erp-text-muted);">COGS</small>
                <strong style="font-size: 1.2rem; color: #dc2626;">-<?php echo number_format($cogs, 0, ',', ' '); ?></strong>
            </div>
        </div>
    </div>
    
    <!-- KPI 3: Dépenses & Salaires -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
            <div>
                <p style="margin: 0; font-size: 0.85rem; color: var(--erp-text-muted); font-weight: 500;">Charges Totales</p>
                <h2 style="margin: 5px 0 0 0; color: #dc2626;">
                    -<?php echo number_format($operatingExpenses, 0, ',', ' '); ?> FCFA
                </h2>
            </div>
            <div style="font-size: 2rem;">💰</div>
        </div>
        <small style="color: var(--erp-text-muted);">
            Dépenses: -<?php echo number_format($totalExpenses, 0, ',', ' '); ?> | 
            Salaires: -<?php echo number_format($totalGrossSalary, 0, ',', ' '); ?>
        </small>
    </div>
    
    <!-- KPI 4: Bénéfice Net -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
            <div>
                <p style="margin: 0; font-size: 0.85rem; color: var(--erp-text-muted); font-weight: 500;">Bénéfice Net</p>
                <h2 style="margin: 5px 0 0 0; color: <?php echo $netProfit >= 0 ? '#059669' : '#dc2626'; ?>;">
                    <?php echo number_format($netProfit, 0, ',', ' '); ?> FCFA
                </h2>
            </div>
            <div style="font-size: 2rem;">✨</div>
        </div>
        <div style="background: <?php echo $netProfit >= 0 ? '#ecfdf5' : '#fee2e2'; ?>; border-radius: 4px; padding: 8px; text-align: center;">
            <strong style="font-size: 1.1rem; color: <?php echo $netProfit >= 0 ? '#059669' : '#dc2626'; ?>;">
                <?php echo number_format($profitMargin, 2); ?>%
            </strong>
        </div>
    </div>
</div>

<!-- COMPTE DE RÉSULTAT DÉTAILLÉ -->
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
    
    <!-- Tableau des Entrées -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: var(--erp-primary);">📊 ENTRÉES (REVENUS)</h3>
        
        <table style="width: 100%; font-size: 0.9rem;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;">Chiffre d'Affaires Brut</td>
                <td style="text-align: right; padding: 10px 0; font-weight: 600;">
                    <?php echo number_format($caBrut, 0, ',', ' '); ?> FCFA
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #9ca3af;">Réductions accordées</td>
                <td style="text-align: right; padding: 10px 0; color: #dc2626; font-weight: 600;">
                    -<?php echo number_format($discounts, 0, ',', ' '); ?> FCFA
                </td>
            </tr>
            <tr style="border-bottom: 2px solid #e5e7eb; background: #f9fafb;">
                <td style="padding: 10px 0; font-weight: 600;">Chiffre d'Affaires Net</td>
                <td style="text-align: right; padding: 10px 0; font-weight: 600; color: var(--erp-primary);">
                    <?php echo number_format($caNet, 0, ',', ' '); ?> FCFA
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #9ca3af;">Coût des Marchandises Vendues</td>
                <td style="text-align: right; padding: 10px 0; color: #dc2626;">
                    -<?php echo number_format($cogs, 0, ',', ' '); ?> FCFA
                </td>
            </tr>
            <tr style="background: #ecfdf5; border-top: 2px solid #6ee7b7;">
                <td style="padding: 12px 0; font-weight: 600;">Marge Brute (Résultat Brut)</td>
                <td style="text-align: right; padding: 12px 0; font-weight: 600; color: #059669; font-size: 1.1rem;">
                    <?php echo number_format($marginBrute, 0, ',', ' '); ?> FCFA
                </td>
            </tr>
        </table>
    </div>
    
    <!-- Tableau des Sorties -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: var(--erp-primary);">💸 SORTIES (CHARGES)</h3>
        
        <table style="width: 100%; font-size: 0.9rem;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;">Masse Salariale Brute</td>
                <td style="text-align: right; padding: 10px 0; font-weight: 600;">
                    -<?php echo number_format($totalGrossSalary, 0, ',', ' '); ?> FCFA
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #9ca3af;">   └─ Cotisations CNSS</td>
                <td style="text-align: right; padding: 10px 0; color: #9ca3af;">
                    -<?php echo number_format($cnssCharges, 0, ',', ' '); ?> FCFA
                </td>
            </tr>
            <?php foreach ($expensesByCategory as $exp): ?>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;">Dépenses: <?php echo ucfirst($exp['category']); ?></td>
                <td style="text-align: right; padding: 10px 0; color: #dc2626;">
                    -<?php echo number_format($exp['amount'], 0, ',', ' '); ?> FCFA
                </td>
            </tr>
            <?php endforeach; ?>
            <tr style="background: #fee2e2; border-top: 2px solid #fca5a5;">
                <td style="padding: 12px 0; font-weight: 600;">Total Charges</td>
                <td style="text-align: right; padding: 12px 0; font-weight: 600; color: #dc2626; font-size: 1.1rem;">
                    -<?php echo number_format($operatingExpenses, 0, ',', ' '); ?> FCFA
                </td>
            </tr>
        </table>
    </div>
</div>

<!-- BILAN NET FINAL -->
<div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 2px solid #6ee7b7; border-radius: 4px; padding: 30px; text-align: center; margin-bottom: 30px;">
    <h2 style="margin-top: 0; margin-bottom: 10px; color: #059669;">RÉSULTAT NET DE LA PÉRIODE</h2>
    <div style="font-size: 3rem; font-weight: 700; color: #059669; margin-bottom: 10px;">
        <?php echo number_format($netProfit, 0, ',', ' '); ?> FCFA
    </div>
    <div style="display: flex; justify-content: center; gap: 40px; margin-top: 20px;">
        <div>
            <small style="color: #6b7280; display: block;">Marge Brute</small>
            <strong style="font-size: 1.2rem; color: #059669;">
                <?php echo number_format($marginBrute, 0, ',', ' '); ?> FCFA
            </strong>
        </div>
        <div>
            <small style="color: #6b7280; display: block;">Charges</small>
            <strong style="font-size: 1.2rem; color: #dc2626;">
                -<?php echo number_format($operatingExpenses, 0, ',', ' '); ?> FCFA
            </strong>
        </div>
        <div>
            <small style="color: #6b7280; display: block;">Rentabilité</small>
            <strong style="font-size: 1.2rem; color: #059669;">
                <?php echo number_format($profitMargin, 2); ?>%
            </strong>
        </div>
    </div>
</div>

<!-- Situation Clients -->
<div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px; margin-bottom: 30px;">
    <h3 style="margin-top: 0; margin-bottom: 15px; color: var(--erp-primary);">👥 SITUATION CLIENTS</h3>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
        <div style="background: #ecfdf5; border-radius: 4px; padding: 15px; text-align: center;">
            <small style="display: block; color: #059669; font-weight: 500;">Crédits Accordés (Clients Débiteurs)</small>
            <div style="font-size: 1.8rem; font-weight: 700; color: #059669; margin-top: 10px;">
                <?php echo number_format($creditsGiven, 0, ',', ' '); ?> FCFA
            </div>
        </div>
        
        <div style="background: #fef3c7; border-radius: 4px; padding: 15px; text-align: center;">
            <small style="display: block; color: #b45309; font-weight: 500;">Crédits Reçus (Clients Créanciers)</small>
            <div style="font-size: 1.8rem; font-weight: 700; color: #b45309; margin-top: 10px;">
                <?php echo number_format($creditsReceived, 0, ',', ' '); ?> FCFA
            </div>
        </div>
        
        <div style="background: #e0f2fe; border-radius: 4px; padding: 15px; text-align: center;">
            <small style="display: block; color: #0369a1; font-weight: 500;">Position Nette</small>
            <div style="font-size: 1.8rem; font-weight: 700; color: #0369a1; margin-top: 10px;">
                <?php echo number_format($creditsGiven - $creditsReceived, 0, ',', ' '); ?> FCFA
            </div>
        </div>
    </div>
</div>

<!-- Informations Stock -->
<div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
    <h3 style="margin-top: 0; margin-bottom: 15px; color: var(--erp-primary);">📦 STOCK & ACTIFS</h3>
    
    <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 15px;">
        <strong>Valeur du Stock (au coût d'achat)</strong>
        <div style="font-size: 1.5rem; color: #059669; margin-top: 8px; font-weight: 700;">
            <?php echo number_format($stockValue, 0, ',', ' '); ?> FCFA
        </div>
    </div>
</div>

<style>
    @media print {
        body {
            background: white;
        }
        
        .erp-btn, input[type="date"], select {
            display: none !important;
        }
        
        #erp-topbar, #erp-sidebar {
            display: none !important;
        }
        
        div[style*="display: grid"] {
            page-break-inside: avoid;
        }
    }
</style>
