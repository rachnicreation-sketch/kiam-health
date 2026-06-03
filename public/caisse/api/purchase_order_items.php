<?php
/**
 * API: Gestion des Articles de Commande d'Achat (Purchase Order Items)
 * Endpoints: GET (list/detail), POST (add items), PUT (update), DELETE (remove item)
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
            // Récupérer tous les articles d'une commande
            $orderId = (int)$_GET['purchase_order_id'];

            $stmt = $db->prepare("SELECT poi.*, p.name as product_name, p.sku, p.unit as product_unit,
                                        sp.purchase_price, sp.pack_qty
                                FROM purchase_order_items poi
                                LEFT JOIN products p ON poi.product_id = p.id
                                LEFT JOIN supplier_products sp ON poi.supplier_product_id = sp.id
                                WHERE poi.purchase_order_id = :id
                                ORDER BY poi.created_at DESC");
            $stmt->execute(['id' => $orderId]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $items]);

        } elseif (isset($_GET['id'])) {
            // Récupérer un article spécifique
            $id = (int)$_GET['id'];

            $stmt = $db->prepare("SELECT poi.*, p.name as product_name, p.sku,
                                        sp.purchase_price, sp.minimum_order_qty, sp.pack_qty,
                                        po.reference as order_reference
                                FROM purchase_order_items poi
                                LEFT JOIN products p ON poi.product_id = p.id
                                LEFT JOIN supplier_products sp ON poi.supplier_product_id = sp.id
                                LEFT JOIN purchase_orders po ON poi.purchase_order_id = po.id
                                WHERE poi.id = :id");
            $stmt->execute(['id' => $id]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$item) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Article non trouvé']);
                exit;
            }

            echo json_encode(['success' => true, 'data' => $item]);

        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Paramètre purchase_order_id ou id requis']);
        }

    } elseif ($method === 'POST') {
        // Ajouter un article à une commande
        $data = json_decode(file_get_contents('php://input'), true);

        $required = ['purchase_order_id', 'product_id', 'quantity_ordered', 'unit_price'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Champ requis: $field"]);
                exit;
            }
        }

        // Vérifier que commande existe
        $stmt = $db->prepare("SELECT id FROM purchase_orders WHERE id = ?");
        $stmt->execute([$data['purchase_order_id']]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Commande non trouvée']);
            exit;
        }

        // Vérifier que produit existe
        $stmt = $db->prepare("SELECT id FROM products WHERE id = ?");
        $stmt->execute([$data['product_id']]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Produit non trouvé']);
            exit;
        }

        // Vérifier doublon
        $stmt = $db->prepare("SELECT id FROM purchase_order_items 
                            WHERE purchase_order_id = ? AND product_id = ?");
        $stmt->execute([$data['purchase_order_id'], $data['product_id']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Ce produit est déjà dans la commande']);
            exit;
        }

        // Insérer article
        $stmt = $db->prepare("INSERT INTO purchase_order_items 
            (purchase_order_id, supplier_product_id, product_id, quantity_ordered, unit_price, notes)
            VALUES (?, ?, ?, ?, ?, ?)");

        if ($stmt->execute([
            $data['purchase_order_id'],
            $data['supplier_product_id'] ?? null,
            $data['product_id'],
            $data['quantity_ordered'],
            $data['unit_price'],
            $data['notes'] ?? null
        ])) {
            $itemId = $db->lastInsertId();

            // Recalculer total commande
            updatePurchaseOrderTotal($db, $data['purchase_order_id']);

            echo json_encode([
                'success' => true,
                'message' => 'Article ajouté',
                'id' => $itemId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur ajout article']);
        }

    } elseif ($method === 'PUT') {
        // Mettre à jour article
        $id = (int)$_GET['id'];
        $data = json_decode(file_get_contents('php://input'), true);

        // Vérifier article existe
        $stmt = $db->prepare("SELECT purchase_order_id FROM purchase_order_items WHERE id = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$item) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Article non trouvé']);
            exit;
        }

        $updates = [];
        $values = [];
        $allowedFields = ['quantity_ordered', 'quantity_received', 'unit_price', 'notes'];

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
        $stmt = $db->prepare("UPDATE purchase_order_items SET " . implode(", ", $updates) . " WHERE id = ?");

        if ($stmt->execute($values)) {
            // Recalculer total
            updatePurchaseOrderTotal($db, $item['purchase_order_id']);

            echo json_encode(['success' => true, 'message' => 'Article mis à jour']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur mise à jour']);
        }

    } elseif ($method === 'DELETE') {
        // Supprimer article
        $id = (int)$_GET['id'];

        $stmt = $db->prepare("SELECT purchase_order_id FROM purchase_order_items WHERE id = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$item) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Article non trouvé']);
            exit;
        }

        $stmt = $db->prepare("DELETE FROM purchase_order_items WHERE id = ?");
        if ($stmt->execute([$id])) {
            // Recalculer total
            updatePurchaseOrderTotal($db, $item['purchase_order_id']);

            echo json_encode(['success' => true, 'message' => 'Article supprimé']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur suppression']);
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}

// Fonction utilitaire: recalculer le total d'une commande
function updatePurchaseOrderTotal($db, $orderId) {
    try {
        $stmt = $db->prepare("SELECT 
                            COALESCE(SUM(quantity_ordered * unit_price), 0) as subtotal
                            FROM purchase_order_items
                            WHERE purchase_order_id = ?");
        $stmt->execute([$orderId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $subtotal = $result['subtotal'] ?? 0;

        // Récupérer frais pour calcul total
        $stmt = $db->prepare("SELECT tax_amount, shipping_cost, discount_percent FROM purchase_orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        $discount = ($order['discount_percent'] ?? 0) / 100 * $subtotal;
        $total = $subtotal - $discount + ($order['shipping_cost'] ?? 0) + ($order['tax_amount'] ?? 0);

        // Mettre à jour total_amount
        $stmt = $db->prepare("UPDATE purchase_orders SET total_amount = ? WHERE id = ?");
        $stmt->execute([$total, $orderId]);
    } catch (Exception $e) {
        // Silencieux en cas d'erreur
    }
}
