<?php
/**
 * API - Gestion des Clients et Ventes à Crédit
 * Gère les comptes clients, les ventes à crédit et le suivi des paiements
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
        
        // ====================== GESTION DES CLIENTS ======================
        
        case 'setup_client_credit':
            /**
             * Configure les paramètres de crédit pour un client
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['client_id', 'credit_limit', 'credit_type'];
            foreach ($required as $field) {
                if (!isset($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            // Vérifier que le client existe
            $stmt = $pdo->prepare("SELECT id FROM clients WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$data['client_id'], $tenant_id]);
            if (!$stmt->fetch()) {
                throw new Exception("Client non trouvé");
            }

            $valid_types = ['cash', 'credit', 'both'];
            if (!in_array($data['credit_type'], $valid_types)) {
                throw new Exception("Type de crédit invalide");
            }

            // Mettre à jour le client
            $stmt = $pdo->prepare("
                UPDATE clients 
                SET credit_limit = ?, credit_type = ?, payment_terms = ?, is_blocked = ?
                WHERE id = ? AND tenant_id = ?
            ");
            
            $stmt->execute([
                $data['credit_limit'],
                $data['credit_type'],
                $data['payment_terms'] ?? 30,
                $data['is_blocked'] ? 1 : 0,
                $data['client_id'],
                $tenant_id
            ]);

            logAudit('clients', $data['client_id'], 'update_credit', null, $data);
            logSyncOperation('client_credit_setup', 'clients', $data['client_id'], 'update');

            echo json_encode(['success' => true, 'message' => 'Crédit client configuré']);
            break;

        case 'get_client_account':
            /**
             * Récupère le compte client avec historique et solde
             */
            $client_id = $_GET['client_id'] ?? 0;

            if (!$client_id) {
                throw new Exception("client_id requis");
            }

            $stmt = $pdo->prepare("
                SELECT id, name, email, phone, credit_limit, current_balance, 
                       credit_type, payment_terms, is_blocked
                FROM clients
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$client_id, $tenant_id]);
            $client = $stmt->fetch();

            if (!$client) {
                throw new Exception("Client non trouvé");
            }

            // Recalculer le solde actuel
            $stmt = $pdo->prepare("
                SELECT COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN amount 
                                         WHEN transaction_type = 'payment' THEN -amount ELSE 0 END), 0) as balance
                FROM credit_transactions
                WHERE client_id = ? AND tenant_id = ?
            ");
            $stmt->execute([$client_id, $tenant_id]);
            $result = $stmt->fetch();
            $client['current_balance'] = $result['balance'];
            $client['available_credit'] = max(0, $client['credit_limit'] - $client['current_balance']);

            // Récupérer l'historique des transactions
            $stmt = $pdo->prepare("
                SELECT ct.*, u.username as created_by
                FROM credit_transactions ct
                LEFT JOIN users u ON ct.user_id = u.id
                WHERE ct.client_id = ? AND ct.tenant_id = ?
                ORDER BY ct.transaction_date DESC
                LIMIT 100
            ");
            $stmt->execute([$client_id, $tenant_id]);
            $transactions = $stmt->fetchAll();

            // Récupérer le plan de paiement
            $stmt = $pdo->prepare("
                SELECT cps.*, ct.amount as original_amount
                FROM credit_payment_schedule cps
                LEFT JOIN credit_transactions ct ON cps.credit_transaction_id = ct.id
                WHERE cps.client_id = ? AND cps.tenant_id = ?
                ORDER BY cps.due_date ASC
            ");
            $stmt->execute([$client_id, $tenant_id]);
            $payment_schedule = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'data' => [
                    'client' => $client,
                    'transactions' => $transactions,
                    'payment_schedule' => $payment_schedule
                ]
            ]);
            break;

        case 'record_credit_sale':
            /**
             * Enregistre une vente à crédit pour un client
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['client_id', 'amount', 'due_date'];
            foreach ($required as $field) {
                if (!isset($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            // Vérifier le client et sa limite de crédit
            $stmt = $pdo->prepare("
                SELECT id, credit_limit, current_balance, is_blocked FROM clients 
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$data['client_id'], $tenant_id]);
            $client = $stmt->fetch();

            if (!$client) {
                throw new Exception("Client non trouvé");
            }

            if ($client['is_blocked']) {
                throw new Exception("Ce client a son compte bloqué");
            }

            $new_balance = $client['current_balance'] + $data['amount'];
            if ($new_balance > $client['credit_limit']) {
                throw new Exception("Cette vente dépasserait la limite de crédit du client");
            }

            // Enregistrer la transaction de crédit
            $stmt = $pdo->prepare("
                INSERT INTO credit_transactions 
                (client_id, transaction_type, amount, transaction_date, reference_type, reference_id, description, user_id, tenant_id)
                VALUES (?, 'sale', ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['client_id'],
                $data['amount'],
                date('Y-m-d'),
                $data['reference_type'] ?? 'invoice',
                $data['reference_id'] ?? null,
                $data['description'] ?? null,
                $user_id,
                $tenant_id
            ]);

            $transaction_id = $pdo->lastInsertId();

            // Créer le plan de paiement
            createPaymentSchedule($transaction_id, $data['client_id'], $data['amount'], $data['due_date']);

            // Mettre à jour le solde du client
            updateClientBalance($data['client_id']);

            // Créer l'écriture comptable
            createCreditSaleEntry($data['client_id'], $data['amount'], $data['reference_id'] ?? null);

            logSyncOperation('credit_sale_recorded', 'credit_transactions', $transaction_id, 'create');

            echo json_encode([
                'success' => true,
                'id' => $transaction_id,
                'message' => 'Vente à crédit enregistrée'
            ]);
            break;

        case 'record_credit_payment':
            /**
             * Enregistre un paiement contre un compte crédit client
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['client_id', 'amount', 'payment_date'];
            foreach ($required as $field) {
                if (!isset($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            // Enregistrer la transaction de paiement
            $stmt = $pdo->prepare("
                INSERT INTO credit_transactions 
                (client_id, transaction_type, amount, transaction_date, description, user_id, tenant_id)
                VALUES (?, 'payment', ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['client_id'],
                $data['amount'],
                $data['payment_date'],
                $data['description'] ?? 'Paiement client',
                $user_id,
                $tenant_id
            ]);

            $payment_id = $pdo->lastInsertId();

            // Mettre à jour le plan de paiement (les échéances les plus anciennes d'abord)
            $stmt = $pdo->prepare("
                SELECT id, amount_due, amount_paid FROM credit_payment_schedule 
                WHERE client_id = ? AND status IN ('pending', 'partial') AND tenant_id = ?
                ORDER BY due_date ASC
                LIMIT 1
            ");
            $stmt->execute([$data['client_id'], $tenant_id]);
            $schedule_item = $stmt->fetch();

            if ($schedule_item) {
                $new_paid = $schedule_item['amount_paid'] + $data['amount'];
                $new_status = ($new_paid >= $schedule_item['amount_due']) ? 'paid' : 'partial';

                $stmt = $pdo->prepare("
                    UPDATE credit_payment_schedule 
                    SET amount_paid = ?, status = ?, payment_date = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $new_paid,
                    $new_status,
                    $data['payment_date'],
                    $schedule_item['id']
                ]);
            }

            // Mettre à jour le solde du client
            updateClientBalance($data['client_id']);

            // Créer l'écriture comptable
            createClientPaymentEntry($data['client_id'], $data['amount']);

            logSyncOperation('credit_payment_recorded', 'credit_transactions', $payment_id, 'create');

            echo json_encode([
                'success' => true,
                'id' => $payment_id,
                'message' => 'Paiement enregistré'
            ]);
            break;

        case 'get_overdue_accounts':
            /**
             * Récupère les comptes avec arriérés
             */
            $stmt = $pdo->prepare("
                SELECT c.id, c.name, c.email, c.phone, c.credit_limit, c.current_balance,
                       COUNT(cps.id) as overdue_count, 
                       SUM(cps.amount_due - cps.amount_paid) as overdue_amount,
                       MIN(cps.due_date) as oldest_due_date
                FROM clients c
                LEFT JOIN credit_payment_schedule cps ON c.id = cps.client_id 
                    AND cps.status IN ('pending', 'partial', 'overdue')
                    AND cps.due_date < NOW()
                WHERE c.tenant_id = ?
                GROUP BY c.id
                HAVING overdue_count > 0
                ORDER BY oldest_due_date ASC
            ");
            $stmt->execute([$tenant_id]);
            $overdue = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $overdue]);
            break;

        case 'get_credit_report':
            /**
             * Récupère un rapport général des crédits clients
             */
            $stmt = $pdo->prepare("
                SELECT 
                    'Total Clients' as metric, COUNT(DISTINCT c.id) as value
                FROM clients c
                WHERE c.tenant_id = ?
                UNION ALL
                SELECT 
                    'Solde Total Crédits', COALESCE(SUM(c.current_balance), 0)
                FROM clients c
                WHERE c.tenant_id = ?
                UNION ALL
                SELECT 
                    'Crédits Échéance Dépassée', COALESCE(SUM(cps.amount_due - cps.amount_paid), 0)
                FROM credit_payment_schedule cps
                WHERE cps.due_date < NOW() AND cps.status != 'paid' AND cps.tenant_id = ?
            ");
            $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
            $report = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $report]);
            break;

        default:
            throw new Exception("Action non reconnue: $action");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Fonction utilitaire : Crée le plan de paiement pour une vente à crédit
 */
