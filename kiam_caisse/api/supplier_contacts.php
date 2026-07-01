<?php
/**
 * API REST Contacts Fournisseurs
 * Endpoints:
 * GET    /api/supplier_contacts.php?supplier_id=XX           - Liste contacts
 * POST   /api/supplier_contacts.php                           - Créer contact
 * PUT    /api/supplier_contacts.php?id=XX                    - Modifier contact
 * DELETE /api/supplier_contacts.php?id=XX                    - Supprimer contact
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
    // GET - Récupérer contacts
    // ================================================================
    if ($method === 'GET') {
        if (!$supplier_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'supplier_id requis']);
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT * FROM supplier_contacts WHERE supplier_id = ? ORDER BY is_primary DESC, name ASC");
        $stmt->execute([$supplier_id]);
        $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $contacts
        ]);
        exit;
    }
    
    // ================================================================
    // POST - Créer contact
    // ================================================================
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['supplier_id']) || empty($data['name']) || empty($data['phone'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'supplier_id, name et phone requis']);
            exit;
        }
        
        // Si ce contact doit être primaire, démarquer les autres
        if ($data['is_primary'] ?? false) {
            $stmt = $pdo->prepare("UPDATE supplier_contacts SET is_primary = FALSE WHERE supplier_id = ?");
            $stmt->execute([$data['supplier_id']]);
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO supplier_contacts (
                supplier_id, name, title, phone, email, mobile, fax, 
                is_primary, is_active, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['supplier_id'],
            $data['name'],
            $data['title'] ?? null,
            $data['phone'],
            $data['email'] ?? null,
            $data['mobile'] ?? null,
            $data['fax'] ?? null,
            $data['is_primary'] ?? false,
            $data['is_active'] ?? true,
            $data['notes'] ?? null
        ]);
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Contact créé',
            'contact_id' => (int)$pdo->lastInsertId()
        ]);
        exit;
    }
    
    // ================================================================
    // PUT - Modifier contact
    // ================================================================
    if ($method === 'PUT') {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID requis']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Récupérer le contact pour obtenir supplier_id
        $stmt = $pdo->prepare("SELECT supplier_id FROM supplier_contacts WHERE id = ?");
        $stmt->execute([$id]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Contact non trouvé']);
            exit;
        }
        
        // Si ce contact doit être primaire, démarquer les autres
        if (($data['is_primary'] ?? false) === true) {
            $stmt = $pdo->prepare("UPDATE supplier_contacts SET is_primary = FALSE WHERE supplier_id = ? AND id != ?");
            $stmt->execute([$contact['supplier_id'], $id]);
        }
        
        $updateFields = [];
        $params = [];
        $fieldMap = ['name', 'title', 'phone', 'email', 'mobile', 'fax', 'is_primary', 'is_active', 'notes'];
        
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
        $query = "UPDATE supplier_contacts SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Contact modifié']);
        exit;
    }
    
    // ================================================================
    // DELETE - Supprimer contact
    // ================================================================
    if ($method === 'DELETE') {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID requis']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM supplier_contacts WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Contact non trouvé']);
            exit;
        }
        
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Contact supprimé']);
        exit;
    }
    
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur: ' . $e->getMessage()]);
}
?>
