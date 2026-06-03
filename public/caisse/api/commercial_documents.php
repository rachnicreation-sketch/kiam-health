<?php
/**
 * API - Gestion Documentaire Commerciale
 * Gère les devis, factures, bons de commande et bons de livraison
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
        
        // ====================== DEVIS ======================
        
        case 'create_quotation':
            /**
             * Crée un nouveau devis
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (empty($data['client_id']) || empty($data['items'])) {
                throw new Exception("client_id et items sont requis");
            }

            // Générer le numéro de devis
            $quotation_number = generateQuotationNumber($tenant_id);

            // Calculer les totaux
            $total_ht = 0;
            foreach ($data['items'] as $item) {
                $total_ht += $item['quantity'] * $item['unit_price'];
            }

            $tax_rate = $data['tax_rate'] ?? 18;
            $tax_amount = $total_ht * ($tax_rate / 100);
            $total_ttc = $total_ht + $tax_amount;

            // Créer le devis
            $stmt = $pdo->prepare("
                INSERT INTO quotations 
                (quotation_number, client_id, quotation_date, expiry_date, total_ht, tax_amount, total_ttc, user_id, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $quotation_number,
                $data['client_id'],
                date('Y-m-d'),
                $data['expiry_date'] ?? date('Y-m-d', strtotime('+30 days')),
                $total_ht,
                $tax_amount,
                $total_ttc,
                $user_id,
                $tenant_id
            ]);

            $quotation_id = $pdo->lastInsertId();

            // Insérer les articles
            $stmt = $pdo->prepare("
                INSERT INTO quotation_items 
                (quotation_id, product_id, unit_id, quantity, unit_price, description, line_order, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $line_order = 1;
            foreach ($data['items'] as $item) {
                $stmt->execute([
                    $quotation_id,
                    $item['product_id'],
                    $item['unit_id'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['description'] ?? null,
                    $line_order++,
                    $tenant_id
                ]);
            }

            logSyncOperation('quotation_created', 'quotations', $quotation_id, 'create');

            echo json_encode([
                'success' => true,
                'id' => $quotation_id,
                'quotation_number' => $quotation_number,
                'message' => 'Devis créé avec succès'
            ]);
            break;

        case 'update_quotation_status':
            /**
             * Met à jour le statut d'un devis
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (empty($data['quotation_id']) || empty($data['status'])) {
                throw new Exception("quotation_id et status sont requis");
            }

            $valid_statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
            if (!in_array($data['status'], $valid_statuses)) {
                throw new Exception("Statut invalide");
            }

            $update_fields = [];
            if ($data['status'] === 'sent') {
                $update_fields[] = "sent_date = NOW()";
            } elseif ($data['status'] === 'accepted') {
                $update_fields[] = "acceptance_date = NOW()";
            }

            $update_fields[] = "status = ?";

            $stmt = $pdo->prepare("
                UPDATE quotations SET " . implode(', ', $update_fields) . "
                WHERE id = ? AND tenant_id = ?
            ");
            
            $params = [$data['status'], $data['quotation_id'], $tenant_id];
            $stmt->execute($params);

            logSyncOperation('quotation_status_updated', 'quotations', $data['quotation_id'], 'update');

            echo json_encode(['success' => true, 'message' => 'Statut du devis mis à jour']);
            break;

        // ====================== FACTURES ======================
        
        case 'create_invoice':
            /**
             * Crée une nouvelle facture
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (empty($data['client_id']) || empty($data['items'])) {
                throw new Exception("client_id et items sont requis");
            }

            // Générer le numéro de facture
            $invoice_number = generateInvoiceNumber($tenant_id);

            // Calculer les totaux
            $total_ht = 0;
            foreach ($data['items'] as $item) {
                $total_ht += $item['quantity'] * $item['unit_price'];
            }

            $tax_rate = $data['tax_rate'] ?? 18;
            $tax_amount = $total_ht * ($tax_rate / 100);
            $total_ttc = $total_ht + $tax_amount;
            $sale_type = $data['sale_type'] ?? 'cash';

            // Déterminer la date d'échéance
            if ($sale_type === 'credit') {
                $due_date = date('Y-m-d', strtotime('+30 days'));
            } else {
                $due_date = date('Y-m-d');
            }

            // Créer la facture
            $stmt = $pdo->prepare("
                INSERT INTO invoices 
                (invoice_number, client_id, invoice_date, due_date, sale_type, 
                 total_ht, tax_amount, total_ttc, balance_due, user_id, quotation_id, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $invoice_number,
                $data['client_id'],
                date('Y-m-d'),
                $due_date,
                $sale_type,
                $total_ht,
                $tax_amount,
                $total_ttc,
                $total_ttc,
                $user_id,
                $data['quotation_id'] ?? null,
                $tenant_id
            ]);

            $invoice_id = $pdo->lastInsertId();

            // Insérer les articles
            $stmt = $pdo->prepare("
                INSERT INTO invoice_items 
                (invoice_id, product_id, unit_id, quantity, unit_price, description, line_order, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $line_order = 1;
            foreach ($data['items'] as $item) {
                $stmt->execute([
                    $invoice_id,
                    $item['product_id'],
                    $item['unit_id'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['description'] ?? null,
                    $line_order++,
                    $tenant_id
                ]);

                // Enregistrer le mouvement de stock
                if ($sale_type === 'cash') {
                    recordSaleStockMovement($item['product_id'], $item['unit_id'], $item['quantity'], $invoice_id);
                }
            }

            // Si vente à crédit, enregistrer dans le système de crédit
            if ($sale_type === 'credit') {
                recordCreditSaleFromInvoice($invoice_id, $data['client_id'], $total_ttc);
            }

            // Créer l'écriture comptable de vente
            createSalesEntry($invoice_id, $total_ht, $tax_amount);

            logSyncOperation('invoice_created', 'invoices', $invoice_id, 'create');

            echo json_encode([
                'success' => true,
                'id' => $invoice_id,
                'invoice_number' => $invoice_number,
                'message' => 'Facture créée avec succès'
            ]);
            break;

        case 'record_invoice_payment':
            /**
             * Enregistre un paiement de facture
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (empty($data['invoice_id']) || empty($data['payment_amount'])) {
                throw new Exception("invoice_id et payment_amount sont requis");
            }

            // Récupérer la facture
            $stmt = $pdo->prepare("
                SELECT total_ttc, amount_paid, sale_type FROM invoices 
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$data['invoice_id'], $tenant_id]);
            $invoice = $stmt->fetch();

            if (!$invoice) {
                throw new Exception("Facture non trouvée");
            }

            // Enregistrer le paiement
            $stmt = $pdo->prepare("
                INSERT INTO invoice_payments 
                (invoice_id, payment_amount, payment_date, payment_method, reference, user_id, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['invoice_id'],
                $data['payment_amount'],
                $data['payment_date'] ?? date('Y-m-d'),
                $data['payment_method'] ?? 'cash',
                $data['reference'] ?? null,
                $user_id,
                $tenant_id
            ]);

            $payment_id = $pdo->lastInsertId();

            // Mettre à jour le statut de la facture
            $new_amount_paid = $invoice['amount_paid'] + $data['payment_amount'];
            if ($new_amount_paid >= $invoice['total_ttc']) {
                $status = 'paid';
            } elseif ($new_amount_paid > 0) {
                $status = 'partially_paid';
            } else {
                $status = 'unpaid';
            }

            $stmt = $pdo->prepare("
                UPDATE invoices SET amount_paid = ?, balance_due = ?, status = ? WHERE id = ?
            ");
            $stmt->execute([
                $new_amount_paid,
                $invoice['total_ttc'] - $new_amount_paid,
                $status,
                $data['invoice_id']
            ]);

            // Créer l'écriture comptable de paiement
            createPaymentEntry($data['invoice_id'], $data['payment_amount'], $data['payment_method'] ?? 'cash');

            logSyncOperation('invoice_payment_recorded', 'invoice_payments', $payment_id, 'create');

            echo json_encode(['success' => true, 'message' => 'Paiement enregistré']);
            break;

        case 'get_invoices':
            /**
             * Récupère les factures avec filtres
             */
            $status = $_GET['status'] ?? null;
            $client_id = $_GET['client_id'] ?? null;
            $from_date = $_GET['from_date'] ?? null;

            $query = "
                SELECT i.*, c.name as client_name, u.username as created_by
                FROM invoices i
                JOIN clients c ON i.client_id = c.id
                LEFT JOIN users u ON i.user_id = u.id
                WHERE i.tenant_id = ?
            ";
            $params = [$tenant_id];

            if ($status) {
                $query .= " AND i.status = ?";
                $params[] = $status;
            }

            if ($client_id) {
                $query .= " AND i.client_id = ?";
                $params[] = $client_id;
            }

            if ($from_date) {
                $query .= " AND i.invoice_date >= ?";
                $params[] = $from_date;
            }

            $query .= " ORDER BY i.invoice_date DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $invoices = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $invoices]);
            break;

        case 'get_invoice_details':
            /**
             * Récupère les détails complets d'une facture
             */
            $invoice_id = $_GET['invoice_id'] ?? 0;

            if (!$invoice_id) {
                throw new Exception("invoice_id requis");
            }

            $stmt = $pdo->prepare("
                SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone
                FROM invoices i
                JOIN clients c ON i.client_id = c.id
                WHERE i.id = ? AND i.tenant_id = ?
            ");
            $stmt->execute([$invoice_id, $tenant_id]);
            $invoice = $stmt->fetch();

            if (!$invoice) {
                throw new Exception("Facture non trouvée");
            }

            // Récupérer les articles
            $stmt = $pdo->prepare("
                SELECT ii.*, p.name as product_name, pu.abbreviation
                FROM invoice_items ii
                JOIN products p ON ii.product_id = p.id
                JOIN product_units pu ON ii.unit_id = pu.id
                WHERE ii.invoice_id = ?
                ORDER BY ii.line_order
            ");
            $stmt->execute([$invoice_id]);
            $items = $stmt->fetchAll();

            // Récupérer les paiements
            $stmt = $pdo->prepare("
                SELECT * FROM invoice_payments 
                WHERE invoice_id = ? 
                ORDER BY payment_date DESC
            ");
            $stmt->execute([$invoice_id]);
            $payments = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'data' => [
                    'invoice' => $invoice,
                    'items' => $items,
                    'payments' => $payments
                ]
            ]);
            break;

        // ====================== DOCUMENTS STATISTIQUES ======================
        
        case 'get_documents_dashboard':
            /**
             * Récupère un résumé de tous les documents commerciaux
             */
            $dashboard = [];

            // Devis
            $stmt = $pdo->prepare("
                SELECT status, COUNT(*) as count FROM quotations 
                WHERE tenant_id = ? AND quotation_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY status
            ");
            $stmt->execute([$tenant_id]);
            $dashboard['quotations'] = $stmt->fetchAll();

            // Factures
            $stmt = $pdo->prepare("
                SELECT status, COUNT(*) as count FROM invoices 
                WHERE tenant_id = ? AND invoice_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY status
            ");
            $stmt->execute([$tenant_id]);
            $dashboard['invoices'] = $stmt->fetchAll();

            // Commandes d'achat
            $stmt = $pdo->prepare("
                SELECT status, COUNT(*) as count FROM purchase_orders 
                WHERE tenant_id = ? AND po_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY status
            ");
            $stmt->execute([$tenant_id]);
            $dashboard['purchase_orders'] = $stmt->fetchAll();

            // Bons de livraison
            $stmt = $pdo->prepare("
                SELECT status, COUNT(*) as count FROM delivery_notes 
                WHERE tenant_id = ? AND delivery_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY status
            ");
            $stmt->execute([$tenant_id]);
            $dashboard['delivery_notes'] = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $dashboard]);
            break;

        default:
            throw new Exception("Action non reconnue: $action");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ====================== FONCTIONS UTILITAIRES ======================

function generateQuotationNumber($tenant_id) {
    global $pdo;
    
    $date = date('Ymd');
    $count = $pdo->query("
        SELECT COUNT(*) as cnt FROM quotations 
        WHERE tenant_id = $tenant_id AND DATE(created_at) = '$date'
    ")->fetch();
    
    return 'DEV-' . $date . '-' . str_pad($count['cnt'] + 1, 4, '0', STR_PAD_LEFT);
}

function generateInvoiceNumber($tenant_id) {
    global $pdo;
    
    $date = date('Ymd');
    $count = $pdo->query("
        SELECT COUNT(*) as cnt FROM invoices 
        WHERE tenant_id = $tenant_id AND DATE(created_at) = '$date'
    ")->fetch();
    
    return 'INV-' . $date . '-' . str_pad($count['cnt'] + 1, 5, '0', STR_PAD_LEFT);
}

function recordSaleStockMovement($product_id, $unit_id, $quantity, $invoice_id) {
    global $pdo, $tenant_id, $user_id;

    // Obtenir l'entrepôt principal
    $stmt = $pdo->prepare("SELECT id FROM warehouses WHERE tenant_id = ? AND is_main = 1");
    $stmt->execute([$tenant_id]);
    $warehouse = $stmt->fetch();
    $warehouse_id = $warehouse['id'] ?? 0;

    // Créer le mouvement de sortie
    $stmt = $pdo->prepare("
        INSERT INTO stock_movements 
        (product_id, movement_type, quantity, unit_id, from_warehouse_id, 
         reference_type, reference_id, reason, user_id, tenant_id)
        VALUES (?, 'exit', ?, ?, ?, 'invoice', ?, 'Vente facture', ?, ?)
    ");
    
    $stmt->execute([
        $product_id,
        $quantity,
        $unit_id,
        $warehouse_id,
        $invoice_id,
        $user_id,
        $tenant_id
    ]);

    // Mettre à jour le stock
    $stmt = $pdo->prepare("
        UPDATE stock_levels SET quantity = quantity - ?
        WHERE product_id = ? AND unit_id = ? AND warehouse_id = ? AND tenant_id = ?
    ");
    $stmt->execute([$quantity, $product_id, $unit_id, $warehouse_id, $tenant_id]);
}

function recordCreditSaleFromInvoice($invoice_id, $client_id, $amount) {
    global $pdo, $tenant_id, $user_id;

    $stmt = $pdo->prepare("
        INSERT INTO credit_transactions 
        (client_id, transaction_type, amount, transaction_date, reference_type, reference_id, user_id, tenant_id)
        VALUES (?, 'sale', ?, ?, 'invoice', ?, ?, ?)
    ");
    
    $stmt->execute([
        $client_id,
        $amount,
        date('Y-m-d'),
        $invoice_id,
        $user_id,
        $tenant_id
    ]);
}

function createSalesEntry($invoice_id, $total_ht, $tax_amount) {
    global $pdo, $tenant_id, $user_id;

    $debit_account = 4111; // Clients
    $credit_revenue = 701; // Ventes
    $credit_tax = 4455; // TVA à payer

    $stmt = $pdo->prepare("SELECT id FROM accounting_journal WHERE journal_code = 'VT' LIMIT 1");
    $stmt->execute();
    $journal = $stmt->fetch();
    $journal_id = $journal['id'] ?? 1;

    $entry_stmt = $pdo->prepare("
        INSERT INTO accounting_entries (journal_id, entry_date, description, user_id, tenant_id)
        VALUES (?, ?, ?, ?, ?)
    ");
    $entry_stmt->execute([$journal_id, date('Y-m-d'), "Facture #$invoice_id", $user_id, $tenant_id]);
    $entry_id = $pdo->lastInsertId();

    $line_stmt = $pdo->prepare("
        INSERT INTO accounting_entry_lines (entry_id, account_id, debit, credit, tenant_id)
        VALUES (?, ?, ?, ?, ?)
    ");

    $line_stmt->execute([$entry_id, $debit_account, $total_ht + $tax_amount, 0, $tenant_id]);
    $line_stmt->execute([$entry_id, $credit_revenue, 0, $total_ht, $tenant_id]);
    $line_stmt->execute([$entry_id, $credit_tax, 0, $tax_amount, $tenant_id]);
}

function createPaymentEntry($invoice_id, $amount, $payment_method) {
    global $pdo, $tenant_id, $user_id;

    $debit_account = null;
    $credit_account = 4111; // Clients

    switch ($payment_method) {
        case 'cash':
            $debit_account = 5710;
            break;
        case 'bank_transfer':
            $debit_account = 5141;
            break;
        case 'check':
            $debit_account = 5112;
            break;
        default:
            return;
    }

    $stmt = $pdo->prepare("SELECT id FROM accounting_journal WHERE journal_code = 'CA' LIMIT 1");
    $stmt->execute();
    $journal = $stmt->fetch();
    $journal_id = $journal['id'] ?? 1;

    $entry_stmt = $pdo->prepare("
        INSERT INTO accounting_entries (journal_id, entry_date, description, user_id, tenant_id)
        VALUES (?, ?, ?, ?, ?)
    ");
    $entry_stmt->execute([$journal_id, date('Y-m-d'), "Paiement facture #$invoice_id", $user_id, $tenant_id]);
    $entry_id = $pdo->lastInsertId();

    $line_stmt = $pdo->prepare("
        INSERT INTO accounting_entry_lines (entry_id, account_id, debit, credit, tenant_id)
        VALUES (?, ?, ?, ?, ?)
    ");

    $line_stmt->execute([$entry_id, $debit_account, $amount, 0, $tenant_id]);
    $line_stmt->execute([$entry_id, $credit_account, 0, $amount, $tenant_id]);
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
