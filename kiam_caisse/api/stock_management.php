<?php
/**
 * API - Gestion Avancée des Stocks et Inventaire
 * Gère les mouvements de stock, transferts, ajustements et inventaire physique
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json; charset=utf-8');
requireLogin();

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$tenant_id = $_SESSION['tenant_id'] ?? 0;
$user_id = $_SESSION['user_id'] ?? 0;

try {
    switch ($action) {
        
        // ====================== ENTREPOTS ======================
        
        case 'get_warehouses':
            /**
             * Récupère tous les entrepôts du tenant
             */
            $stmt = $pdo->prepare("
                SELECT * FROM warehouses 
                WHERE tenant_id = ? AND is_active = 1
                ORDER BY is_main DESC, name ASC
            ");
            $stmt->execute([$tenant_id]);
            $warehouses = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $warehouses]);
            break;

        case 'create_warehouse':
            /**
             * Crée un nouvel entrepôt
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['code', 'name'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            $stmt = $pdo->prepare("
                INSERT INTO warehouses (code, name, address, is_main, tenant_id)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['code'],
                $data['name'],
                $data['address'] ?? null,
                $data['is_main'] ? 1 : 0,
                $tenant_id
            ]);

            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;

        // ====================== MOUVEMENTS DE STOCK ======================
        
        case 'record_stock_movement':
            /**
             * Enregistre un mouvement de stock (entrée, sortie, transfert, ajustement)
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['product_id', 'movement_type', 'quantity', 'unit_id'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || $data[$field] === '') {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            // Validation du type de mouvement
            $valid_types = ['entry', 'exit', 'transfer', 'adjustment', 'inventory', 'return'];
            if (!in_array($data['movement_type'], $valid_types)) {
                throw new Exception("Type de mouvement invalide");
            }

            // Déterminer l'entrepôt source et destination
            $from_warehouse = null;
            $to_warehouse = null;

            if ($data['movement_type'] === 'transfer') {
                if (empty($data['from_warehouse_id']) || empty($data['to_warehouse_id'])) {
                    throw new Exception("Les entrepôts source et destination sont requis pour un transfert");
                }
                $from_warehouse = $data['from_warehouse_id'];
                $to_warehouse = $data['to_warehouse_id'];
            } else {
                // Pour entry/exit, utiliser l'entrepôt principal
                $stmt = $pdo->prepare("SELECT id FROM warehouses WHERE tenant_id = ? AND is_main = 1");
                $stmt->execute([$tenant_id]);
                $warehouse = $stmt->fetch();
                $main_warehouse = $warehouse['id'] ?? 0;

                if ($data['movement_type'] === 'entry') {
                    $to_warehouse = $main_warehouse;
                } else {
                    $from_warehouse = $main_warehouse;
                }
            }

            // Enregistrer le mouvement
            $stmt = $pdo->prepare("
                INSERT INTO stock_movements 
                (product_id, movement_type, quantity, unit_id, reference_type, reference_id, 
                 from_warehouse_id, to_warehouse_id, reason, user_id, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['product_id'],
                $data['movement_type'],
                $data['quantity'],
                $data['unit_id'],
                $data['reference_type'] ?? null,
                $data['reference_id'] ?? null,
                $from_warehouse,
                $to_warehouse,
                $data['reason'] ?? null,
                $user_id,
                $tenant_id
            ]);

            $movement_id = $pdo->lastInsertId();

            // Mettre à jour les niveaux de stock
            updateStockLevels($data['product_id'], $data['unit_id'], $data['movement_type'], 
                            $data['quantity'], $from_warehouse, $to_warehouse);

            logSyncOperation('stock_movement', 'stock_movements', $movement_id, 'create');

            echo json_encode([
                'success' => true, 
                'id' => $movement_id,
                'message' => 'Mouvement de stock enregistré avec succès'
            ]);
            break;

        case 'get_stock_levels':
            /**
             * Récupère les niveaux de stock actuels
             */
            $warehouse_id = $_GET['warehouse_id'] ?? null;
            $product_id = $_GET['product_id'] ?? null;

            $query = "
                SELECT sl.*, p.name as product_name, p.sku, pu.name as unit_name, pu.abbreviation,
                       w.name as warehouse_name
                FROM stock_levels sl
                JOIN products p ON sl.product_id = p.id
                JOIN product_units pu ON sl.unit_id = pu.id
                JOIN warehouses w ON sl.warehouse_id = w.id
                WHERE sl.tenant_id = ?
            ";
            $params = [$tenant_id];

            if ($warehouse_id) {
                $query .= " AND sl.warehouse_id = ?";
                $params[] = $warehouse_id;
            }

            if ($product_id) {
                $query .= " AND sl.product_id = ?";
                $params[] = $product_id;
            }

            $query .= " ORDER BY p.name ASC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $stock_levels = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $stock_levels]);
            break;

        case 'get_stock_alerts':
            /**
             * Récupère les alertes de stock (stocks bas, surstock)
             */
            $stmt = $pdo->prepare("
                SELECT sl.*, p.name as product_name, p.sku, pu.abbreviation,
                       w.name as warehouse_name,
                       CASE 
                           WHEN sl.quantity < sl.alert_threshold THEN 'low_stock'
                           WHEN sl.quantity > sl.max_stock THEN 'overstock'
                           ELSE 'normal'
                       END as alert_type
                FROM stock_levels sl
                JOIN products p ON sl.product_id = p.id
                JOIN product_units pu ON sl.unit_id = pu.id
                JOIN warehouses w ON sl.warehouse_id = w.id
                WHERE sl.tenant_id = ? AND (
                    sl.quantity < sl.alert_threshold OR sl.quantity > sl.max_stock
                )
                ORDER BY alert_type ASC, p.name ASC
            ");
            $stmt->execute([$tenant_id]);
            $alerts = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $alerts]);
            break;

        // ====================== INVENTAIRE PHYSIQUE ======================
        
        case 'create_physical_inventory':
            /**
             * Crée un nouvel inventaire physique
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (empty($data['warehouse_id'])) {
                throw new Exception("warehouse_id est requis");
            }

            // Générer un code d'inventaire
            $date = date('Y-m-d');
            $count = $pdo->query("
                SELECT COUNT(*) as cnt FROM physical_inventories 
                WHERE DATE(created_at) = '$date'
            ")->fetch();
            $code = 'INV-' . date('Ymd') . '-' . str_pad($count['cnt'] + 1, 4, '0', STR_PAD_LEFT);

            $stmt = $pdo->prepare("
                INSERT INTO physical_inventories (code, warehouse_id, inventory_date, comments, user_id, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $code,
                $data['warehouse_id'],
                $date,
                $data['comments'] ?? null,
                $user_id,
                $tenant_id
            ]);

            $inventory_id = $pdo->lastInsertId();
            
            // Pré-remplir avec les produits existants
            prefillInventoryItems($inventory_id, $data['warehouse_id']);

            echo json_encode([
                'success' => true,
                'id' => $inventory_id,
                'code' => $code,
                'message' => 'Inventaire créé avec succès'
            ]);
            break;

        case 'get_inventory':
            /**
             * Récupère les détails d'un inventaire
             */
            $inventory_id = $_GET['inventory_id'] ?? 0;

            if (!$inventory_id) {
                throw new Exception("inventory_id requis");
            }

            $stmt = $pdo->prepare("
                SELECT pi.*, w.name as warehouse_name, u.username as created_by_user
                FROM physical_inventories pi
                JOIN warehouses w ON pi.warehouse_id = w.id
                LEFT JOIN users u ON pi.user_id = u.id
                WHERE pi.id = ? AND pi.tenant_id = ?
            ");
            $stmt->execute([$inventory_id, $tenant_id]);
            $inventory = $stmt->fetch();

            if (!$inventory) {
                throw new Exception("Inventaire non trouvé");
            }

            // Récupérer les articles de l'inventaire
            $stmt = $pdo->prepare("
                SELECT ii.*, p.name as product_name, p.sku, pu.abbreviation, pu.name as unit_name
                FROM inventory_items ii
                JOIN products p ON ii.product_id = p.id
                JOIN product_units pu ON ii.unit_id = pu.id
                WHERE ii.inventory_id = ?
                ORDER BY p.name ASC
            ");
            $stmt->execute([$inventory_id]);
            $items = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'data' => ['inventory' => $inventory, 'items' => $items]
            ]);
            break;

        case 'record_inventory_count':
            /**
             * Enregistre la quantité comptée pour un article d'inventaire
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['inventory_item_id', 'counted_quantity'];
            foreach ($required as $field) {
                if (!isset($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            $variance = $data['counted_quantity'] - $data['expected_quantity'] ?? 0;

            $stmt = $pdo->prepare("
                UPDATE inventory_items 
                SET counted_quantity = ?, variance = ?, variance_reason = ?
                WHERE id = ? AND inventory_id IN (
                    SELECT id FROM physical_inventories WHERE tenant_id = ?
                )
            ");
            
            $stmt->execute([
                $data['counted_quantity'],
                $variance,
                $data['variance_reason'] ?? null,
                $data['inventory_item_id'],
                $tenant_id
            ]);

            echo json_encode(['success' => true, 'message' => 'Comptage enregistré']);
            break;

        case 'validate_inventory':
            /**
             * Valide un inventaire et crée les ajustements de stock nécessaires
             */
            $inventory_id = $_POST['inventory_id'] ?? 0;

            if (!$inventory_id) {
                throw new Exception("inventory_id requis");
            }

            // Vérifier que l'inventaire existe et appartient au tenant
            $stmt = $pdo->prepare("
                SELECT id, warehouse_id FROM physical_inventories 
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$inventory_id, $tenant_id]);
            $inventory = $stmt->fetch();

            if (!$inventory) {
                throw new Exception("Inventaire non trouvé");
            }

            // Récupérer tous les items de l'inventaire
            $stmt = $pdo->prepare("
                SELECT * FROM inventory_items WHERE inventory_id = ?
            ");
            $stmt->execute([$inventory_id]);
            $items = $stmt->fetchAll();

            // Créer des ajustements pour chaque écart
            foreach ($items as $item) {
                if ($item['variance'] != 0) {
                    createAdjustmentMovement(
                        $item['product_id'],
                        $item['unit_id'],
                        $item['variance'],
                        $inventory['warehouse_id'],
                        "Ajustement inventaire #{$inventory_id}",
                        'inventory',
                        $inventory_id
                    );
                }
            }

            // Marquer l'inventaire comme validé
            $stmt = $pdo->prepare("
                UPDATE physical_inventories 
                SET status = 'validated', validated_by = ?, validated_at = NOW()
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$user_id, $inventory_id, $tenant_id]);

            logSyncOperation('inventory_validation', 'physical_inventories', $inventory_id, 'validate');

            echo json_encode(['success' => true, 'message' => 'Inventaire validé et ajustements créés']);
            break;

        default:
            throw new Exception("Action non reconnue: $action");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Fonction utilitaire : Mets à jour les niveaux de stock après un mouvement
 */
