<?php
/**
 * API: Gestion des Commandes d'Achat (Purchase Orders)
 * Endpoints: GET (list/detail), POST (create), PUT (update), DELETE (cancel)
 */

require_once '../config/auth.php';
require_once '../config/db.php';

header('Content-Type: application/json; charset=utf-8');

// Vérifier authentification
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

$db = Database::connect();
$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

try {
    if ($method === 'GET') {
        if ($action === 'list') {
            // Récupérer liste des commandes avec filtrage
            $status = $_GET['status'] ?? null;
            $supplier_id = $_GET['supplier_id'] ?? null;
            $search = $_GET['search'] ?? null;
            $page = (int)($_GET['page'] ?? 1);
            $limit = 20;
            $offset = ($page - 1) * $limit;

            $query = "SELECT 
                        po.id, po.reference, po.order_date, po.status,
                        po.expected_delivery_date, po.actual_delivery_date,
                        po.total_amount, po.tax_amount, po.shipping_cost,
                        s.id as supplier_id, s.name as supplier_name,
                        u.username as created_by_user,
                        COUNT(DISTINCT poi.id) as item_count
                    FROM purchase_orders po
                    LEFT JOIN suppliers s ON po.supplier_id = s.id
                    LEFT JOIN users u ON po.created_by_id = u.id
                    LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
                    WHERE po.tenant_id = :tenant_id";
            
            $params = ['tenant_id' => 1]; // TODO: use session tenant_id

            if ($status) {
                $query .= " AND po.status = :status";
                $params['status'] = $status;
            }
            if ($supplier_id) {
                $query .= " AND po.supplier_id = :supplier_id";
                $params['supplier_id'] = $supplier_id;
            }
            if ($search) {
                $query .= " AND (po.reference LIKE :search OR s.name LIKE :search)";
                $params['search'] = "%$search%";
            }

            $query .= " GROUP BY po.id ORDER BY po.order_date DESC LIMIT :limit OFFSET :offset";
            $params['limit'] = $limit;
            $params['offset'] = $offset;

            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Compter total
            $countQuery = "SELECT COUNT(DISTINCT po.id) as total FROM purchase_orders po 
                          LEFT JOIN suppliers s ON po.supplier_id = s.id 
                          WHERE po.tenant_id = 1";
            if ($status) $countQuery .= " AND po.status = ?";
            if ($supplier_id) $countQuery .= " AND po.supplier_id = ?";
            
            $countParams = [];
            if ($status) $countParams[] = $status;
            if ($supplier_id) $countParams[] = $supplier_id;
            
            $countStmt = $db->prepare($countQuery);
            $countStmt->execute($countParams);
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            echo json_encode([
                'success' => true,
                'data' => $orders,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);

        } elseif (isset($_GET['id'])) {
            // Récupérer détail commande avec articles et approbations
            $id = (int)$_GET['id'];

            // Détail commande
            $stmt = $db->prepare("SELECT po.*, 
                                        s.name as supplier_name, s.email as supplier_email,
                                        u.username as created_by_user,
                                        au.username as approved_by_user
                                FROM purchase_orders po
                                LEFT JOIN suppliers s ON po.supplier_id = s.id
                                LEFT JOIN users u ON po.created_by_id = u.id
                                LEFT JOIN users au ON po.approved_by_id = au.id
                                WHERE po.id = :id");
            $stmt->execute(['id' => $id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Commande non trouvée']);
                exit;
            }

            // Articles
            $stmt = $db->prepare("SELECT poi.*, p.name as product_name, p.sku
                                FROM purchase_order_items poi
                                LEFT JOIN products p ON poi.product_id = p.id
                                WHERE poi.purchase_order_id = :id");
            $stmt->execute(['id' => $id]);
            $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Approbations
            $stmt = $db->prepare("SELECT poa.*, u.username as approver_name, u.email as approver_email
                                FROM purchase_order_approvals poa
                                LEFT JOIN users u ON poa.approver_id = u.id
                                WHERE poa.purchase_order_id = :id
                                ORDER BY poa.approved_at DESC");
            $stmt->execute(['id' => $id]);
            $order['approvals'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Historique statuts
            $stmt = $db->prepare("SELECT posl.*, u.username as changed_by_user
                                FROM purchase_order_status_log posl
                                LEFT JOIN users u ON posl.changed_by_id = u.id
                                WHERE posl.purchase_order_id = :id
                                ORDER BY posl.changed_at DESC");
            $stmt->execute(['id' => $id]);
            $order['status_history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $order]);

        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Paramètre id requis']);
        }

    } elseif ($method === 'POST') {
        // Créer nouvelle commande
        $data = json_decode(file_get_contents('php://input'), true);

        // Validation
        $required = ['supplier_id', 'status'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Champ requis: $field"]);
                exit;
            }
        }

        // Vérifier fournisseur existe
        $stmt = $db->prepare("SELECT id FROM suppliers WHERE id = ?");
        $stmt->execute([$data['supplier_id']]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Fournisseur non trouvé']);
            exit;
        }

        // Générer référence unique
        $date = date('Y');
        $stmt = $db->prepare("SELECT MAX(CAST(SUBSTRING(reference, -4) AS UNSIGNED)) as max_num 
                            FROM purchase_orders 
                            WHERE reference LIKE ?");
        $stmt->execute(["CMD-$date-%"]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $nextNum = ($result['max_num'] ?? 0) + 1;
        $reference = sprintf("CMD-%s-%04d", $date, $nextNum);

        // Insérer commande
        $stmt = $db->prepare("INSERT INTO purchase_orders 
            (reference, tenant_id, supplier_id, created_by_id, status, 
             expected_delivery_date, payment_terms, notes, purchase_request_id)
            VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)");
        
        $result = $stmt->execute([
            $reference,
            $data['supplier_id'],
            $userId,
            $data['status'],
            $data['expected_delivery_date'] ?? null,
            $data['payment_terms'] ?? null,
            $data['notes'] ?? null,
            $data['purchase_request_id'] ?? null
        ]);

        if ($result) {
            $orderId = $db->lastInsertId();
            echo json_encode([
                'success' => true,
                'message' => 'Commande créée',
                'id' => $orderId,
                'reference' => $reference
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur création commande']);
        }

    } elseif ($method === 'PUT') {
        // Mettre à jour commande
        $id = (int)$_GET['id'];
        $data = json_decode(file_get_contents('php://input'), true);

        // Vérifier commande existe
        $stmt = $db->prepare("SELECT status FROM purchase_orders WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Commande non trouvée']);
            exit;
        }

        // Construire requête UPDATE dynamique
        $updates = [];
        $values = [];
        $allowedFields = ['status', 'expected_delivery_date', 'actual_delivery_date', 
                         'approved_by_id', 'payment_terms', 'discount_percent', 
                         'shipping_cost', 'tax_amount', 'notes'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Aucun champ à mettre à jour']);
            exit;
        }

        // Si changement de status, enregistrer dans historique
        if (isset($data['status']) && $data['status'] !== $order['status']) {
            $stmt = $db->prepare("INSERT INTO purchase_order_status_log 
                                (purchase_order_id, old_status, new_status, changed_by_id, reason)
                                VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $order['status'],
                $data['status'],
                $userId,
                $data['status_reason'] ?? null
            ]);
        }

        // Exécuter UPDATE
        $values[] = $id;
        $stmt = $db->prepare("UPDATE purchase_orders SET " . implode(", ", $updates) . " WHERE id = ?");
        
        if ($stmt->execute($values)) {
            echo json_encode(['success' => true, 'message' => 'Commande mise à jour']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur mise à jour']);
        }

    } elseif ($method === 'DELETE') {
        // Annuler/supprimer commande
        $id = (int)$_GET['id'];

        $stmt = $db->prepare("SELECT status FROM purchase_orders WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Commande non trouvée']);
            exit;
        }

        // Seules brouillon et validé peuvent être supprimées
        if (!in_array($order['status'], ['brouillon', 'validé'])) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Seules les commandes en brouillon ou validées peuvent être supprimées']);
            exit;
        }

        // Soft delete en mettant status à annulé
        $stmt = $db->prepare("UPDATE purchase_orders SET status = 'annulé' WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true, 'message' => 'Commande annulée']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur annulation']);
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}
