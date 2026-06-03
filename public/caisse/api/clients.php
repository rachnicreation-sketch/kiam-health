<?php
/**
 * API Gestion Clients - KIAM Caisse
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection API : connecté
if (!isLoggedIn()) {
    echo json_encode(['error' => 'Non authentifié']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Recherche de clients
        $search = trim($_GET['search'] ?? '');
        
        $query = "SELECT id, name, phone, address, loyalty_points, balance FROM clients WHERE 1=1";
        $params = [];
        
        if (!empty($search)) {
            $query .= " AND (name LIKE ? OR phone LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        $query .= " ORDER BY name ASC LIMIT 20";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $clients = $stmt->fetchAll();
        
        echo json_encode($clients);
        exit;
        
    } elseif ($method === 'POST') {
        // Enregistrer un nouveau client à la volée depuis la caisse
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST; // Fallback standard
        }
        
        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $address = trim($input['address'] ?? '');
        $email = trim($input['email'] ?? '');
        
        if (empty($name)) {
            echo json_encode(['success' => false, 'error' => 'Le nom du client est obligatoire']);
            exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO clients (name, phone, email, address, loyalty_points, balance) VALUES (?, ?, ?, ?, 0, 0.00)");
        $stmt->execute([$name, $phone, $email, $address]);
        $newClientId = $pdo->lastInsertId();
        
        // Logger l'activité
        logAction($pdo, $_SESSION['user_id'], "Création rapide du client : $name");
        
        echo json_encode([
            'success' => true,
            'client' => [
                'id' => $newClientId,
                'name' => $name,
                'phone' => $phone,
                'address' => $address,
                'loyalty_points' => 0,
                'balance' => 0.00
            ]
        ]);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur client : ' . $e->getMessage()]);
}
?>