function updateStockLevels($product_id, $unit_id, $movement_type, $quantity, $from_warehouse = null, $to_warehouse = null) {
    global $pdo, $tenant_id;

    if ($movement_type === 'transfer') {
        // Réduire l'entrepôt source
        $stmt = $pdo->prepare("
            UPDATE stock_levels SET quantity = quantity - ?
            WHERE product_id = ? AND unit_id = ? AND warehouse_id = ? AND tenant_id = ?
        ");
        $stmt->execute([$quantity, $product_id, $unit_id, $from_warehouse, $tenant_id]);

        // Augmenter l'entrepôt destination
        $stmt = $pdo->prepare("
            INSERT INTO stock_levels (product_id, warehouse_id, unit_id, quantity, tenant_id)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + ?
        ");
        $stmt->execute([$product_id, $to_warehouse, $unit_id, $quantity, $tenant_id, $quantity]);
    } else if ($movement_type === 'entry') {
        $stmt = $pdo->prepare("
            INSERT INTO stock_levels (product_id, warehouse_id, unit_id, quantity, tenant_id)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + ?
        ");
        $stmt->execute([$product_id, $to_warehouse, $unit_id, $quantity, $tenant_id, $quantity]);
    } else if (in_array($movement_type, ['exit', 'return'])) {
        $adjust_quantity = ($movement_type === 'exit') ? -$quantity : $quantity;
        $stmt = $pdo->prepare("
            UPDATE stock_levels SET quantity = quantity + ?
            WHERE product_id = ? AND unit_id = ? AND warehouse_id = ? AND tenant_id = ?
        ");
        $stmt->execute([$adjust_quantity, $product_id, $unit_id, $from_warehouse, $tenant_id]);
    } else if ($movement_type === 'adjustment') {
        $stmt = $pdo->prepare("
            UPDATE stock_levels SET quantity = quantity + ?
            WHERE product_id = ? AND unit_id = ? AND warehouse_id = ? AND tenant_id = ?
        ");
        $stmt->execute([$quantity, $product_id, $unit_id, $from_warehouse, $tenant_id]);
    }
}

/**
 * Fonction utilitaire : Pré-remplit un inventaire avec les produits en stock
 */
function prefillInventoryItems($inventory_id, $warehouse_id) {
    global $pdo;

    $stmt = $pdo->prepare("
        INSERT INTO inventory_items (inventory_id, product_id, unit_id, expected_quantity, tenant_id)
        SELECT ?, sl.product_id, sl.unit_id, sl.quantity, sl.tenant_id
        FROM stock_levels sl
        WHERE sl.warehouse_id = ?
        ON DUPLICATE KEY UPDATE expected_quantity = VALUES(expected_quantity)
    ");
    $stmt->execute([$inventory_id, $warehouse_id]);
}

/**
 * Fonction utilitaire : Crée un ajustement de stock
 */
function createAdjustmentMovement($product_id, $unit_id, $quantity, $warehouse_id, $reason, $ref_type, $ref_id) {
    global $pdo, $tenant_id, $user_id;

    $stmt = $pdo->prepare("
        INSERT INTO stock_movements 
        (product_id, movement_type, quantity, unit_id, from_warehouse_id, reason, 
         reference_type, reference_id, user_id, tenant_id)
        VALUES (?, 'adjustment', ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $product_id,
        $quantity,
        $unit_id,
        $warehouse_id,
        $reason,
        $ref_type,
        $ref_id,
        $user_id,
        $tenant_id
    ]);

    updateStockLevels($product_id, $unit_id, 'adjustment', $quantity, $warehouse_id);
}

function logSyncOperation($operation_type, $source_module, $reference_id, $action) {
    global $pdo, $tenant_id, $user_id;
    
    $stmt = $pdo->prepare("
        INSERT INTO sync_logs (operation_type, source_module, reference_id, status, user_id, tenant_id)
        VALUES (?, ?, ?, 'pending', ?, ?)
    ");
    
    $stmt->execute([$operation_type, $source_module, $reference_id, $user_id, $tenant_id]);
}
?>
