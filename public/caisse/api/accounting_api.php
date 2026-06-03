<?php
/**
 * API Comptabilité Avancée - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');
requireRole(['admin', 'manager', 'comptable']);

$action = $_GET['action'] ?? '';
$startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
$endDate = $_GET['end_date'] ?? date('Y-m-d');

try {
    if ($action === 'get_financial_summary') {
        // Résumé financier complet
        $summary = getFinancialSummary($pdo, $startDate, $endDate);
        echo json_encode(['success' => true, 'data' => $summary]);
        exit;
    }
    
    if ($action === 'get_monthly_evolution') {
        // Évolution mensuelle
        $data = getMonthlyEvolution($pdo);
        echo json_encode(['success' => true, 'data' => $data]);
        exit;
    }
    
    if ($action === 'get_detailed_report') {
        // Rapport détaillé par catégorie
        $report = getDetailedReport($pdo, $startDate, $endDate);
        echo json_encode(['success' => true, 'data' => $report]);
        exit;
    }
    
    if ($action === 'get_client_balance') {
        // Solde détaillé des clients
        $balances = getClientBalances($pdo);
        echo json_encode(['success' => true, 'data' => $balances]);
        exit;
    }
    
    if ($action === 'sync_client_balance') {
        // Synchroniser le solde d'un client
        $clientId = (int)($_POST['client_id'] ?? 0);
        if ($clientId <= 0) throw new Exception('Client invalide');
        
        syncClientBalance($pdo, $clientId);
        echo json_encode(['success' => true, 'message' => 'Solde synchronisé']);
        exit;
    }
    
    echo json_encode(['success' => false, 'message' => 'Action inconnue']);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// ========== FONCTIONS COMPTABLES ==========

function getFinancialSummary($pdo, $startDate, $endDate) {
    // Chiffre d'affaires
    $salesStmt = $pdo->prepare("
        SELECT 
            SUM(total_amount) as ca_brut,
            SUM(discount_amount) as total_discounts,
            SUM(tax_amount) as total_tax,
            SUM(net_amount) as ca_net,
            COUNT(*) as nb_ventes,
            AVG(net_amount) as ticket_moyen
        FROM sales
        WHERE DATE(sale_date) >= ? AND DATE(sale_date) <= ? AND status = 'completed'
    ");
    $salesStmt->execute([$startDate, $endDate]);
    $sales = $salesStmt->fetch();
    
    // Coût des marchandises vendues (COGS)
    $cogsStmt = $pdo->prepare("
        SELECT SUM(p.purchase_price * si.quantity) as cogs
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE DATE(s.sale_date) >= ? AND DATE(s.sale_date) <= ? AND s.status = 'completed'
    ");
    $cogsStmt->execute([$startDate, $endDate]);
    $cogsResult = $cogsStmt->fetch();
    $cogs = (float)$cogsResult['cogs'] ?: 0.00;
    
    // Marge brute
    $marginStmt = $pdo->prepare("
        SELECT SUM((si.unit_price - p.purchase_price) * si.quantity) as margin
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE DATE(s.sale_date) >= ? AND DATE(s.sale_date) <= ? AND s.status = 'completed'
    ");
    $marginStmt->execute([$startDate, $endDate]);
    $marginResult = $marginStmt->fetch();
    $grossMargin = (float)$marginResult['margin'] ?: 0.00;
    
    // Dépenses
    $expenseStmt = $pdo->prepare("
        SELECT SUM(amount) as total FROM expenses WHERE expense_date >= ? AND expense_date <= ?
    ");
    $expenseStmt->execute([$startDate, $endDate]);
    $expenses = (float)$expenseStmt->fetchColumn() ?: 0.00;
    
    // Masse salariale
    $salaryStmt = $pdo->prepare("
        SELECT SUM(net_salary) as total FROM payslips 
        WHERE period_start >= ? AND period_start <= ?
    ");
    $salaryStmt->execute([$startDate, $endDate]);
    $payroll = (float)$salaryStmt->fetchColumn() ?: 0.00;
    
    // Clients créanciers (dettes clients)
    $clientDebtStmt = $pdo->query("SELECT SUM(ABS(balance)) as total FROM clients WHERE balance < 0");
    $clientDebt = (float)$clientDebtStmt->fetchColumn() ?: 0.00;
    
    // Clients débiteurs (crédits accordés)
    $clientCreditStmt = $pdo->query("SELECT SUM(balance) as total FROM clients WHERE balance > 0");
    $clientCredit = (float)$clientCreditStmt->fetchColumn() ?: 0.00;
    
    return [
        'ca_brut' => $sales['ca_brut'] ? (float)$sales['ca_brut'] : 0.00,
        'ca_net' => $sales['ca_net'] ? (float)$sales['ca_net'] : 0.00,
        'total_discounts' => $sales['total_discounts'] ? (float)$sales['total_discounts'] : 0.00,
        'total_tax' => $sales['total_tax'] ? (float)$sales['total_tax'] : 0.00,
        'nb_ventes' => (int)$sales['nb_ventes'],
        'ticket_moyen' => $sales['ticket_moyen'] ? (float)$sales['ticket_moyen'] : 0.00,
        'cogs' => $cogs,
        'gross_margin' => $grossMargin,
        'gross_margin_percent' => $sales['ca_brut'] > 0 ? round(($grossMargin / $sales['ca_brut']) * 100, 2) : 0,
        'operating_expenses' => $expenses,
        'payroll' => $payroll,
        'net_profit' => $grossMargin - $expenses - $payroll,
        'client_debt' => $clientDebt,
        'client_credit' => $clientCredit,
        'net_client_position' => $clientCredit - $clientDebt
    ];
}

function getMonthlyEvolution($pdo) {
    $stmt = $pdo->prepare("
        SELECT 
            DATE_FORMAT(sale_date, '%Y-%m') as month,
            SUM(net_amount) as ca_net,
            COUNT(*) as nb_ventes,
            SUM((si.unit_price - p.purchase_price) * si.quantity) as margin
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.status = 'completed'
        GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
    ");
    $stmt->execute();
    return $stmt->fetchAll();
}

function getDetailedReport($pdo, $startDate, $endDate) {
    // Ventes par catégorie
    $stmt = $pdo->prepare("
        SELECT 
            c.name as category,
            COUNT(DISTINCT s.id) as nb_ventes,
            SUM(si.quantity) as qty_sold,
            SUM(si.unit_price * si.quantity) as ca,
            SUM((si.unit_price - p.purchase_price) * si.quantity) as margin
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE DATE(s.sale_date) >= ? AND DATE(s.sale_date) <= ? AND s.status = 'completed'
        GROUP BY c.id, c.name
        ORDER BY ca DESC
    ");
    $stmt->execute([$startDate, $endDate]);
    return $stmt->fetchAll();
}

function getClientBalances($pdo) {
    $stmt = $pdo->query("
        SELECT 
            id, name, phone, email,
            CASE 
                WHEN balance > 0 THEN CONCAT(balance, ' (crédit accordé)')
                WHEN balance < 0 THEN CONCAT(ABS(balance), ' (dû par client)')
                ELSE '0'
            END as balance_display,
            balance as balance_raw,
            loyalty_points
        FROM clients
        WHERE balance != 0
        ORDER BY ABS(balance) DESC
    ");
    return $stmt->fetchAll();
}

function syncClientBalance($pdo, $clientId) {
    // Recalculer le solde du client basé sur les ventes
    $stmt = $pdo->prepare("
        SELECT SUM(net_amount) as total_sold FROM sales WHERE client_id = ? AND status = 'completed'
    ");
    $stmt->execute([$clientId]);
    $totalSold = (float)($stmt->fetchColumn() ?: 0);
    
    // Pour une gestion crédit plus avancée, on pourrait ajouter un système de paiements reçus
    // Pour maintenant, on considère que le solde est la différence entre les ventes et les paiements
    
    // La synchronisation pourrait aussi vérifier si le client a payé
    // C'est un placeholder pour une implémentation plus complète
}
?>
