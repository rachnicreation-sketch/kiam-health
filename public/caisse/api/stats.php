<?php
/**
 * API Statistiques Dashboard - KIAM Caisse
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : réservé aux Admins et Gestionnaires
if (!isLoggedIn() || !in_array($_SESSION['user_role'], ['admin', 'manager'])) {
    echo json_encode(['error' => 'Non autorisé']);
    exit;
}

try {
    $stats = [];

    // 1. Chiffre d'affaires du jour (Turnover Today)
    $stmtCA = $pdo->query("SELECT SUM(net_amount) FROM sales WHERE DATE(sale_date) = CURDATE() AND status = 'completed'");
    $stats['ca_today'] = (float)$stmtCA->fetchColumn() ?: 0.00;

    // 2. Bénéfices du jour (Net Profit Today)
    $stmtProfit = $pdo->query("
        SELECT SUM((si.unit_price - p.purchase_price) * si.quantity) 
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE DATE(s.sale_date) = CURDATE() AND s.status = 'completed'
    ");
    $stats['profit_today'] = (float)$stmtProfit->fetchColumn() ?: 0.00;

    // 3. Dépenses totales du mois courant (Current Month Expenses)
    $stmtExpenses = $pdo->query("SELECT SUM(amount) FROM expenses WHERE MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE())");
    $stats['expenses_month'] = (float)$stmtExpenses->fetchColumn() ?: 0.00;

    // 4. Produits en alerte de stock (Low stock alert)
    $stmtLowStock = $pdo->query("SELECT COUNT(*) FROM products WHERE stock_qty <= min_stock_alert");
    $stats['low_stock_count'] = (int)$stmtLowStock->fetchColumn() ?: 0;

    // 5. Évolution des ventes sur les 10 derniers jours (Daily trends over 10 days)
    $salesTrend = [];
    $profitTrend = [];
    $labels = [];
    
    for ($i = 9; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $label = date('d M', strtotime("-$i days"));
        $labels[] = $label;

        // Vente de ce jour
        $stmtDayCA = $pdo->prepare("SELECT SUM(net_amount) FROM sales WHERE DATE(sale_date) = ? AND status = 'completed'");
        $stmtDayCA->execute([$date]);
        $salesTrend[] = (float)$stmtDayCA->fetchColumn() ?: 0.00;

        // Bénéfice de ce jour
        $stmtDayProfit = $pdo->prepare("
            SELECT SUM((si.unit_price - p.purchase_price) * si.quantity) 
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE DATE(s.sale_date) = ? AND s.status = 'completed'
        ");
        $stmtDayProfit->execute([$date]);
        $profitTrend[] = (float)$stmtDayProfit->fetchColumn() ?: 0.00;
    }
    
    $stats['charts'] = [
        'labels' => $labels,
        'sales' => $salesTrend,
        'profits' => $profitTrend
    ];

    // 6. Top 5 des produits les plus vendus (Top 5 selling products)
    $stmtTopProd = $pdo->query("
        SELECT p.name, SUM(si.quantity) as total_sold
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.status = 'completed'
        GROUP BY si.product_id
        ORDER BY total_sold DESC
        LIMIT 5
    ");
    $stats['top_products'] = $stmtTopProd->fetchAll() ?: [];

    // 7. Ventes par catégorie de produits (Category stats)
    $stmtCatSales = $pdo->query("
        SELECT c.name as category, SUM(si.quantity) as qty
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.status = 'completed'
        GROUP BY p.category_id
        ORDER BY qty DESC
    ");
    $stats['category_distribution'] = $stmtCatSales->fetchAll() ?: [];

    echo json_encode($stats);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur stats : ' . $e->getMessage()]);
}
?>