function createPaymentSchedule($transaction_id, $client_id, $total_amount, $due_date) {
    global $pdo, $tenant_id;

    // Pour simplifier, une seule échéance. Peut être étendu pour plusieurs échéances
    $stmt = $pdo->prepare("
        INSERT INTO credit_payment_schedule 
        (credit_transaction_id, client_id, due_date, amount_due, tenant_id)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([$transaction_id, $client_id, $due_date, $total_amount, $tenant_id]);
}

/**
 * Fonction utilitaire : Met à jour le solde actuel du client
 */
function updateClientBalance($client_id) {
    global $pdo, $tenant_id;

    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(CASE 
            WHEN transaction_type = 'sale' THEN amount 
            WHEN transaction_type = 'payment' THEN -amount 
            ELSE 0 
        END), 0) as balance
        FROM credit_transactions
        WHERE client_id = ? AND tenant_id = ?
    ");
    $stmt->execute([$client_id, $tenant_id]);
    $result = $stmt->fetch();

    $stmt = $pdo->prepare("
        UPDATE clients SET current_balance = ? WHERE id = ? AND tenant_id = ?
    ");
    $stmt->execute([$result['balance'], $client_id, $tenant_id]);
}

/**
 * Fonction utilitaire : Crée l'écriture comptable pour une vente à crédit
 */
function createCreditSaleEntry($client_id, $amount, $reference_id = null) {
    global $pdo, $tenant_id, $user_id;

    // Comptes standards OHADA : 4111 (Clients) et 701 (Ventes de marchandises)
    $debit_account = 4111; // Clients
    $credit_account = 701; // Ventes

    $stmt = $pdo->prepare("
        SELECT id FROM accounting_journal WHERE journal_code = 'VT' LIMIT 1
    ");
    $stmt->execute();
    $journal = $stmt->fetch();
    $journal_id = $journal['id'] ?? 1;

    $entry_stmt = $pdo->prepare("
        INSERT INTO accounting_entries 
        (journal_id, entry_date, description, user_id, tenant_id)
        VALUES (?, ?, ?, ?, ?)
    ");
    $entry_stmt->execute([
        $journal_id,
        date('Y-m-d'),
        "Vente à crédit client #$client_id",
        $user_id,
        $tenant_id
    ]);

    $entry_id = $pdo->lastInsertId();

    // Créer les lignes d'écriture
    $line_stmt = $pdo->prepare("
        INSERT INTO accounting_entry_lines (entry_id, account_id, debit, credit, tenant_id)
        VALUES (?, ?, ?, ?, ?)
    ");

    $line_stmt->execute([$entry_id, $debit_account, $amount, 0, $tenant_id]);
    $line_stmt->execute([$entry_id, $credit_account, 0, $amount, $tenant_id]);
}

/**
 * Fonction utilitaire : Crée l'écriture comptable pour un paiement client
 */
function createClientPaymentEntry($client_id, $amount) {
    global $pdo, $tenant_id, $user_id;

    // Comptes standards : 4111 (Clients) et 5710 (Caisse)
    $debit_account = 5710; // Caisse
    $credit_account = 4111; // Clients

    $stmt = $pdo->prepare("
        SELECT id FROM accounting_journal WHERE journal_code = 'CA' LIMIT 1
    ");
    $stmt->execute();
    $journal = $stmt->fetch();
    $journal_id = $journal['id'] ?? 1;

    $entry_stmt = $pdo->prepare("
        INSERT INTO accounting_entries 
        (journal_id, entry_date, description, user_id, tenant_id)
        VALUES (?, ?, ?, ?, ?)
    ");
    $entry_stmt->execute([
        $journal_id,
        date('Y-m-d'),
        "Paiement client #$client_id",
        $user_id,
        $tenant_id
    ]);

    $entry_id = $pdo->lastInsertId();

    $line_stmt = $pdo->prepare("
        INSERT INTO accounting_entry_lines (entry_id, account_id, debit, credit, tenant_id)
        VALUES (?, ?, ?, ?, ?)
    ");

    $line_stmt->execute([$entry_id, $debit_account, $amount, 0, $tenant_id]);
    $line_stmt->execute([$entry_id, $credit_account, 0, $amount, $tenant_id]);
}

function logAudit($entity_type, $entity_id, $action, $old_values = null, $new_values = null) {
    global $pdo, $tenant_id, $user_id;
    
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

function logSyncOperation($operation_type, $source_module, $reference_id, $action) {
    global $pdo, $tenant_id, $user_id;
    
    $stmt = $pdo->prepare("
        INSERT INTO sync_logs (operation_type, source_module, reference_id, status, user_id, tenant_id)
        VALUES (?, ?, ?, 'pending', ?, ?)
    ");
    
    $stmt->execute([$operation_type, $source_module, $reference_id, $user_id, $tenant_id]);
}
?>
