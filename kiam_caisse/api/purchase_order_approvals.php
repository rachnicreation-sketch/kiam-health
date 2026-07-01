<?php
/**
 * API: Gestion des Approbations de Commande d'Achat
 * Endpoints: GET (list approvals), POST (add approval), PUT (update approval)
 */

require_once '../config/auth.php';
require_once '../config/db.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

$db = Database::connect();
$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        if (isset($_GET['purchase_order_id'])) {
            // Récupérer toutes les approbations d'une commande
            $orderId = (int)$_GET['purchase_order_id'];

            $stmt = $db->prepare("SELECT poa.*, u.username as approver_name, u.email as approver_email
                                FROM purchase_order_approvals poa
                                LEFT JOIN users u ON poa.approver_id = u.id
                                WHERE poa.purchase_order_id = :id
                                ORDER BY poa.approval_level ASC, poa.approved_at DESC");
            $stmt->execute(['id' => $orderId]);
            $approvals = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $approvals]);

        } elseif (isset($_GET['id'])) {
            // Récupérer une approbation spécifique
            $id = (int)$_GET['id'];

            $stmt = $db->prepare("SELECT poa.*, u.username as approver_name, po.reference
                                FROM purchase_order_approvals poa
                                LEFT JOIN users u ON poa.approver_id = u.id
                                LEFT JOIN purchase_orders po ON poa.purchase_order_id = po.id
                                WHERE poa.id = :id");
            $stmt->execute(['id' => $id]);
            $approval = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$approval) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Approbation non trouvée']);
                exit;
            }

            echo json_encode(['success' => true, 'data' => $approval]);

        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Paramètre purchase_order_id ou id requis']);
        }

    } elseif ($method === 'POST') {
        // Ajouter une approbation
        $data = json_decode(file_get_contents('php://input'), true);

        $required = ['purchase_order_id', 'approval_level', 'action'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Champ requis: $field"]);
                exit;
            }
        }

        // Vérifier commande existe
        $stmt = $db->prepare("SELECT id, status FROM purchase_orders WHERE id = ?");
        $stmt->execute([$data['purchase_order_id']]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Commande non trouvée']);
            exit;
        }

        // Vérifier que pas de doublon d'approbation au même niveau par le même approbateur
        $stmt = $db->prepare("SELECT id FROM purchase_order_approvals 
                            WHERE purchase_order_id = ? AND approval_level = ? AND approver_id = ?");
        $stmt->execute([$data['purchase_order_id'], $data['approval_level'], $userId]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Vous avez déjà approuvé à ce niveau']);
            exit;
        }

        // Insérer approbation
        $stmt = $db->prepare("INSERT INTO purchase_order_approvals 
            (purchase_order_id, approver_id, approval_level, action, comments)
            VALUES (?, ?, ?, ?, ?)");

        if ($stmt->execute([
            $data['purchase_order_id'],
            $userId,
            $data['approval_level'],
            $data['action'],
            $data['comments'] ?? null
        ])) {
            $approvalId = $db->lastInsertId();

            // Si action = 'approuvé' et c'est le dernier niveau, mettre status à 'validé'
            $stmt = $db->prepare("SELECT MAX(approval_level) as max_level FROM purchase_order_approvals 
                                WHERE purchase_order_id = ?");
            $stmt->execute([$data['purchase_order_id']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $maxApprovalLevel = $result['max_level'] ?? 0;

            if ($data['action'] === 'approuvé' && $maxApprovalLevel >= 3) {
                // Tous les niveaux approuvés, mettre status à 'validé'
                $stmt = $db->prepare("UPDATE purchase_orders SET status = 'validé' WHERE id = ?");
                $stmt->execute([$data['purchase_order_id']]);
            }

            echo json_encode([
                'success' => true,
                'message' => 'Approbation enregistrée',
                'id' => $approvalId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur enregistrement approbation']);
        }

    } elseif ($method === 'PUT') {
        // Mettre à jour approbation (rare, mais possible si demande modification)
        $id = (int)$_GET['id'];
        $data = json_decode(file_get_contents('php://input'), true);

        $stmt = $db->prepare("SELECT id FROM purchase_order_approvals WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Approbation non trouvée']);
            exit;
        }

        $updates = [];
        $values = [];
        $allowedFields = ['action', 'comments'];

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

        $values[] = $id;
        $stmt = $db->prepare("UPDATE purchase_order_approvals SET " . implode(", ", $updates) . " WHERE id = ?");

        if ($stmt->execute($values)) {
            echo json_encode(['success' => true, 'message' => 'Approbation mise à jour']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur mise à jour']);
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}
