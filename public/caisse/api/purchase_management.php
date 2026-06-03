<?php
/**
 * API - Gestion des Achats et Approvisionnement
 * Gère les commandes d'achat auprès des fournisseurs
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
        
        // ====================== COMMANDES D'ACHAT ======================
        
        case 'create_purchase_order':
            /**
             * Crée une nouvelle commande d'achat
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (empty($data['supplier_id']) || empty($data['items'])) {
                throw new Exception("supplier_id et items sont requis");
            }

            // Générer un numéro de commande unique
            $po_number = generatePONumber($tenant_id);

            // Calculer les totaux
            $total_ht = 0;
            foreach ($data['items'] as $item) {
                $total_ht += $item['quantity'] * $item['purchase_price'];
            }

            $tax_rate = $data['tax_rate'] ?? 18;
            $tax_amount = $total_ht * ($tax_rate / 100);
            $total_ttc = $total_ht + $tax_amount;

            // Créer la commande
            $stmt = $pdo->prepare("
                INSERT INTO purchase_orders 
                (po_number, supplier_id, po_date, expected_delivery_date, total_ht, tax_amount, total_ttc, user_id, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $po_number,
                $data['supplier_id'],
                date('Y-m-d'),
                $data['expected_delivery_date'] ?? null,
                $total_ht,
                $tax_amount,
                $total_ttc,
                $user_id,
                $tenant_id
            ]);

            $purchase_order_id = $pdo->lastInsertId();

            // Insérer les articles
            $stmt = $pdo->prepare("
                INSERT INTO purchase_order_details 
                (product_id, quantity, unit_id, purchase_price, suggested_selling_price, brand, model, reference, color, pieces_count, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($data['items'] as $item) {
                $stmt->execute([
                    $item['product_id'],
                    $item['quantity'],
                    $item['unit_id'],
                    $item['purchase_price'],
                    $item['suggested_selling_price'] ?? null,
                    $item['brand'] ?? null,
                    $item['model'] ?? null,
                    $item['reference'] ?? null,
                    $item['color'] ?? null,
                    $item['pieces_count'] ?? null,
                    $tenant_id
                ]);
            }

            logSyncOperation('purchase_order_creation', 'purchase_orders', $purchase_order_id, 'create');

            echo json_encode([
                'success' => true,
                'id' => $purchase_order_id,
                'po_number' => $po_number,
                'message' => 'Commande d\'achat créée avec succès'
            ]);
            break;

        case 'get_purchase_orders':
            /**
             * Récupère les commandes d'achat
             */
            $status = $_GET['status'] ?? null;
            $supplier_id = $_GET['supplier_id'] ?? null;

            $query = "
                SELECT po.*, s.name as supplier_name, u.username as created_by
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.id
                LEFT JOIN users u ON po.user_id = u.id
                WHERE po.tenant_id = ?
            ";
            $params = [$tenant_id];

            if ($status) {
                $query .= " AND po.status = ?";
                $params[] = $status;
            }

            if ($supplier_id) {
                $query .= " AND po.supplier_id = ?";
                $params[] = $supplier_id;
            }

            $query .= " ORDER BY po.po_date DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $pos = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $pos]);
            break;

        case 'get_purchase_order_details':
            /**
             * Récupère les détails complets d'une commande d'achat
             */
            $po_id = $_GET['po_id'] ?? 0;

            if (!$po_id) {
                throw new Exception("po_id requis");
            }

            $stmt = $pdo->prepare("
                SELECT po.*, s.name as supplier_name, s.email, s.phone, u.username as created_by
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.id
                LEFT JOIN users u ON po.user_id = u.id
                WHERE po.id = ? AND po.tenant_id = ?
            ");
            $stmt->execute([$po_id, $tenant_id]);
            $po = $stmt->fetch();

            if (!$po) {
                throw new Exception("Commande non trouvée");
            }

            // Récupérer les articles
            $stmt = $pdo->prepare("
                SELECT pod.*, p.name as product_name, p.sku, pu.name as unit_name, pu.abbreviation
                FROM purchase_order_details pod
                JOIN products p ON pod.product_id = p.id
                JOIN product_units pu ON pod.unit_id = pu.id
                WHERE pod.tenant_id = ?
                ORDER BY pod.id
            ");
            $stmt->execute([$tenant_id]);
            $items = $stmt->fetchAll();

            // Récupérer les paiements
            $stmt = $pdo->prepare("
                SELECT * FROM purchase_payments 
                WHERE purchase_order_id = ? 
                ORDER BY payment_date DESC
            ");
            $stmt->execute([$po_id]);
            $payments = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'data' => [
                    'po' => $po,
                    'items' => $items,
                    'payments' => $payments
                ]
            ]);
            break;

        case 'update_po_status':
            /**
             * Mises à jour le statut d'une commande d'achat
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['po_id', 'status'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            $valid_statuses = ['pending', 'validated', 'ordered', 'received', 'cancelled'];
            if (!in_array($data['status'], $valid_statuses)) {
                throw new Exception("Statut invalide");
            }

            // Si le statut change à 'received', créer les mouvements de stock
            if ($data['status'] === 'received') {
                receiveSupplierOrder($data['po_id']);
            }

            $stmt = $pdo->prepare("
                UPDATE purchase_orders 
                SET status = ?, updated_at = NOW()
                WHERE id = ? AND tenant_id = ?
            ");
            
            $stmt->execute([
                $data['status'],
                $data['po_id'],
                $tenant_id
            ]);

            logSyncOperation('po_status_update', 'purchase_orders', $data['po_id'], 'update');

            echo json_encode(['success' => true, 'message' => 'Statut mis à jour']);
            break;

        // ====================== PAIEMENTS D'ACHAT ======================
        
        case 'record_purchase_payment':
            /**
             * Enregistre un paiement pour une commande d'achat
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['purchase_order_id', 'amount', 'payment_method', 'payment_date'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            // Vérifier la commande existe
            $stmt = $pdo->prepare("
                SELECT id, total_ttc FROM purchase_orders 
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$data['purchase_order_id'], $tenant_id]);
            $po = $stmt->fetch();

            if (!$po) {
                throw new Exception("Commande non trouvée");
            }

            // Enregistrer le paiement
            $stmt = $pdo->prepare("
                INSERT INTO purchase_payments 
                (purchase_order_id, payment_date, amount, payment_method, reference, notes, user_id, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['purchase_order_id'],
                $data['payment_date'],
                $data['amount'],
                $data['payment_method'],
                $data['reference'] ?? null,
                $data['notes'] ?? null,
                $user_id,
                $tenant_id
            ]);

            $payment_id = $pdo->lastInsertId();

            // Mettre à jour le statut de paiement
            updatePurchasePaymentStatus($data['purchase_order_id']);

            // Créer automatiquement l'écriture comptable
            createSupplierPaymentEntry($data['purchase_order_id'], $data['amount'], $data['payment_method']);

            logSyncOperation('purchase_payment_recorded', 'purchase_payments', $payment_id, 'create');

            echo json_encode([
                'success' => true,
                'id' => $payment_id,
                'message' => 'Paiement enregistré avec succès'
            ]);
            break;

        case 'get_supplier_history':
            /**
             * Récupère l'historique des achats d'un fournisseur
             */
            $supplier_id = $_GET['supplier_id'] ?? 0;

            if (!$supplier_id) {
                throw new Exception("supplier_id requis");
            }

            $stmt = $pdo->prepare("
                SELECT po.*, COUNT(pod.id) as item_count, SUM(pod.total_value) as total_spent
                FROM purchase_orders po
                LEFT JOIN purchase_order_details pod ON po.id = pod.id
                WHERE po.supplier_id = ? AND po.tenant_id = ?
                GROUP BY po.id
                ORDER BY po.po_date DESC
                LIMIT 50
            ");
            $stmt->execute([$supplier_id, $tenant_id]);
            $history = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $history]);
            break;

        default:
            throw new Exception("Action non reconnue: $action");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Fonction utilitaire : Génère un numéro de commande unique
 */
