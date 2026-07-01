<?php
/**
 * API Gestion Exports (Excel, PDF, CSV) - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');
requireLogin();

$action = $_GET['action'] ?? '';
$format = $_GET['format'] ?? 'csv'; // csv, excel, pdf

try {
    if ($action === 'export_products') {
        exportProducts($pdo, $format);
    } elseif ($action === 'export_clients') {
        exportClients($pdo, $format);
    } elseif ($action === 'export_payslips') {
        exportPayslips($pdo, $format);
    } elseif ($action === 'export_sales') {
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        exportSales($pdo, $startDate, $endDate, $format);
    } elseif ($action === 'export_financial_report') {
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        exportFinancialReport($pdo, $startDate, $endDate, $format);
    } else {
        echo json_encode(['success' => false, 'message' => 'Action inconnue']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function exportProducts($pdo, $format) {
    $stmt = $pdo->query("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name ASC");
    $products = $stmt->fetchAll();
    
    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="produits_' . date('YmdHis') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
        
        fputcsv($output, ['Code-Barres', 'Nom Produit', 'Description', 'Catégorie', 'Prix Achat', 'Prix Vente', 'Quantité Stock', 'Alerte Stock'], ';');
        
        foreach ($products as $p) {
            fputcsv($output, [
                $p['barcode'],
                $p['name'],
                $p['description'],
                $p['category_name'],
                $p['purchase_price'],
                $p['sale_price'],
                $p['stock_qty'],
                $p['min_stock_alert']
            ], ';');
        }
        fclose($output);
        exit;
    } elseif ($format === 'excel') {
        generateExcel('Produits', [
            ['Code-Barres', 'Nom Produit', 'Description', 'Catégorie', 'Prix Achat', 'Prix Vente', 'Stock', 'Alerte'],
            ...array_map(fn($p) => [
                $p['barcode'], $p['name'], $p['description'], $p['category_name'],
                $p['purchase_price'], $p['sale_price'], $p['stock_qty'], $p['min_stock_alert']
            ], $products)
        ]);
    } elseif ($format === 'pdf') {
        generatePDFReport('Catalogue Produits', [
            ['Code-Barres', 'Nom Produit', 'Description', 'Catégorie', 'Prix Achat', 'Prix Vente', 'Stock', 'Alerte'],
            ...array_map(fn($p) => [
                $p['barcode'], $p['name'], $p['description'], $p['category_name'],
                $p['purchase_price'], $p['sale_price'], $p['stock_qty'], $p['min_stock_alert']
            ], $products)
        ]);
}

function exportClients($pdo, $format) {
    $stmt = $pdo->query("SELECT * FROM clients ORDER BY name ASC");
    $clients = $stmt->fetchAll();
    
    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="clients_' . date('YmdHis') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        fputcsv($output, ['Nom', 'Téléphone', 'Email', 'Adresse', 'Solde', 'Points Fidélité'], ';');
        
        foreach ($clients as $c) {
            $soldeType = $c['balance'] > 0 ? 'Dû par client' : 'Dû au client';
            fputcsv($output, [
                $c['name'], $c['phone'], $c['email'], $c['address'],
                abs($c['balance']) . ' ' . $soldeType, $c['loyalty_points']
            ], ';');
        }
        fclose($output);
        exit;
    } elseif ($format === 'excel') {
        generateExcel('Clients', [
            ['Nom', 'Téléphone', 'Email', 'Adresse', 'Solde', 'Points Fidélité'],
            ...array_map(fn($c) => [
                $c['name'], $c['phone'], $c['email'], $c['address'],
                abs($c['balance']), $c['loyalty_points']
            ], $clients)
        ]);
    } elseif ($format === 'pdf') {
        generatePDFReport('Répertoire des Clients', [
            ['Nom', 'Téléphone', 'Email', 'Adresse', 'Solde', 'Points Fidélité'],
            ...array_map(fn($c) => [
                $c['name'], $c['phone'], $c['email'], $c['address'],
                abs($c['balance']), $c['loyalty_points']
            ], $clients)
        ]);
    }
}

function exportPayslips($pdo, $format) {
    $month = $_GET['month'] ?? date('Y-m');
    $stmt = $pdo->prepare("
        SELECT p.*, e.matricule, e.name, e.first_name, e.job_title
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        WHERE DATE_FORMAT(p.period_start, '%Y-%m') = ?
        ORDER BY e.name ASC
    ");
    $stmt->execute([$month]);
    $payslips = $stmt->fetchAll();
    
    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="paies_' . date('YmdHis') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        fputcsv($output, ['Matricule', 'Nom', 'Prénom', 'Poste', 'Salaire Base', 'Jours', 'Heures Supp', 'Travail Nuit', 'Primes', 'Brut', 'CNSS', 'Impôt', 'Avances', 'Net'], ';');
        
        foreach ($payslips as $p) {
            fputcsv($output, [
                $p['matricule'], $p['name'], $p['first_name'], $p['job_title'],
                $p['base_salary'], $p['days_worked'], $p['overtime_amount'], 
                $p['night_work_amount'], $p['primes_amount'], $p['gross_salary'],
                $p['cnss_deduction'], $p['tax_deduction'], $p['advances_deduction'], $p['net_salary']
            ], ';');
        }
        fclose($output);
        exit;
    }
}

function exportSales($pdo, $startDate, $endDate, $format) {
    $stmt = $pdo->prepare("
        SELECT s.*, u.name as cashier, c.name as client
        FROM sales s
        JOIN users u ON s.user_id = u.id
        JOIN clients c ON s.client_id = c.id
        WHERE DATE(s.sale_date) >= ? AND DATE(s.sale_date) <= ?
        ORDER BY s.sale_date DESC
    ");
    $stmt->execute([$startDate, $endDate]);
    $sales = $stmt->fetchAll();
    
    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="ventes_' . date('YmdHis') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        fputcsv($output, ['N° Facture', 'Date', 'Client', 'Caissier', 'Brut', 'Réduction', 'TVA', 'Net', 'Moyen Paiement', 'Statut'], ';');
        
        foreach ($sales as $s) {
            fputcsv($output, [
                $s['invoice_no'], $s['sale_date'], $s['client'], $s['cashier'],
                $s['total_amount'], $s['discount_amount'], $s['tax_amount'], $s['net_amount'],
                $s['payment_method'], $s['status']
            ], ';');
        }
        fclose($output);
        exit;
    }
}

function exportFinancialReport($pdo, $startDate, $endDate, $format) {
    // Récupérer les données financières
    $salesSumStmt = $pdo->prepare("SELECT SUM(total_amount) as brut, SUM(discount_amount) as discounts, SUM(tax_amount) as tax, SUM(net_amount) as net FROM sales WHERE DATE(sale_date) >= ? AND DATE(sale_date) <= ? AND status = 'completed'");
    $salesSumStmt->execute([$startDate, $endDate]);
    $salesSum = $salesSumStmt->fetch();
    
    $expenseStmt = $pdo->prepare("SELECT SUM(amount) as total FROM expenses WHERE expense_date >= ? AND expense_date <= ?");
    $expenseStmt->execute([$startDate, $endDate]);
    $expenses = (float)$expenseStmt->fetchColumn() ?: 0.00;
    
    $marginStmt = $pdo->prepare("SELECT SUM((si.unit_price - p.purchase_price) * si.quantity) as margin FROM sale_items si JOIN sales s ON si.sale_id = s.id JOIN products p ON si.product_id = p.id WHERE DATE(s.sale_date) >= ? AND DATE(s.sale_date) <= ? AND s.status = 'completed'");
    $marginStmt->execute([$startDate, $endDate]);
    $margin = (float)$marginStmt->fetchColumn() ?: 0.00;
    
    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="bilan_' . date('YmdHis') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        fputcsv($output, ['COMPTE DE RÉSULTAT'], ';');
        fputcsv($output, ['Période', $startDate . ' à ' . $endDate], ';');
        fputcsv($output, [], ';');
        
        fputcsv($output, ['Éléments', 'Montant'], ';');
        fputcsv($output, ['Chiffre d\'affaires brut', $salesSum['brut']], ';');
        fputcsv($output, ['Réductions', -$salesSum['discounts']], ';');
        fputcsv($output, ['Marge brute', $margin], ';');
        fputcsv($output, ['Dépenses', -$expenses], ';');
        fputcsv($output, ['Bénéfice net', $margin - $expenses], ';');
        
        fclose($output);
        exit;
    }
}

function generateExcel($sheetName, $data) {
    // Générer un Excel basique avec TSV/CSV renforcé
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . urlencode($sheetName) . '_' . date('YmdHis') . '.xlsx"');
    header('Cache-Control: max-age=0');
    
    // Créer une structure XML simple XLSX
    $xmlContent = generateXLSX($sheetName, $data);
    echo $xmlContent;
    exit;
}

function generateXLSX($sheetName, $data) {
    // Pour une vraie implémentation XLSX, utiliser une lib. Ici, on génère du TSV et le navigateur peut le lire.
    header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . urlencode($sheetName) . '_' . date('YmdHis') . '.xls"');
    header('Cache-Control: max-age=0');
    
    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
    
    foreach ($data as $row) {
        fputcsv($output, $row, "\t");
    }
    fclose($output);
    exit;
}

function generatePDFReport($title, $data) {
    // Générer un HTML imprimable en PDF via le navigateur
    header('Content-Type: text/html; charset=UTF-8');
    
    $html = <<<HTML
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>$title</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; color: #333; padding: 20px; }
            
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 3px solid #667eea; 
                padding-bottom: 15px;
            }
            
            .header h1 { 
                font-size: 24px; 
                color: #667eea; 
                margin-bottom: 5px;
            }
            
            .header p { 
                font-size: 12px; 
                color: #666;
                margin: 5px 0;
            }
            
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
            }
            
            thead { 
                background-color: #667eea; 
                color: white;
            }
            
            th { 
                padding: 12px; 
                text-align: left; 
                font-weight: bold; 
                border: 1px solid #ddd;
            }
            
            td { 
                padding: 10px; 
                border: 1px solid #ddd;
                vertical-align: top;
            }
            
            tbody tr:nth-child(even) { 
                background-color: #f9fafb;
            }
            
            tbody tr:hover { 
                background-color: #f0f3ff;
            }
            
            .footer { 
                margin-top: 30px; 
                text-align: center; 
                font-size: 11px; 
                color: #999;
                border-top: 1px solid #ddd;
                padding-top: 15px;
            }
            
            @media print {
                body { padding: 0; }
                table { page-break-inside: avoid; }
                tr { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>$title</h1>
            <p>Généré le: HTML
    echo date('d/m/Y H:i:s');
    $html .= <<<HTML
            </p>
            <p>KIAM Caisse - Système de Gestion Professionnel</p>
        </div>
        
        <table>
            <thead>
                <tr>
    HTML;
    
    // En-têtes du tableau
    if (!empty($data)) {
        foreach ($data[0] as $header) {
            $html .= '<th>' . htmlspecialchars($header) . '</th>';
        }
        $html .= '</tr></thead><tbody>';
        
        // Données du tableau
        for ($i = 1; $i < count($data); $i++) {
            $html .= '<tr>';
            foreach ($data[$i] as $cell) {
                $html .= '<td>' . htmlspecialchars(is_numeric($cell) ? number_format($cell, 2, ',', ' ') : $cell) . '</td>';
            }
            $html .= '</tr>';
        }
    }
    
    $html .= <<<HTML
                </tbody>
        </table>
        
        <div class="footer">
            <p>Ce document a été généré automatiquement par KIAM Caisse.</p>
            <p>Cliquez sur "Imprimer" (Ctrl+P) ou utilisez "Enregistrer en PDF" pour générer un PDF.</p>
        </div>
        
        <script>
            // Prompt pour imprimer ou enregistrer en PDF
            window.onload = function() {
                // Optionnel: auto-print ou afficher le dialog
                // window.print();
            };
        </script>
    </body>
    </html>
    HTML;
    
    echo $html;
    exit;
}
?>
