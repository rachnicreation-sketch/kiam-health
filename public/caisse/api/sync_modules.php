<?php
/**
 * Module de Synchronisation Globale des Modules ERP
 * Gère la synchronisation automatique entre :
 * - Vente → Stock → Caisse → Comptabilité
 * - Achat → Stock → Fournisseur → Comptabilité
 * - Crédit client → Comptabilité → Suivi des dettes
 * - Inventaire → Ajustement de stock → Comptabilité
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json; charset=utf-8');

// Cette fonction peut être appelée en CLI ou via une tâche planifiée
function syncAllModules() {
    global $pdo;

    try {
        // Traiter toutes les opérations de synchronisation en attente
        $stmt = $pdo->query("
            SELECT * FROM sync_logs 
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT 100
        ");
        
        $operations = $stmt->fetchAll();

        foreach ($operations as $operation) {
            processSyncOperation($operation);
        }

        return [
            'success' => true,
            'processed' => count($operations),
            'message' => "Synchronisation complétée. {$operation_count} opérations traitées."
        ];

    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

/**
 * Traite une opération de synchronisation
 */
function processSyncOperation($operation) {
    global $pdo;

    try {
        switch ($operation['operation_type']) {
            
            // ===================== SYNCHRONISATION VENTES =====================
            
            case 'sale_recorded':
                syncSaleToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            case 'invoice_created':
                syncInvoiceToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            case 'invoice_payment_recorded':
                syncInvoicePaymentToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            // ===================== SYNCHRONISATION ACHATS =====================
            
            case 'purchase_order_creation':
                syncPurchaseOrderToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            case 'purchase_payment_recorded':
                syncSupplierPaymentToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            case 'supplier_order_received':
                syncStockReceiptToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            // ===================== SYNCHRONISATION STOCK =====================
            
            case 'stock_movement':
                syncStockMovementToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            case 'inventory_validation':
                syncInventoryAdjustmentsToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            // ===================== SYNCHRONISATION CREDITS =====================
            
            case 'credit_sale_recorded':
                syncCreditSaleToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            case 'credit_payment_recorded':
                syncCreditPaymentToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            // ===================== SYNCHRONISATION COMPTABILITE =====================
            
            case 'accounting_entry_validated':
                syncAccountingEntryToModules($operation['reference_id'], $operation['tenant_id']);
                break;

            default:
                // Opération inconnue ou déjà traitée
                break;
        }

        // Marquer l'opération comme complétée
        $stmt = $pdo->prepare("
            UPDATE sync_logs SET status = 'completed', completed_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$operation['id']]);

    } catch (Exception $e) {
        // Enregistrer l'erreur
        $stmt = $pdo->prepare("
            UPDATE sync_logs SET status = 'failed', error_message = ? 
            WHERE id = ?
        ");
        $stmt->execute([$e->getMessage(), $operation['id']]);

        // Logger l'erreur
        error_log("Erreur synchronisation: " . $e->getMessage());
    }
}

// ====================== FONCTIONS DE SYNCHRONISATION ======================

/**
 * Synchronise une facture de vente vers tous les modules
 */
