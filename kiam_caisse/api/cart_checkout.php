<?php
/**
 * API Validation des Ventes (Checkout) - KIAM Caisse
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection API
if (!isLoggedIn()) {
    echo json_encode(['error' => 'Non authentifié']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

// Récupérer le contenu JSON
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['items'])) {
    echo json_encode(['success' => false, 'error' => 'Le panier est vide.']);
    exit;
}

$clientId = isset($data['client_id']) ? (int)$data['client_id'] : 1; // Client Passage par défaut
$paymentMethod = $data['payment_method'] ?? 'cash';
$amountPaid = isset($data['amount_paid']) ? (float)$data['amount_paid'] : 0.00;
$discountAmount = isset($data['discount_amount']) ? (float)$data['discount_amount'] : 0.00;
$userId = $_SESSION['user_id'];

// Vérifier si une session de caisse est active
$sessionStmt = $pdo->prepare("SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'open' LIMIT 1");
$sessionStmt->execute([$userId]);
$session = $sessionStmt->fetch();
if (!$session) {
    echo json_encode(['success' => false, 'error' => 'Aucune session de caisse ouverte. Veuillez ouvrir la caisse d\'abord.']);
    exit;
}
$sessionId = $session['id'];

try {
    // 1. Démarrer la transaction pour garantir l'intégrité financière et des stocks
    $pdo->beginTransaction();

    // Récupérer le taux de TVA en vigueur dans les paramètres
    $settingsStmt = $pdo->query("SELECT tax_rate, company_name, company_phone, company_address, currency, company_logo FROM settings LIMIT 1");
    $shopSettings = $settingsStmt->fetch();
    $taxRate = isset($shopSettings['tax_rate']) ? (float)$shopSettings['tax_rate'] : 18.00;
    
    // Générer un numéro de facture unique (Ex: KIAM-20260518-1425)
    $today = date('Ymd');
    $stmtCount = $pdo->query("SELECT COUNT(*) FROM sales WHERE DATE(created_at) = CURDATE()");
    $dailyCount = (int)$stmtCount->fetchColumn() + 1;
    $invoiceNo = "FAV-" . $today . "-" . str_pad($dailyCount, 4, '0', STR_PAD_LEFT);

    $totalBrut = 0.00;
    $checkedItems = [];

    // 2. Vérifier les produits et calculer les montants
    $prodStmt = $pdo->prepare("SELECT id, name, purchase_price, sale_price, stock_qty, min_stock_alert FROM products WHERE id = ?");
    
    foreach ($data['items'] as $item) {
        $productId = (int)$item['id'];
        $qtyOrdered = (int)$item['qty'];
        
        if ($qtyOrdered <= 0) continue;
        
        $prodStmt->execute([$productId]);
        $product = $prodStmt->fetch();
        
        if (!$product) {
            throw new Exception("Produit introuvable (ID: $productId)");
        }
        
        // Calculer le sous-total brut
        $subtotal = $product['sale_price'] * $qtyOrdered;
        $totalBrut += $subtotal;
        
        $checkedItems[] = [
            'id' => $product['id'],
            'name' => $product['name'],
            'price' => (float)$product['sale_price'],
            'qty' => $qtyOrdered,
            'subtotal' => $subtotal,
            'current_stock' => $product['stock_qty']
        ];
    }

    if (empty($checkedItems)) {
        throw new Exception("Aucun article valide dans le panier.");
    }

    // 3. Calculs financiers
    $taxableAmount = $totalBrut - $discountAmount;
    if ($taxableAmount < 0) $taxableAmount = 0.00;
    
    $applyTax = isset($data['apply_tax']) ? $data['apply_tax'] : true;
    $applyCss = isset($data['apply_css']) ? $data['apply_css'] : true;

    $taxAmount = $applyTax ? round($taxableAmount * ($taxRate / 100), 2) : 0.00;
    $cssAmount = $applyCss ? round($taxableAmount * 0.05, 2) : 0.00; // 5% CA/CSS
    
    $netAmount = $taxableAmount + $taxAmount + $cssAmount;
    
    $changeAmount = $amountPaid - $netAmount;
    if ($changeAmount < 0) $changeAmount = 0.00;

    // 4. Insérer l'enregistrement de vente
    $stmtInsertSale = $pdo->prepare("
        INSERT INTO sales (invoice_no, user_id, client_id, session_id, total_amount, discount_amount, tax_amount, css_amount, net_amount, payment_method, amount_paid, change_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmtInsertSale->execute([
        $invoiceNo, $userId, $clientId, $sessionId, $totalBrut, $discountAmount, $taxAmount, $cssAmount, $netAmount, $paymentMethod, $amountPaid, $changeAmount
    ]);
    
    $saleId = $pdo->lastInsertId();

    // 5. Insérer les articles vendus, déduire le stock et enregistrer les mouvements
    $stmtInsertItem = $pdo->prepare("
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmtUpdateStock = $pdo->prepare("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?");
    $stmtStockMove = $pdo->prepare("
        INSERT INTO stock_movements (product_id, type, quantity, reference_id, notes, user_id)
        VALUES (?, 'out', ?, ?, 'Vente caisse', ?)
    ");

    foreach ($checkedItems as $item) {
        // Enregistrer l'item
        $stmtInsertItem->execute([
            $saleId, $item['id'], $item['qty'], $item['price'], $item['subtotal']
        ]);
        
        // Déduire le stock
        $stmtUpdateStock->execute([
            $item['qty'], $item['id']
        ]);
        
        // Logger le mouvement de stock
        $stmtStockMove->execute([
            $item['id'], $item['qty'], $saleId, $userId
        ]);
    }

    // 6. Fidélité Client : 1 point par tranche de 1000 FCFA dépensée
    if ($clientId > 1) { // Ne pas attribuer de points au Client de Passage standard
        $pointsEarned = floor($netAmount / 1000);
        if ($pointsEarned > 0) {
            $stmtLoyalty = $pdo->prepare("UPDATE clients SET loyalty_points = loyalty_points + ? WHERE id = ?");
            $stmtLoyalty->execute([$pointsEarned, $clientId]);
        }
    }

    // Récupérer le nom du client pour le reçu
    $clientStmt = $pdo->prepare("SELECT name, phone FROM clients WHERE id = ?");
    $clientStmt->execute([$clientId]);
    $clientInfo = $clientStmt->fetch();

    // 7. Valider et commiter la transaction
    $pdo->commit();

    // Enregistrer l'activité dans le journal d'audit
    logAction($pdo, $userId, "Vente validée. Facture N° $invoiceNo. Montant : $netAmount FCFA");

    // Renvoyer tous les détails requis pour l'affichage et l'impression thermique
    echo json_encode([
        'success' => true,
        'invoice' => [
            'id' => $saleId,
            'invoice_no' => $invoiceNo,
            'date' => date('d/m/Y H:i'),
            'total_brut' => $totalBrut,
            'discount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'css_amount' => $cssAmount,
            'net_amount' => $netAmount,
            'payment_method' => strtoupper($paymentMethod),
            'amount_paid' => $amountPaid,
            'change_amount' => $changeAmount,
            'cashier' => $_SESSION['user_name'],
            'client_name' => $clientInfo['name'] ?? 'Client de Passage',
            'client_phone' => $clientInfo['phone'] ?? '',
            'items' => $checkedItems
        ],
        'shop' => [
            'name' => $shopSettings['company_name'] ?? 'KIAM Boutique',
            'phone' => $shopSettings['company_phone'] ?? '',
            'address' => $shopSettings['company_address'] ?? '',
            'currency' => $shopSettings['currency'] ?? 'FCFA',
            'logo' => $shopSettings['company_logo'] ?? ''
        ]
    ]);

} catch (Exception $e) {
    // Annuler les modifications si une erreur survient
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
