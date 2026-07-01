<?php
/**
 * API REST Fournisseurs - CRUD Complet
 * Endpoints:
 * GET    /api/suppliers.php              - Liste fournisseurs
 * GET    /api/suppliers.php?id=XX        - Détail fournisseur
 * POST   /api/suppliers.php              - Créer fournisseur
 * PUT    /api/suppliers.php?id=XX        - Modifier fournisseur
 * DELETE /api/suppliers.php?id=XX        - Supprimer fournisseur
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Connexion BD
    $pdo = new PDO('mysql:host=localhost', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('USE kiam_caisse');
    
    $method = $_SERVER['REQUEST_METHOD'];
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;
    
    // ================================================================
    // GET - Récupérer fournisseur(s)
    // ================================================================
    if ($method === 'GET') {
        if ($action === 'list') {
            // Liste avec filtres
            $status = $_GET['status'] ?? null;
            $search = $_GET['search'] ?? null;
            
            $query = "SELECT 
                s.*, 
                COUNT(DISTINCT sp.id) as product_count,
                COUNT(DISTINCT sc.id) as contact_count,
                COALESCE(sp_perf.total_orders, 0) as total_orders,
                COALESCE(sp_perf.average_order_value, 0) as avg_order_value
            FROM suppliers s
            LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
            LEFT JOIN supplier_contacts sc ON s.id = sc.supplier_id
            LEFT JOIN supplier_performance sp_perf ON s.id = sp_perf.supplier_id
            WHERE 1=1";
            
            $params = [];
            
            if ($status) {
                $query .= " AND s.status = ?";
                $params[] = $status;
            }
            
            if ($search) {
                $query .= " AND (s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            $query .= " GROUP BY s.id ORDER BY s.name ASC";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $suppliers,
                'count' => count($suppliers)
            ]);
            
        } elseif ($id) {
            // Détail d'un fournisseur
            $stmt = $pdo->prepare("
                SELECT 
                    s.*,
                    COUNT(DISTINCT sp.id) as product_count,
                    COUNT(DISTINCT sc.id) as contact_count
                FROM suppliers s
                LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
                LEFT JOIN supplier_contacts sc ON s.id = sc.supplier_id
                WHERE s.id = ?
                GROUP BY s.id
            ");
            $stmt->execute([$id]);
            $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$supplier) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Fournisseur non trouvé']);
                exit;
            }
            
            // Récupérer contacts et produits
            $stmt = $pdo->prepare("SELECT * FROM supplier_contacts WHERE supplier_id = ? ORDER BY is_primary DESC, name ASC");
            $stmt->execute([$id]);
            $supplier['contacts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->prepare("
                SELECT sp.*, p.name as product_name, p.barcode
                FROM supplier_products sp
                JOIN products p ON sp.product_id = p.id
                WHERE sp.supplier_id = ?
                ORDER BY p.name ASC
            ");
            $stmt->execute([$id]);
            $supplier['products'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $supplier
            ]);
            
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID requis']);
        }
        exit;
    }
    
    // ================================================================
    // POST - Créer fournisseur
    // ================================================================
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validation
        if (empty($data['name']) || empty($data['email'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Nom et email requis']);
            exit;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO suppliers (
                name, phone, email, address, company_name, 
                rccm, niu, delivery_lead_time_days, payment_terms,
                payment_method, status, contact_person, website, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['name'],
            $data['phone'] ?? null,
            $data['email'],
            $data['address'] ?? null,
            $data['company_name'] ?? null,
            $data['rccm'] ?? null,
            $data['niu'] ?? null,
            $data['delivery_lead_time_days'] ?? 5,
            $data['payment_terms'] ?? 'net_30',
            $data['payment_method'] ?? null,
            $data['status'] ?? 'active',
            $data['contact_person'] ?? null,
            $data['website'] ?? null,
            $data['notes'] ?? null
        ]);
        
        $supplierId = $pdo->lastInsertId();
        
        // Créer enregistrement de performance
        $stmt = $pdo->prepare("INSERT INTO supplier_performance (supplier_id) VALUES (?)");
        $stmt->execute([$supplierId]);
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Fournisseur créé',
            'supplier_id' => (int)$supplierId
        ]);
        exit;
    }
    
    // ================================================================
    // PUT - Modifier fournisseur
    // ================================================================
    if ($method === 'PUT') {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID requis']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Vérifier existence
        $stmt = $pdo->prepare("SELECT id FROM suppliers WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Fournisseur non trouvé']);
            exit;
        }
        
        // Construire la requête UPDATE dynamiquement
        $updateFields = [];
        $params = [];
        $fieldMap = [
            'name', 'phone', 'email', 'address', 'company_name',
            'rccm', 'niu', 'delivery_lead_time_days', 'payment_terms',
            'payment_method', 'status', 'rating', 'contact_person', 
            'website', 'notes'
        ];
        
        foreach ($fieldMap as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "`$field` = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Aucun champ à mettre à jour']);
            exit;
        }
        
        $params[] = $id;
        $query = "UPDATE suppliers SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Fournisseur modifié'
        ]);
        exit;
    }
    
    // ================================================================
    // DELETE - Supprimer fournisseur
    // ================================================================
    if ($method === 'DELETE') {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID requis']);
            exit;
        }
        
        // Vérifier existence
        $stmt = $pdo->prepare("SELECT id FROM suppliers WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Fournisseur non trouvé']);
            exit;
        }
        
        // Vérifier si le fournisseur a des commandes
        $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM supplier_orders WHERE supplier_id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['cnt'] > 0) {
            http_response_code(409);
            echo json_encode([
                'success' => false, 
                'error' => "Impossible de supprimer: le fournisseur a {$result['cnt']} commande(s)",
                'conflict' => true
            ]);
            exit;
        }
        
        // Supprimer le fournisseur (cascade delete via FK)
        $stmt = $pdo->prepare("DELETE FROM suppliers WHERE id = ?");
        $stmt->execute([$id]);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Fournisseur supprimé'
        ]);
        exit;
    }
    
    // Méthode non supportée
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur base de données',
        'details' => $e->getMessage()
    ]);
}
?>
