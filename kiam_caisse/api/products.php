<?php
/**
 * API Recherche Produits - KIAM Caisse
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection API : l'utilisateur doit être connecté
if (!isLoggedIn()) {
    echo json_encode(['error' => 'Non authentifié']);
    exit;
}

// Si demande de réimpression de reçu historique
if (isset($_GET['get_sale_receipt']) && isset($_GET['sale_id'])) {
    $saleId = (int)$_GET['sale_id'];
    try {
        // Paramètres boutique
        $settingsStmt = $pdo->query("SELECT tax_rate, company_name, company_phone, company_address, currency, company_logo FROM settings LIMIT 1");
        $shopSettings = $settingsStmt->fetch();

        // Infos vente
        $saleStmt = $pdo->prepare("
            SELECT s.*, u.name as cashier_name, c.name as client_name, c.phone as client_phone
            FROM sales s
            JOIN users u ON s.user_id = u.id
            JOIN clients c ON s.client_id = c.id
            WHERE s.id = ?
        ");
        $saleStmt->execute([$saleId]);
        $sale = $saleStmt->fetch();

        if (!$sale) {
            echo json_encode(['error' => 'Facture introuvable']);
            exit;
        }

        // Articles vendus
        $itemsStmt = $pdo->prepare("
            SELECT si.*, p.name as name
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        ");
        $itemsStmt->execute([$saleId]);
        $items = $itemsStmt->fetchAll();

        $formattedItems = [];
        foreach ($items as $item) {
            $formattedItems[] = [
                'id' => $item['product_id'],
                'name' => $item['name'],
                'price' => (float)$item['unit_price'],
                'qty' => (int)$item['quantity'],
                'subtotal' => (float)$item['subtotal']
            ];
        }

        echo json_encode([
            'invoice' => [
                'id' => $sale['id'],
                'invoice_no' => $sale['invoice_no'],
                'date' => date('d/m/Y H:i', strtotime($sale['created_at'])),
                'total_brut' => (float)$sale['total_amount'],
                'discount' => (float)$sale['discount_amount'],
                'tax_amount' => (float)$sale['tax_amount'],
                'css_amount' => (float)$sale['css_amount'],
                'net_amount' => (float)$sale['net_amount'],
                'payment_method' => strtoupper($sale['payment_method']),
                'amount_paid' => (float)$sale['amount_paid'],
                'change_amount' => (float)$sale['change_amount'],
                'cashier' => $sale['cashier_name'],
                'client_name' => $sale['client_name'],
                'client_phone' => $sale['client_phone'],
                'items' => $formattedItems
            ],
            'shop' => [
                'name' => $shopSettings['company_name'] ?? 'KIAM Boutique',
                'phone' => $shopSettings['company_phone'] ?? '',
                'address' => $shopSettings['company_address'] ?? '',
                'currency' => $shopSettings['currency'] ?? 'FCFA',
                'logo' => $shopSettings['company_logo'] ?? ''
            ]
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur reçu : ' . $e->getMessage()]);
        exit;
    }
}

$search = trim($_GET['search'] ?? '');
$categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;

try {
    $query = "SELECT p.*, c.name as category_name 
              FROM products p 
              LEFT JOIN categories c ON p.category_id = c.id 
              WHERE 1=1";
    $params = [];

    // Filtre par catégorie
    if ($categoryId > 0) {
        $query .= " AND p.category_id = ?";
        $params[] = $categoryId;
    }

    // Filtre de recherche (par nom ou par code-barres)
    if (!empty($search)) {
        // Si c'est un scan exact de code-barres (numérique et longueur standard)
        if (is_numeric($search) && (strlen($search) >= 8 && strlen($search) <= 15)) {
            $query .= " AND p.barcode = ?";
            $params[] = $search;
        } else {
            // Recherche textuelle classique
            $query .= " AND (p.name LIKE ? OR p.barcode LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
    }

    $query .= " ORDER BY p.stock_qty <= p.min_stock_alert DESC, p.name ASC LIMIT 50";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    // Formater les prix pour un rendu propre
    foreach ($products as &$p) {
        $p['purchase_price'] = (float)$p['purchase_price'];
        $p['sale_price'] = (float)$p['sale_price'];
        $p['stock_qty'] = (int)$p['stock_qty'];
        $p['min_stock_alert'] = (int)$p['min_stock_alert'];
    }

    echo json_encode($products);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur : ' . $e->getMessage()]);
}
?>