function syncInvoiceToModules($invoice_id, $tenant_id) {
    global $pdo;

    // Récupérer la facture
    $stmt = $pdo->prepare("
        SELECT * FROM invoices WHERE id = ? AND tenant_id = ?
    ");
    $stmt->execute([$invoice_id, $tenant_id]);
    $invoice = $stmt->fetch();

    if (!$invoice) return;

    // 1. SYNCHRONISATION STOCK
    // Les mouvements de stock ont déjà été créés lors de la création de la facture
    
    // 2. SYNCHRONISATION COMPTABILITE
    // L'écriture comptable a été créée automatiquement
    
    // 3. SYNCHRONISATION CAISSE (si paiement immédiat)
    if ($invoice['sale_type'] === 'cash' && $invoice['amount_paid'] > 0) {
        updateCashRegister($tenant_id, $invoice['amount_paid'], 'income', "Vente facture #{$invoice_id}");
    }

    // 4. SYNCHRONISATION CLIENTS
    updateClientBalance($invoice['client_id']);
}

/**
 * Synchronise un paiement de facture
 */
function syncInvoicePaymentToModules($payment_id, $tenant_id) {
    global $pdo;

    // Récupérer le paiement et la facture
    $stmt = $pdo->prepare("
        SELECT ip.*, i.client_id 
        FROM invoice_payments ip
        JOIN invoices i ON ip.invoice_id = i.id
        WHERE ip.id = ? AND ip.tenant_id = ?
    ");
    $stmt->execute([$payment_id, $tenant_id]);
    $payment = $stmt->fetch();

    if (!$payment) return;

    // Mettre à jour la caisse
    updateCashRegister($tenant_id, $payment['payment_amount'], 'income', "Paiement facture");

    // Mettre à jour le solde client
    updateClientBalance($payment['client_id']);
}

/**
 * Synchronise la réception d'une commande fournisseur
 */
function syncStockReceiptToModules($po_id, $tenant_id) {
    global $pdo;

    // Le stock a déjà été mis à jour lors de la réception
    
    // Mettre à jour le statut du fournisseur
    $stmt = $pdo->prepare("
        SELECT supplier_id FROM purchase_orders WHERE id = ? AND tenant_id = ?
    ");
    $stmt->execute([$po_id, $tenant_id]);
    $po = $stmt->fetch();

    if ($po) {
        updateSupplierMetrics($po['supplier_id'], $tenant_id);
    }
}

/**
 * Synchronise une vente à crédit
 */
function syncCreditSaleToModules($credit_transaction_id, $tenant_id) {
    global $pdo;

    // Récupérer la transaction de crédit
    $stmt = $pdo->prepare("
        SELECT * FROM credit_transactions WHERE id = ? AND tenant_id = ?
    ");
    $stmt->execute([$credit_transaction_id, $tenant_id]);
    $transaction = $stmt->fetch();

    if (!$transaction || $transaction['transaction_type'] !== 'sale') return;

    // Mettre à jour le solde client
    updateClientBalance($transaction['client_id']);

    // Vérifier si le client a dépassé sa limite de crédit
    checkClientCreditLimit($transaction['client_id'], $tenant_id);
}

/**
 * Synchronise un paiement de crédit client
 */
function syncCreditPaymentToModules($credit_transaction_id, $tenant_id) {
    global $pdo;

    // Récupérer la transaction
    $stmt = $pdo->prepare("
        SELECT * FROM credit_transactions WHERE id = ? AND tenant_id = ?
    ");
    $stmt->execute([$credit_transaction_id, $tenant_id]);
    $transaction = $stmt->fetch();

    if (!$transaction || $transaction['transaction_type'] !== 'payment') return;

    // Mettre à jour le solde client
    updateClientBalance($transaction['client_id']);

    // Débloquer le client si applicable
    unlockClientIfEligible($transaction['client_id'], $tenant_id);

    // Mettre à jour la caisse
    updateCashRegister($tenant_id, $transaction['amount'], 'income', "Paiement crédit client");
}

/**
 * Synchronise les ajustements d'inventaire
 */
function syncInventoryAdjustmentsToModules($inventory_id, $tenant_id) {
    global $pdo;

    // Les ajustements de stock ont déjà été créés et synchronisés
    
    // Générer un rapport d'écarts d'inventaire
    generateInventoryVarianceReport($inventory_id, $tenant_id);
}

// ====================== FONCTIONS UTILITAIRES ======================

/**
 * Met à jour le solde actuel d'un client
 */
function updateClientBalance($client_id) {
    global $pdo;

    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(CASE 
            WHEN transaction_type = 'sale' THEN amount 
            WHEN transaction_type = 'payment' THEN -amount 
            ELSE 0 
        END), 0) as balance
        FROM credit_transactions
        WHERE client_id = ?
    ");
    $stmt->execute([$client_id]);
    $result = $stmt->fetch();

    $stmt = $pdo->prepare("UPDATE clients SET current_balance = ? WHERE id = ?");
    $stmt->execute([$result['balance'], $client_id]);
}

/**
 * Met à jour la caisse (registre)
 */
function updateCashRegister($tenant_id, $amount, $type, $description) {
    global $pdo;

    // Insérer dans un journal de caisse (suppose l'existence d'une table cash_register)
    $stmt = $pdo->prepare("
        INSERT INTO accounting_entries (journal_id, entry_date, description, tenant_id)
        SELECT id, NOW(), ?, ?
        FROM accounting_journal WHERE journal_code = 'CA' AND tenant_id = ?
        LIMIT 1
    ");
    $stmt->execute([$description, $tenant_id, $tenant_id]);
}

/**
 * Vérifie si un client a dépassé sa limite de crédit
 */
function checkClientCreditLimit($client_id, $tenant_id) {
    global $pdo;

    $stmt = $pdo->prepare("
        SELECT credit_limit, current_balance, is_blocked FROM clients 
        WHERE id = ? AND tenant_id = ?
    ");
    $stmt->execute([$client_id, $tenant_id]);
    $client = $stmt->fetch();

    if ($client && $client['current_balance'] > $client['credit_limit']) {
        // Bloquer le compte
        $stmt = $pdo->prepare("
            UPDATE clients SET is_blocked = 1, blocked_reason = 'Dépassement limite de crédit'
            WHERE id = ? AND tenant_id = ?
        ");
        $stmt->execute([$client_id, $tenant_id]);

        // Notifier l'administrateur
        // TODO: Implémenter système de notifications
    }
}

/**
 * Débloque un client s'il est éligible
 */
function unlockClientIfEligible($client_id, $tenant_id) {
    global $pdo;

    $stmt = $pdo->prepare("
        SELECT credit_limit, current_balance FROM clients 
        WHERE id = ? AND tenant_id = ?
    ");
    $stmt->execute([$client_id, $tenant_id]);
    $client = $stmt->fetch();

    if ($client && $client['current_balance'] <= $client['credit_limit']) {
        $stmt = $pdo->prepare("
            UPDATE clients SET is_blocked = 0, blocked_reason = NULL
            WHERE id = ? AND tenant_id = ?
        ");
        $stmt->execute([$client_id, $tenant_id]);
    }
}

/**
 * Met à jour les métriques d'un fournisseur
 */
function updateSupplierMetrics($supplier_id, $tenant_id) {
    global $pdo;

    // Calculer le nombre de commandes et le montant total acheté
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as order_count, COALESCE(SUM(total_ttc), 0) as total_spent
        FROM purchase_orders
        WHERE supplier_id = ? AND tenant_id = ?
    ");
    $stmt->execute([$supplier_id, $tenant_id]);
    $metrics = $stmt->fetch();

    // Insérer/mettre à jour les métriques du fournisseur
    // TODO: Créer une table supplier_metrics si nécessaire
}

/**
 * Génère un rapport des écarts d'inventaire
 */
function generateInventoryVarianceReport($inventory_id, $tenant_id) {
    global $pdo;

    $stmt = $pdo->prepare("
        SELECT 
            p.name,
            ii.expected_quantity,
            ii.counted_quantity,
            ii.variance,
            ii.variance_reason
        FROM inventory_items ii
        JOIN products p ON ii.product_id = p.id
        WHERE ii.inventory_id = ? AND ii.variance != 0
        ORDER BY ABS(ii.variance) DESC
    ");
    $stmt->execute([$inventory_id]);
    $variances = $stmt->fetchAll();

    // Stocker le rapport (peut être enregistré dans un fichier ou une table)
    if (!empty($variances)) {
        $report = [
            'inventory_id' => $inventory_id,
            'generated_at' => date('Y-m-d H:i:s'),
            'variances' => $variances
        ];
        // TODO: Enregistrer le rapport
    }
}

/**
 * Synchronise une vente depuis le POS vers tous les modules
 */
function syncSaleToModules($sale_id, $tenant_id) {
    global $pdo;

    // Récupérer la vente (suppose l'existence d'une table sales)
    // Effectuer les synchronisations nécessaires
}

/**
 * Synchronise une commande d'achat
 */
function syncPurchaseOrderToModules($po_id, $tenant_id) {
    // À implémenter
}

/**
 * Synchronise un paiement fournisseur
 */
function syncSupplierPaymentToModules($payment_id, $tenant_id) {
    // À implémenter
}

/**
 * Synchronise un mouvement de stock
 */
function syncStockMovementToModules($movement_id, $tenant_id) {
    // À implémenter
}

/**
 * Synchronise une entrée comptable
 */
function syncAccountingEntryToModules($entry_id, $tenant_id) {
    // À implémenter
}

// ====================== POINT D'ENTREE API ======================

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];

    if ($action === 'sync_all') {
        // Lancer la synchronisation globale
        $result = syncAllModules();
        echo json_encode($result);
    } elseif ($action === 'get_sync_status') {
        // Récupérer le statut des opérations de synchronisation
        $stmt = $pdo->prepare("
            SELECT status, COUNT(*) as count FROM sync_logs 
            WHERE tenant_id = ?
            GROUP BY status
        ");
        $stmt->execute([$_SESSION['tenant_id'] ?? 0]);
        $status = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $status]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Action inconnue']);
    }
}
?>
