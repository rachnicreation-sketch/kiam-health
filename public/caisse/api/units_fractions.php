<?php
/**
 * API - Gestion des Unités et Fractions de Produits
 * Gère les différentes unités de mesure et fractions pour la vente au détail
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json; charset=utf-8');
requireLogin();

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$tenant_id = $_SESSION['tenant_id'] ?? 0;

try {
    switch ($action) {
        
        // ====================== UNITÉS ======================
        
        case 'get_units':
            /**
             * Récupère toutes les unités disponibles pour le tenant
             */
            $stmt = $pdo->prepare("
                SELECT * FROM product_units 
                WHERE tenant_id = ? OR tenant_id = 0
                ORDER BY `type`, name ASC
            ");
            $stmt->execute([$tenant_id]);
            $units = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $units]);
            break;

        case 'get_unit_fractions':
            /**
             * Récupère les fractions/unités disponibles pour un produit spécifique
             */
            $product_id = $_GET['product_id'] ?? 0;
            
            if (!$product_id) {
                throw new Exception("product_id requis");
            }

            $stmt = $pdo->prepare("
                SELECT pf.*, pu.name, pu.abbreviation, pu.code
                FROM product_unit_fractions pf
                JOIN product_units pu ON pf.unit_id = pu.id
                WHERE pf.product_id = ? AND pf.tenant_id = ?
                ORDER BY pf.`order`
            ");
            $stmt->execute([$product_id, $tenant_id]);
            $fractions = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $fractions]);
            break;

        case 'add_unit':
            /**
             * Ajoute une nouvelle unité personnalisée pour le tenant
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['code', 'name', 'abbreviation'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            $stmt = $pdo->prepare("
                INSERT INTO product_units 
                (code, name, abbreviation, description, type, base_unit_id, conversion_factor, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['code'],
                $data['name'],
                $data['abbreviation'],
                $data['description'] ?? null,
                $data['type'] ?? 'derivative',
                $data['base_unit_id'] ?? null,
                $data['conversion_factor'] ?? 1,
                $tenant_id
            ]);

            $unit_id = $pdo->lastInsertId();
            logAudit('product_units', $unit_id, 'create', null, $data);
            logSyncOperation('unit_management', 'product_units', $unit_id, 'create');

            echo json_encode(['success' => true, 'id' => $unit_id, 'message' => 'Unité créée avec succès']);
            break;

        case 'add_product_fraction':
            /**
             * Ajoute une fraction/variante d'unité pour un produit
             * Exemple : Pour un produit vendable en KG, 500g (1/2 KG), 250g (1/4 KG)
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['product_id', 'unit_id', 'quantity'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            // Vérifier que le produit existe
            $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$data['product_id'], $tenant_id]);
            if (!$stmt->fetch()) {
                throw new Exception("Produit non trouvé");
            }

            // Vérifier que l'unité existe
            $stmt = $pdo->prepare("SELECT id FROM product_units WHERE id = ?");
            $stmt->execute([$data['unit_id']]);
            if (!$stmt->fetch()) {
                throw new Exception("Unité non trouvée");
            }

            // Insérer la fraction
            $stmt = $pdo->prepare("
                INSERT INTO product_unit_fractions 
                (product_id, unit_id, quantity, price_multiplier, display_name, `order`, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                quantity = VALUES(quantity),
                price_multiplier = VALUES(price_multiplier),
                display_name = VALUES(display_name)
            ");

            $stmt->execute([
                $data['product_id'],
                $data['unit_id'],
                $data['quantity'],
                $data['price_multiplier'] ?? 1,
                $data['display_name'] ?? null,
                $data['order'] ?? 0,
                $tenant_id
            ]);

            $fraction_id = $pdo->lastInsertId();
            logAudit('product_unit_fractions', $fraction_id, 'create', null, $data);
            logSyncOperation('fraction_management', 'product_unit_fractions', $data['product_id'], 'create');

            echo json_encode(['success' => true, 'id' => $fraction_id, 'message' => 'Fraction ajoutée avec succès']);
            break;

        case 'calculate_unit_price':
            /**
             * Calcule le prix pour une quantité/unité spécifique
             * Utile pour recalculer les prix lors de la vente au détail
             */
            $product_id = $_GET['product_id'] ?? 0;
            $unit_id = $_GET['unit_id'] ?? 0;
            $quantity = floatval($_GET['quantity'] ?? 1);

            if (!$product_id || !$unit_id) {
                throw new Exception("product_id et unit_id sont requis");
            }

            // Obtenir le prix de base du produit
            $stmt = $pdo->prepare("
                SELECT selling_price FROM products WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$product_id, $tenant_id]);
            $product = $stmt->fetch();

            if (!$product) {
                throw new Exception("Produit non trouvé");
            }

            // Obtenir le multiplicateur de prix pour cette fraction
            $stmt = $pdo->prepare("
                SELECT price_multiplier, quantity FROM product_unit_fractions 
                WHERE product_id = ? AND unit_id = ? AND tenant_id = ?
            ");
            $stmt->execute([$product_id, $unit_id, $tenant_id]);
            $fraction = $stmt->fetch();

            $base_price = $product['selling_price'];
            $multiplier = $fraction ? $fraction['price_multiplier'] : 1;
            
            $unit_price = $base_price * $multiplier;
            $total_price = $unit_price * $quantity;

            echo json_encode([
                'success' => true,
                'base_price' => $base_price,
                'unit_price' => $unit_price,
                'quantity' => $quantity,
                'total_price' => $total_price
            ]);
            break;

        default:
            throw new Exception("Action non reconnue: $action");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Fonction utilitaire : Enregistre une action d'audit
 */
function logAudit($entity_type, $entity_id, $action, $old_values = null, $new_values = null) {
    global $pdo, $tenant_id;
    $user_id = $_SESSION['user_id'] ?? null;
    
    $stmt = $pdo->prepare("
        INSERT INTO audit_trail (entity_type, entity_id, action, old_values, new_values, user_id, tenant_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $entity_type,
        $entity_id,
        $action,
        $old_values ? json_encode($old_values) : null,
        $new_values ? json_encode($new_values) : null,
        $user_id,
        $tenant_id
    ]);
}

/**
 * Fonction utilitaire : Enregistre une opération de synchronisation
 */
function logSyncOperation($operation_type, $source_module, $reference_id, $action) {
    global $pdo, $tenant_id;
    $user_id = $_SESSION['user_id'] ?? null;
    
    $stmt = $pdo->prepare("
        INSERT INTO sync_logs (operation_type, source_module, reference_id, status, user_id, tenant_id)
        VALUES (?, ?, ?, 'pending', ?, ?)
    ");
    
    $stmt->execute([$operation_type, $source_module, $reference_id, $user_id, $tenant_id]);
}
?>