function generatePONumber($tenant_id) {
    global $pdo;
    
    $date = date('Ymd');
    $count = $pdo->query("
        SELECT COUNT(*) as cnt FROM purchase_orders 
        WHERE tenant_id = $tenant_id AND DATE(created_at) = '$date'
    ")->fetch();
    
    return 'PO-' . $date . '-' . str_pad($count['cnt'] + 1, 4, '0', STR_PAD_LEFT);
}

/**
 * Fonction utilitaire : Met à jour le statut de paiement d'une commande
 */
function updatePurchasePaymentStatus($po_id) {
    global $pdo;

    $stmt = $pdo->prepare("
        SELECT po.total_ttc, COALESCE(SUM(pp.amount), 0) as paid_amount
        FROM purchase_orders po
        LEFT JOIN purchase_payments pp ON po.id = pp.purchase_order_id
        WHERE po.id = ?
        GROUP BY po.id
    ");
    $stmt->execute([$po_id]);
    $result = $stmt->fetch();

    if ($result) {
        if ($result['paid_amount'] == 0) {
            $status = 'unpaid';
        } elseif ($result['paid_amount'] >= $result['total_ttc']) {
            $status = 'paid';
        } else {
            $status = 'partial';
        }

        $stmt = $pdo->prepare("UPDATE purchase_orders SET payment_status = ? WHERE id = ?");
        $stmt->execute([$status, $po_id]);
    }
}

/**
 * Fonction utilitaire : Réceptionne une commande et crée les mouvements de stock
 */
function receiveSupplierOrder($po_id) {
    global $pdo, $tenant_id, $user_id;

    // Récupérer la commande et ses articles
    $stmt = $pdo->prepare("
        SELECT po.id as po_id, pod.product_id, pod.quantity, pod.unit_id
        FROM purchase_orders po
        JOIN purchase_order_details pod ON po.id = pod.id
        WHERE po.id = ? AND po.tenant_id = ?
    ");
    $stmt->execute([$po_id, $tenant_id]);
    $items = $stmt->fetchAll();

    // Obtenir l'entrepôt principal
    $stmt = $pdo->prepare("SELECT id FROM warehouses WHERE tenant_id = ? AND is_main = 1");
    $stmt->execute([$tenant_id]);
    $warehouse = $stmt->fetch();
    $warehouse_id = $warehouse['id'] ?? 0;

    // Créer un mouvement d'entrée de stock pour chaque article
    foreach ($items as $item) {
        $stmt = $pdo->prepare("
            INSERT INTO stock_movements 
            (product_id, movement_type, quantity, unit_id, to_warehouse_id, 
             reference_type, reference_id, reason, user_id, tenant_id)
            VALUES (?, 'entry', ?, ?, ?, 'purchase_order', ?, 'Réception fournisseur', ?, ?)
        ");
        
        $stmt->execute([
            $item['product_id'],
            $item['quantity'],
            $item['unit_id'],
            $warehouse_id,
            $po_id,
            $user_id,
            $tenant_id
        ]);

        // Mettre à jour les niveaux de stock
        $stmt = $pdo->prepare("
            INSERT INTO stock_levels (product_id, warehouse_id, unit_id, quantity, tenant_id)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + ?
        ");
        $stmt->execute([
            $item['product_id'],
            $warehouse_id,
            $item['unit_id'],
            $item['quantity'],
            $tenant_id,
            $item['quantity']
        ]);
    }

    logSyncOperation('supplier_order_received', 'stock_movements', $po_id, 'create');
}

/**
 * Fonction utilitaire : Crée automatiquement l'écriture comptable pour un paiement fournisseur
 */
function createSupplierPaymentEntry($po_id, $amount, $payment_method) {
    global $pdo, $tenant_id, $user_id;

    // Récupérer la commande
    $stmt = $pdo->prepare("SELECT supplier_id FROM purchase_orders WHERE id = ?");
    $stmt->execute([$po_id]);
    $po = $stmt->fetch();

    if (!$po) return;

    // Déterminer les comptes comptables selon la méthode de paiement
    $debit_account = null;
    $credit_account = null;

    switch ($payment_method) {
        case 'cash':
            $debit_account = '401'; // Compte fournisseur
            $credit_account = '5710'; // Caisse
            break;
        case 'bank_transfer':
            $debit_account = '401'; // Compte fournisseur
            $credit_account = '5141'; // Banque
            break;
        case 'check':
            $debit_account = '401'; // Compte fournisseur
            $credit_account = '5112'; // Chèques émis
            break;
        default:
            return; // Ne pas créer d'écriture pour les autres méthodes
    }

    // Créer l'écriture comptable
    createAccountingEntry(
        'purchases',
        date('Y-m-d'),
        "Paiement fournisseur PO-{$po_id}",
        [
            ['account' => $debit_account, 'debit' => $amount, 'credit' => 0],
            ['account' => $credit_account, 'debit' => 0, 'credit' => $amount]
        ]
    );
}

function logSyncOperation($operation_type, $source_module, $reference_id, $action) {
    global $pdo, $tenant_id, $user_id;
    
    $stmt = $pdo->prepare("
        INSERT INTO sync_logs (operation_type, source_module, reference_id, status, user_id, tenant_id)
        VALUES (?, ?, ?, 'pending', ?, ?)
    ");
    
    $stmt->execute([$operation_type, $source_module, $reference_id, $user_id, $tenant_id]);
}

function createAccountingEntry($journal_code, $entry_date, $description, $lines) {
    // Cette fonction sera implémentée avec l'API comptable
}
?>
