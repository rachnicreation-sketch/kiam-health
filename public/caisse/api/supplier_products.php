<?php
/**
 * API REST Produits Fournisseurs
 * Endpoints:
 * GET    /api/supplier_products.php?supplier_id=XX       - Liste produits d'un fournisseur
 * POST   /api/supplier_products.php                       - Ajouter produit fournisseur
 * PUT    /api/supplier_products.php?id=XX               - Modifier produit fournisseur
 * DELETE /api/supplier_products.php?id=XX               - Supprimer produit fournisseur
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('USE kiam_caisse');
    
    $method = $_SERVER['REQUEST_METHOD'];
    $id = $_GET['id'] ?? null;
    $supplier_id = $_GET['supplier_id'] ?? null;
    
    // ================================================================
    // GET - Récupérer produits fournisseur
    // ================================================================
    if ($method === 'GET') {
        if (!$supplier_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'supplier_id requis']);
            exit;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                sp.id,
                sp.product_id,
                p.name as product_name,
                p.barcode,
                p.sale_price,
                sp.supplier_sku,
                sp.supplier_barcode,
                sp.purchase_price,
                sp.minimum_order_qty,
                sp.pack_qty,
                sp.lead_time_days,
                sp.is_preferred,
                sp.is_active,
                sp.last_price_update,
                (p.sale_price - sp.purchase_price) as gross_margin,
                ROUND(((p.sale_price - sp.purchase_price) / p.sale_price * 100), 2) as margin_percent
            FROM supplier_products sp
            JOIN products p ON sp.product_id = p.id
            WHERE sp.supplier_id = ?
            ORDER BY p.name ASC
        ");
        $stmt->execute([$supplier_id]);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $products,
            'count' => count($products)
        ]);
        exit;
    }
    
    // ================================================================
    // POST - Ajouter produit fournisseur
    // ================================================================
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validation
        $required = ['supplier_id', 'product_id', 'purchase_price'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => "$field requis"]);
                exit;
            }
        }
        
        // Vérifier que le produit existe
        $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ?");
        $stmt->execute([$data['product_id']]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Produit non trouvé']);
            exit;
        }
        
        // Vérifier que c'est pas un doublon
        $stmt = $pdo->prepare("SELECT id FROM supplier_products WHERE supplier_id = ? AND product_id = ?");
        $stmt->execute([$data['supplier_id'], $data['product_id']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Ce produit est déjà associé à ce fournisseur']);
            exit;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO supplier_products (
                supplier_id, product_id, supplier_sku, supplier_barcode,
                purchase_price, minimum_order_qty, pack_qty, lead_time_days,
                is_preferred, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['supplier_id'],
            $data['product_id'],
            $data['supplier_sku'] ?? null,
            $data['supplier_barcode'] ?? null,
            $data['purchase_price'],
            $data['minimum_order_qty'] ?? 1,
            $data['pack_qty'] ?? 1,
            $data['lead_time_days'] ?? 0,
            $data['is_preferred'] ?? false,
            $data['is_active'] ?? true
        ]);
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Produit ajouté au fournisseur',
            'supplier_product_id' => (int)$pdo->lastInsertId()
        ]);
        exit;
    }
    
    // ================================================================
    // PUT - Modifier produit fournisseur
    // ================================================================
    if ($method === 'PUT') {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID requis']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Vérifier existence
        $stmt = $pdo->prepare("SELECT id FROM supplier_products WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Produit fournisseur non trouvé']);
            exit;
        }
        
        $updateFields = [];
        $params = [];
        $fieldMap = [
            'supplier_sku', 'supplier_barcode', 'purchase_price',
            'minimum_order_qty', 'pack_qty', 'lead_time_days',
            'is_preferred', 'is_active'
        ];
        
        foreach ($fieldMap as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "`$field` = ?";
                $params[] = $data[$field];
            }
        }
        
        // Historiser changement de prix
        if (isset($data['purchase_price'])) {
            $stmt = $pdo->prepare("SELECT purchase_price FROM supplier_products WHERE id = ?");
            $stmt->execute([$id]);
            $old = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($old && $old['purchase_price'] != $data['purchase_price']) {
                $stmt = $pdo->prepare("
                    INSERT INTO supplier_price_history (
                        supplier_product_id, old_price, new_price,
                        reason, changed_by
                    ) VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id,
                    $old['purchase_price'],
                    $data['purchase_price'],
                    $data['reason'] ?? 'Mise à jour tarifaire',
                    $_SESSION['user_id'] ?? null
                ]);
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Aucun champ à mettre à jour']);
            exit;
        }
        
        $params[] = $id;
        $query = "UPDATE supplier_products SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Produit modifié']);
        exit;
    }
    
    // ================================================================
    // DELETE - Supprimer produit fournisseur
    // ================================================================
    if ($method === 'DELETE') {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID requis']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM supplier_products WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Produit non trouvé']);
            exit;
        }
        
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Produit supprimé']);
        exit;
    }
    
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur: ' . $e->getMessage()]);
}
?>
