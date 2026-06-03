<?php
/**
 * API - Module Comptabilité Conforme OHADA
 * Gère le plan comptable, journaux, écritures et états financiers OHADA
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
        
        // ====================== PLAN COMPTABLE ======================
        
        case 'get_accounting_chart':
            /**
             * Récupère le plan comptable OHADA
             */
            $account_type = $_GET['account_type'] ?? null;

            $query = "
                SELECT * FROM accounting_chart
                WHERE is_active = 1
            ";
            $params = [];

            if ($account_type) {
                $query .= " AND account_type = ?";
                $params[] = $account_type;
            }

            $query .= " ORDER BY account_code ASC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $accounts = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $accounts]);
            break;

        case 'add_accounting_account':
            /**
             * Ajoute un compte au plan comptable
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['account_code', 'account_name', 'account_type'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            $valid_types = ['asset', 'liability', 'equity', 'revenue', 'expense', 'intermediate'];
            if (!in_array($data['account_type'], $valid_types)) {
                throw new Exception("Type de compte invalide");
            }

            $stmt = $pdo->prepare("
                INSERT INTO accounting_chart 
                (account_code, account_name, account_type, account_category, description)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['account_code'],
                $data['account_name'],
                $data['account_type'],
                $data['account_category'] ?? null,
                $data['description'] ?? null
            ]);

            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;

        // ====================== JOURNAUX COMPTABLES ======================
        
        case 'get_journals':
            /**
             * Récupère les journaux comptables
             */
            $stmt = $pdo->prepare("
                SELECT * FROM accounting_journal 
                WHERE is_active = 1 AND tenant_id = ?
                ORDER BY journal_type, journal_code ASC
            ");
            $stmt->execute([$tenant_id]);
            $journals = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $journals]);
            break;

        case 'create_journal':
            /**
             * Crée un nouveau journal comptable
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['journal_code', 'journal_name', 'journal_type'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            $valid_types = ['sales', 'purchases', 'bank', 'cash', 'general'];
            if (!in_array($data['journal_type'], $valid_types)) {
                throw new Exception("Type de journal invalide");
            }

            $stmt = $pdo->prepare("
                INSERT INTO accounting_journal 
                (journal_code, journal_name, journal_type, description, tenant_id)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['journal_code'],
                $data['journal_name'],
                $data['journal_type'],
                $data['description'] ?? null,
                $tenant_id
            ]);

            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;

        // ====================== ECRITURES COMPTABLES ======================
        
        case 'create_entry':
            /**
             * Crée une écriture comptable avec ses lignes
             */
            $data = json_decode(file_get_contents("php://input"), true);
            
            $required = ['journal_id', 'entry_date', 'lines'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            // Vérifier que la somme des débits = somme des crédits
            $total_debit = 0;
            $total_credit = 0;

            foreach ($data['lines'] as $line) {
                $total_debit += $line['debit'] ?? 0;
                $total_credit += $line['credit'] ?? 0;
            }

            if (abs($total_debit - $total_credit) > 0.01) {
                throw new Exception("Les débits et crédits ne sont pas équilibrés (Débit: $total_debit, Crédit: $total_credit)");
            }

            // Générer le numéro d'écriture
            $entry_number = generateEntryNumber($data['journal_id'], $tenant_id);

            // Créer l'écriture
            $stmt = $pdo->prepare("
                INSERT INTO accounting_entries 
                (journal_id, entry_date, entry_number, reference_type, reference_id, description, user_id, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['journal_id'],
                $data['entry_date'],
                $entry_number,
                $data['reference_type'] ?? null,
                $data['reference_id'] ?? null,
                $data['description'] ?? null,
                $user_id,
                $tenant_id
            ]);

            $entry_id = $pdo->lastInsertId();

            // Insérer les lignes
            $stmt = $pdo->prepare("
                INSERT INTO accounting_entry_lines 
                (entry_id, account_id, debit, credit, line_number, description, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $line_number = 1;
            foreach ($data['lines'] as $line) {
                $stmt->execute([
                    $entry_id,
                    $line['account_id'],
                    $line['debit'] ?? 0,
                    $line['credit'] ?? 0,
                    $line_number++,
                    $line['description'] ?? null,
                    $tenant_id
                ]);
            }

            logSyncOperation('accounting_entry_created', 'accounting_entries', $entry_id, 'create');

            echo json_encode([
                'success' => true,
                'id' => $entry_id,
                'entry_number' => $entry_number,
                'message' => 'Écriture créée avec succès'
            ]);
            break;

        case 'validate_entry':
            /**
             * Valide une écriture comptable
             */
            $entry_id = $_POST['entry_id'] ?? 0;

            if (!$entry_id) {
                throw new Exception("entry_id requis");
            }

            $stmt = $pdo->prepare("
                UPDATE accounting_entries 
                SET status = 'validated', validated_by = ?, validated_at = NOW()
                WHERE id = ? AND tenant_id = ?
            ");
            
            $stmt->execute([$user_id, $entry_id, $tenant_id]);

            // Mettre à jour les balances comptables
            updateAccountingBalances($entry_id);

            logSyncOperation('accounting_entry_validated', 'accounting_entries', $entry_id, 'validate');

            echo json_encode(['success' => true, 'message' => 'Écriture validée']);
            break;

        case 'get_entries':
            /**
             * Récupère les écritures comptables
             */
            $journal_id = $_GET['journal_id'] ?? null;
            $status = $_GET['status'] ?? null;
            $from_date = $_GET['from_date'] ?? null;
            $to_date = $_GET['to_date'] ?? null;

            $query = "
                SELECT ae.*, aj.journal_name, u.username as created_by
                FROM accounting_entries ae
                JOIN accounting_journal aj ON ae.journal_id = aj.id
                LEFT JOIN users u ON ae.user_id = u.id
                WHERE ae.tenant_id = ?
            ";
            $params = [$tenant_id];

            if ($journal_id) {
                $query .= " AND ae.journal_id = ?";
                $params[] = $journal_id;
            }

            if ($status) {
                $query .= " AND ae.status = ?";
                $params[] = $status;
            }

            if ($from_date) {
                $query .= " AND ae.entry_date >= ?";
                $params[] = $from_date;
            }

            if ($to_date) {
                $query .= " AND ae.entry_date <= ?";
                $params[] = $to_date;
            }

            $query .= " ORDER BY ae.entry_date DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $entries = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $entries]);
            break;

        case 'get_entry_details':
            /**
             * Récupère les détails d'une écriture avec ses lignes
             */
            $entry_id = $_GET['entry_id'] ?? 0;

            if (!$entry_id) {
                throw new Exception("entry_id requis");
            }

            $stmt = $pdo->prepare("
                SELECT ae.*, aj.journal_name, u.username as created_by
                FROM accounting_entries ae
                JOIN accounting_journal aj ON ae.journal_id = aj.id
                LEFT JOIN users u ON ae.user_id = u.id
                WHERE ae.id = ? AND ae.tenant_id = ?
            ");
            $stmt->execute([$entry_id, $tenant_id]);
            $entry = $stmt->fetch();

            if (!$entry) {
                throw new Exception("Écriture non trouvée");
            }

            // Récupérer les lignes
            $stmt = $pdo->prepare("
                SELECT ael.*, ac.account_code, ac.account_name
                FROM accounting_entry_lines ael
                JOIN accounting_chart ac ON ael.account_id = ac.id
                WHERE ael.entry_id = ?
                ORDER BY ael.line_number ASC
            ");
            $stmt->execute([$entry_id]);
            $lines = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'data' => ['entry' => $entry, 'lines' => $lines]
            ]);
            break;

        // ====================== RAPPORTS FINANCIERS ======================
        
        case 'get_trial_balance':
            /**
             * Récupère la balance générale des comptes
             */
            $period = $_GET['period'] ?? date('Y-m');

            $stmt = $pdo->prepare("
                SELECT ac.id, ac.account_code, ac.account_name, ac.account_type,
                       COALESCE(ab.debit_balance, 0) as debit,
                       COALESCE(ab.credit_balance, 0) as credit,
                       COALESCE(ab.debit_balance, 0) - COALESCE(ab.credit_balance, 0) as balance
                FROM accounting_chart ac
                LEFT JOIN accounting_balances ab ON ac.id = ab.account_id AND ab.accounting_period = ?
                WHERE ac.is_active = 1
                ORDER BY ac.account_code ASC
            ");
            $stmt->execute([$period]);
            $balances = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $balances]);
            break;

        case 'get_income_statement':
            /**
             * Récupère l'état des résultats (Compte de résultat)
             */
            $period = $_GET['period'] ?? date('Y-m');

            $query = "
                SELECT 
                    ac.account_code, ac.account_name, ac.account_type,
                    COALESCE(SUM(CASE WHEN ael.account_id = ac.id THEN ael.debit ELSE 0 END), 0) as debit,
                    COALESCE(SUM(CASE WHEN ael.account_id = ac.id THEN ael.credit ELSE 0 END), 0) as credit
                FROM accounting_chart ac
                LEFT JOIN accounting_entry_lines ael ON ac.id = ael.account_id
                LEFT JOIN accounting_entries ae ON ael.entry_id = ae.id
                WHERE ac.account_type IN ('revenue', 'expense', 'intermediate')
                AND ac.is_active = 1
                AND (ae.entry_date IS NULL OR DATE_FORMAT(ae.entry_date, '%Y-%m') = ?)
                GROUP BY ac.id
                ORDER BY ac.account_type DESC, ac.account_code ASC
            ";

            $stmt = $pdo->prepare($query);
            $stmt->execute([$period]);
            $income_statement = $stmt->fetchAll();

            // Calculer les totaux
            $revenue_total = 0;
            $expense_total = 0;

            foreach ($income_statement as $row) {
                if ($row['account_type'] === 'revenue') {
                    $revenue_total += $row['credit'] - $row['debit'];
                } else if ($row['account_type'] === 'expense') {
                    $expense_total += $row['debit'] - $row['credit'];
                }
            }

            $net_income = $revenue_total - $expense_total;

            echo json_encode([
                'success' => true,
                'data' => [
                    'details' => $income_statement,
                    'revenue_total' => $revenue_total,
                    'expense_total' => $expense_total,
                    'net_income' => $net_income
                ]
            ]);
            break;

        case 'get_balance_sheet':
            /**
             * Récupère le bilan (Actif, Passif, Capitaux propres)
             */
            $period = $_GET['period'] ?? date('Y-m');

            $query = "
                SELECT 
                    ac.account_code, ac.account_name, ac.account_type,
                    COALESCE(SUM(CASE WHEN ael.account_id = ac.id THEN ael.debit ELSE 0 END), 0) as debit,
                    COALESCE(SUM(CASE WHEN ael.account_id = ac.id THEN ael.credit ELSE 0 END), 0) as credit
                FROM accounting_chart ac
                LEFT JOIN accounting_entry_lines ael ON ac.id = ael.account_id
                LEFT JOIN accounting_entries ae ON ael.entry_id = ae.id
                WHERE ac.account_type IN ('asset', 'liability', 'equity')
                AND ac.is_active = 1
                AND (ae.entry_date IS NULL OR DATE_FORMAT(ae.entry_date, '%Y-%m') <= ?)
                GROUP BY ac.id
                ORDER BY ac.account_type DESC, ac.account_code ASC
            ";

            $stmt = $pdo->prepare($query);
            $stmt->execute([$period]);
            $balance_sheet = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $balance_sheet]);
            break;

        // ====================== ECRITURES AUTOMATIQUES ======================
        
        case 'setup_automation_rules':
            /**
             * Configure les règles d'automatisation comptable
             */
            setupDefaultAutomationRules($tenant_id);
            
            echo json_encode(['success' => true, 'message' => 'Règles d\'automatisation configurées']);
            break;

        default:
            throw new Exception("Action non reconnue: $action");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Fonction utilitaire : Génère un numéro d'écriture unique
 */
function generateEntryNumber($journal_id, $tenant_id) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT journal_code FROM accounting_journal WHERE id = ? AND tenant_id = ?
    ");
    $stmt->execute([$journal_id, $tenant_id]);
    $journal = $stmt->fetch();
    
    $date = date('Ymd');
    $count = $pdo->query("
        SELECT COUNT(*) as cnt FROM accounting_entries 
        WHERE journal_id = $journal_id AND DATE(entry_date) = '$date'
    ")->fetch();
    
    return $journal['journal_code'] . '-' . $date . '-' . str_pad($count['cnt'] + 1, 5, '0', STR_PAD_LEFT);
}

/**
 * Fonction utilitaire : Met à jour les balances comptables
 */
function updateAccountingBalances($entry_id) {
    global $pdo, $tenant_id;

    // Récupérer l'écriture et la période
    $stmt = $pdo->prepare("SELECT entry_date FROM accounting_entries WHERE id = ?");
    $stmt->execute([$entry_id]);
    $entry = $stmt->fetch();

    if (!$entry) return;

    $period = date('Y-m', strtotime($entry['entry_date']));

    // Récupérer les lignes de l'écriture
    $stmt = $pdo->prepare("SELECT account_id, debit, credit FROM accounting_entry_lines WHERE entry_id = ?");
    $stmt->execute([$entry_id]);
    $lines = $stmt->fetchAll();

    // Mettre à jour les balances pour chaque compte
    foreach ($lines as $line) {
        $stmt = $pdo->prepare("
            INSERT INTO accounting_balances (account_id, accounting_period, debit_balance, credit_balance, tenant_id)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            debit_balance = debit_balance + ?,
            credit_balance = credit_balance + ?
        ");

        $stmt->execute([
            $line['account_id'],
            $period,
            $line['debit'],
            $line['credit'],
            $tenant_id,
            $line['debit'],
            $line['credit']
        ]);
    }
}

/**
 * Fonction utilitaire : Configure les règles d'automatisation comptable par défaut
 */
function setupDefaultAutomationRules($tenant_id) {
    global $pdo;

    // Récupérer les comptes de base
    $accounts = [
        'sales' => ['source' => 701, 'dest' => 4111], // Ventes -> Clients
        'purchases' => ['source' => 601, 'dest' => 4010], // Achats -> Fournisseurs
        'cash_in' => ['source' => 5710, 'dest' => 4111], // Caisse -> Clients
        'cash_out' => ['source' => 6, 'dest' => 5710], // Dépenses -> Caisse
    ];

    // Insérer les règles
    foreach ($accounts as $trigger => $mapping) {
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO accounting_automate_rules 
            (rule_name, trigger_type, source_account, destination_account, is_active, tenant_id)
            VALUES (?, ?, ?, ?, 1, ?)
        ");

        $trigger_type = explode('_', $trigger)[0];
        $stmt->execute([
            "Rule: $trigger",
            $trigger_type,
            $mapping['source'],
            $mapping['dest'],
            $tenant_id
        ]);
    }
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
