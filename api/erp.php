<?php
/**
 * Kiam ERP – Core API & Automation Integrations
 * Synchronized with Sales, Credit, Inventory Audits, Purchases & OHADA Accounting
 */
require_once 'config.php';
require_once 'functions.php';

$data = getRequestData();
$action = $_GET['action'] ?? '';
$tenant_id = $_GET['clinicId'] ?? ($data['clinicId'] ?? null);

if (!$tenant_id) {
    sendResponse(["status" => "error", "message" => "Tenant ID requis"], 400);
}

// Helper to record OHADA journal entry
function postOhadaEntry($pdo, $tenant_id, $date, $journal, $ref, $label, $lines) {
    $entryId = 'ENT-' . strtoupper(substr(md5(uniqid()), 0, 8));
    $stmt = $pdo->prepare("INSERT INTO ohada_journal_entries (id, clinic_id, entry_date, journal_code, reference, label) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$entryId, $tenant_id, $date, $journal, $ref, $label]);

    $stmtLine = $pdo->prepare("INSERT INTO ohada_journal_lines (entry_id, account_code, debit, credit, partner_id) VALUES (?, ?, ?, ?, ?)");
    foreach ($lines as $line) {
        $stmtLine->execute([$entryId, $line['account'], $line['debit'] ?? 0, $line['credit'] ?? 0, $line['partner'] ?? null]);
    }
    return $entryId;
}

if ($action === 'stats') {
    $inv = ['total_items' => 0, 'total_stock' => 0];
    $low = ['low_stock' => 0];
    $out = ['out_of_stock' => 0];
    $today_sales = ['revenue' => 0];
    $today_expenses = ['total_expenses' => 0];
    $distribution = [];

    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) as total_items, SUM(stock) as total_stock FROM inventory_items WHERE clinic_id = ?");
        $stmt->execute([$tenant_id]);
        $inv = $stmt->fetch() ?: $inv;

        $stmt = $pdo->prepare("SELECT COUNT(*) as low_stock FROM inventory_items WHERE clinic_id = ? AND stock <= threshold AND stock > 0");
        $stmt->execute([$tenant_id]);
        $low = $stmt->fetch() ?: $low;

        $stmt = $pdo->prepare("SELECT COUNT(*) as out_of_stock FROM inventory_items WHERE clinic_id = ? AND stock <= 0");
        $stmt->execute([$tenant_id]);
        $out = $stmt->fetch() ?: $out;

        $stmt = $pdo->prepare("SELECT category, COUNT(*) as count FROM inventory_items WHERE clinic_id = ? GROUP BY category");
        $stmt->execute([$tenant_id]);
        $distribution = $stmt->fetchAll();
    } catch (Exception $e) {}

    try {
        $stmt = $pdo->prepare("SELECT SUM(amount) as revenue FROM transactions WHERE clinic_id = ? AND type = 'income' AND category = 'sale' AND DATE(created_at) = CURDATE()");
        $stmt->execute([$tenant_id]);
        $today_sales = $stmt->fetch() ?: $today_sales;
    } catch (Exception $e) {}

    try {
        $stmt = $pdo->prepare("SELECT SUM(amount) as total_expenses FROM erp_expenses WHERE clinic_id = ? AND DATE(date) = CURDATE()");
        $stmt->execute([$tenant_id]);
        $today_expenses = $stmt->fetch() ?: $today_expenses;
    } catch (Exception $e) {}

    sendResponse([
        "status" => "success",
        "total_items" => $inv['total_items'] ?? 0,
        "total_stock" => $inv['total_stock'] ?? 0,
        "low_stock" => $low['low_stock'] ?? 0,
        "out_of_stock" => $out['out_of_stock'] ?? 0,
        "today_revenue" => $today_sales['revenue'] ?? 0,
        "today_expenses" => $today_expenses['total_expenses'] ?? 0,
        "distribution" => $distribution
    ]);

} elseif ($action === 'pos_sale') {
    $items = $data['items'] ?? []; 
    $total = $data['total'] ?? 0;
    $payment_method = $data['payment_method'] ?? 'cash'; // cash, credit, bank, mobile
    $customer_id = $data['customer_id'] ?? null;
    $discount = $data['discount'] ?? 0;

    if (empty($items)) {
        sendResponse(["status" => "error", "message" => "Panier vide"], 400);
    }

    try {
        $pdo->beginTransaction();

        // 1. Verify Credit Limits if selling to account
        if ($payment_method === 'credit') {
            if (!$customer_id) {
                throw new Exception("Un client doit être sélectionné pour une vente à crédit.");
            }
            $stmt = $pdo->prepare("SELECT credit_limit, debt_balance, name FROM erp_customers WHERE id = ? AND clinic_id = ?");
            $stmt->execute([$customer_id, $tenant_id]);
            $cust = $stmt->fetch();
            if (!$cust) {
                throw new Exception("Client introuvable.");
            }
            $new_debt = (float)$cust['debt_balance'] + $total;
            if ((float)$cust['credit_limit'] > 0 && $new_debt > (float)$cust['credit_limit']) {
                throw new Exception("Limite de crédit dépassée pour " . $cust['name'] . ". Limite: " . $cust['credit_limit'] . " CFA, Nouveau solde estimé: " . $new_debt . " CFA.");
            }
        }

        // 2. Create Transaction record
        $stmt = $pdo->prepare("INSERT INTO transactions (clinic_id, customer_id, amount, type, category, description, payment_method) VALUES (?, ?, ?, 'income', 'sale', 'Vente POS', ?)");
        $stmt->execute([$tenant_id, $customer_id, $total, $payment_method]);
        $transaction_id = $pdo->lastInsertId();

        // 3. Adjust Stock based on base unit or fraction conversion
        foreach ($items as $item) {
            $factor = isset($item['conversion_factor']) ? (float)$item['conversion_factor'] : 1.0;
            $qty_deducted = (float)$item['quantity'] * $factor;
            $stmt = $pdo->prepare("UPDATE inventory_items SET stock = stock - ? WHERE id = ? AND clinic_id = ?");
            $stmt->execute([$qty_deducted, $item['id'], $tenant_id]);

            // Stock movement
            $pdo->prepare("INSERT INTO stock_movements (clinic_id, product_name, inventory_item_id, movement_type, quantity, reason, reference_id, reference_type) VALUES (?, ?, ?, 'out', ?, 'Vente POS', ?, 'sale')")
                ->execute([$tenant_id, $item['name'], $item['id'], $qty_deducted, $transaction_id]);
        }

        // 4. Update Client Debt
        if ($customer_id && $payment_method === 'credit') {
            $stmt = $pdo->prepare("UPDATE erp_customers SET debt_balance = debt_balance + ? WHERE id = ? AND clinic_id = ?");
            $stmt->execute([$total, $customer_id, $tenant_id]);
        }

        // 5. Update loyalty points
        if ($customer_id) {
            $points = floor($total / 1000);
            $stmt = $pdo->prepare("UPDATE erp_customers SET loyalty_points = loyalty_points + ? WHERE id = ? AND clinic_id = ?");
            $stmt->execute([$points, $customer_id, $tenant_id]);
        }

        // 6. AUTOMATED OHADA BOOKKEEPING ENTRY
        $journal = 'VE';
        $ref = 'POS-' . $transaction_id;
        $label = 'Vente POS ' . ($payment_method === 'credit' ? 'à crédit' : 'au comptant');
        
        $lines = [];
        if ($payment_method === 'credit') {
            // Debit Client Account (411100)
            $lines[] = ['account' => '411100', 'debit' => $total, 'credit' => 0, 'partner' => $customer_id];
        } else {
            // Debit Cash or Bank (571000 / 521000)
            $account = ($payment_method === 'bank') ? '521000' : '571000';
            $lines[] = ['account' => $account, 'debit' => $total, 'credit' => 0];
        }
        // Credit Ventes (701100)
        $lines[] = ['account' => '701100', 'debit' => 0, 'credit' => $total];

        postOhadaEntry($pdo, $tenant_id, date('Y-m-d'), $journal, $ref, $label, $lines);

        $pdo->commit();
        sendResponse(["status" => "success", "message" => "Vente réussie", "transaction_id" => $transaction_id]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => "Erreur transaction: " . $e->getMessage()], 500);
    }

} elseif ($action === 'list_sales' || $action === 'list_transactions') {
    try {
        $stmt = $pdo->prepare("SELECT t.*, c.name as customer_name FROM transactions t LEFT JOIN erp_customers c ON t.customer_id = c.id WHERE t.clinic_id = ? ORDER BY t.created_at DESC LIMIT 100");
        $stmt->execute([$tenant_id]);
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendResponse([]);
    }

} elseif ($action === 'list_customers') {
    $stmt = $pdo->prepare("SELECT * FROM erp_customers WHERE clinic_id = ? ORDER BY name ASC");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'add_customer') {
    $id = "CUST-" . time();
    $stmt = $pdo->prepare("INSERT INTO erp_customers (id, clinic_id, name, phone, email, credit_limit, debt_balance) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $tenant_id, $data['name'], $data['phone'] ?? null, $data['email'] ?? null, $data['credit_limit'] ?? 0, $data['debt_balance'] ?? 0]);
    sendResponse(["status" => "success", "id" => $id]);

} elseif ($action === 'list_suppliers') {
    $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE clinic_id = ? ORDER BY name ASC");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'add_supplier') {
    $id = "SUPP-" . time();
    $stmt = $pdo->prepare("INSERT INTO suppliers (id, clinic_id, name, contact_name, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $tenant_id, $data['name'], $data['contact_name'] ?? null, $data['phone'] ?? null, $data['email'] ?? null, $data['address'] ?? null]);
    sendResponse(["status" => "success", "id" => $id]);

} elseif ($action === 'list_expenses') {
    $stmt = $pdo->prepare("SELECT * FROM erp_expenses WHERE clinic_id = ? ORDER BY date DESC LIMIT 100");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'add_expense') {
    $id = "EXP-" . time();
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO erp_expenses (id, clinic_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $tenant_id, $data['amount'], $data['category'], $data['description'] ?? null, $data['date'] ?? date('Y-m-d')]);

        // Automated OHADA booking entry for expenses
        $lines = [
            ['account' => '605000', 'debit' => $data['amount'], 'credit' => 0], // Expense
            ['account' => '571000', 'debit' => 0, 'credit' => $data['amount']]  // Cash
        ];
        postOhadaEntry($pdo, $tenant_id, $data['date'] ?? date('Y-m-d'), 'OD', $id, 'Frais généraux: ' . $data['category'], $lines);

        $pdo->commit();
        sendResponse(["status" => "success", "id" => $id]);
    } catch(Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
    }

// ════════════════════════════════════════════════════════════════════════════
// PHYSICAL STOCK AUDIT ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════
} elseif ($action === 'physical_inventories_list') {
    $stmt = $pdo->prepare("SELECT * FROM erp_physical_inventories WHERE clinic_id = ? ORDER BY created_at DESC");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'physical_inventories_get') {
    $id = $_GET['id'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM erp_physical_inventories WHERE id = ? AND clinic_id = ?");
    $stmt->execute([$id, $tenant_id]);
    $inv = $stmt->fetch();
    if ($inv) {
        $stmt2 = $pdo->prepare("SELECT pii.*, i.name as product_name, i.sku, i.unit FROM erp_physical_inventory_items pii JOIN inventory_items i ON pii.product_id = i.id WHERE pii.inventory_id = ?");
        $stmt2->execute([$id]);
        $inv['items'] = $stmt2->fetchAll();
    }
    sendResponse($inv);

} elseif ($action === 'physical_inventories_create') {
    $id = 'INV-' . time();
    $number = 'INV-PHYS-' . date('Ymd-His');
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO erp_physical_inventories (id, clinic_id, inventory_number, notes, created_by) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$id, $tenant_id, $number, $data['notes'] ?? '', $data['created_by'] ?? 'Admin']);

        $stmtItem = $pdo->prepare("INSERT INTO erp_physical_inventory_items (inventory_id, product_id, qty_theoretical, qty_real, qty_discrepancy, reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($data['items'] ?? [] as $item) {
            $theoretical = (float)$item['qty_theoretical'];
            $real = (float)$item['qty_real'];
            $discrepancy = $real - $theoretical;
            $stmtItem->execute([
                $id, $item['product_id'], $theoretical, $real, $discrepancy, $item['reason'] ?? 'error', $item['notes'] ?? ''
            ]);
        }

        $pdo->commit();
        sendResponse(["status" => "success", "id" => $id, "number" => $number]);
    } catch(Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
    }

} elseif ($action === 'physical_inventories_validate') {
    $id = $data['id'] ?? '';
    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT * FROM erp_physical_inventories WHERE id = ? AND clinic_id = ? AND status = 'draft'");
        $stmt->execute([$id, $tenant_id]);
        $inv = $stmt->fetch();
        if (!$inv) {
            throw new Exception("Inventaire physique introuvable ou déjà validé.");
        }

        $stmtItems = $pdo->prepare("SELECT * FROM erp_physical_inventory_items WHERE inventory_id = ?");
        $stmtItems->execute([$id]);
        $items = $stmtItems->fetchAll();

        $totalLossValue = 0;

        foreach ($items as $item) {
            // Apply real physical quantity adjustment to base stock
            $stmtUp = $pdo->prepare("UPDATE inventory_items SET stock = ? WHERE id = ? AND clinic_id = ?");
            $stmtUp->execute([$item['qty_real'], $item['product_id'], $tenant_id]);

            // Save in stock movements
            if ($item['qty_discrepancy'] != 0) {
                $mtype = $item['qty_discrepancy'] > 0 ? 'in' : 'out';
                $pdo->prepare("INSERT INTO stock_movements (clinic_id, product_name, inventory_item_id, movement_type, quantity, reason, reference_id, reference_type) VALUES (?, (SELECT name FROM inventory_items WHERE id = ?), ?, ?, ?, ?, ?, 'inventory_physical')")
                    ->execute([$tenant_id, $item['product_id'], $item['product_id'], $mtype, abs($item['qty_discrepancy']), 'Écart d\'inventaire: ' . $item['reason'], $id]);

                // Track total value of discrepancies if negative
                if ($item['qty_discrepancy'] < 0) {
                    $pPrice = $pdo->query("SELECT price_buy FROM inventory_items WHERE id = '{$item['product_id']}'")->fetchColumn();
                    $totalLossValue += abs($item['qty_discrepancy']) * (float)$pPrice;
                }
            }
        }

        // Validate state
        $pdo->prepare("UPDATE erp_physical_inventories SET status = 'validated', validated_at = NOW() WHERE id = ?")->execute([$id]);

        // Automated OHADA loss accounting posting
        if ($totalLossValue > 0) {
            $lines = [
                ['account' => '658000', 'debit' => $totalLossValue, 'credit' => 0], // Charge (Pertes)
                ['account' => '311000', 'debit' => 0, 'credit' => $totalLossValue]  // Stock de marchandises
            ];
            postOhadaEntry($pdo, $tenant_id, date('Y-m-d'), 'OD', $id, 'Régularisation écarts inventaire physique ' . $inv['inventory_number'], $lines);
        }

        $pdo->commit();
        sendResponse(["status" => "success", "message" => "Inventaire validé et stock ajusté."]);
    } catch(Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
    }

// ════════════════════════════════════════════════════════════════════════════
// OHADA ACCOUNTING REPORTING & LEDGER ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════
} elseif ($action === 'ohada_accounts_list') {
    $stmt = $pdo->prepare("SELECT * FROM ohada_accounts WHERE clinic_id = ? OR clinic_id = 'system' ORDER BY account_code ASC");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'ohada_journal_entries') {
    $stmt = $pdo->prepare("
        SELECT je.*, SUM(jl.debit) as total_debit 
        FROM ohada_journal_entries je 
        LEFT JOIN ohada_journal_lines jl ON je.id = jl.entry_id 
        WHERE je.clinic_id = ? 
        GROUP BY je.id 
        ORDER BY je.entry_date DESC, je.created_at DESC
    ");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'ohada_entry_details') {
    $id = $_GET['id'] ?? '';
    $stmt = $pdo->prepare("SELECT je.* FROM ohada_journal_entries je WHERE je.id = ? AND je.clinic_id = ?");
    $stmt->execute([$id, $tenant_id]);
    $entry = $stmt->fetch();
    if ($entry) {
        $stmt2 = $pdo->prepare("SELECT jl.*, a.label as account_label FROM ohada_journal_lines jl JOIN ohada_accounts a ON jl.account_code = a.account_code WHERE jl.entry_id = ?");
        $stmt2->execute([$id]);
        $entry['lines'] = $stmt2->fetchAll();
    }
    sendResponse($entry);

} elseif ($action === 'ohada_general_ledger') {
    // Grand Livre
    $stmt = $pdo->prepare("
        SELECT jl.*, je.entry_date, je.journal_code, je.label as entry_label, je.reference, a.label as account_label
        FROM ohada_journal_lines jl
        JOIN ohada_journal_entries je ON jl.entry_id = je.id
        JOIN ohada_accounts a ON jl.account_code = a.account_code
        WHERE je.clinic_id = ?
        ORDER BY jl.account_code ASC, je.entry_date ASC
    ");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'ohada_trial_balance') {
    // Balance Générale
    $stmt = $pdo->prepare("
        SELECT 
            a.account_code, 
            a.label, 
            a.account_type,
            COALESCE(SUM(jl.debit), 0) as total_debit,
            COALESCE(SUM(jl.credit), 0) as total_credit
        FROM ohada_accounts a
        LEFT JOIN ohada_journal_lines jl ON a.account_code = jl.account_code
        LEFT JOIN ohada_journal_entries je ON jl.entry_id = je.id AND je.clinic_id = ?
        WHERE a.clinic_id = ? OR a.clinic_id = 'system'
        GROUP BY a.account_code, a.label, a.account_type
        ORDER BY a.account_code ASC
    ");
    $stmt->execute([$tenant_id, $tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'ohada_financial_reports') {
    // Income Statement & Balance Sheet computations
    $stmt = $pdo->prepare("
        SELECT 
            a.account_code, 
            a.account_type,
            COALESCE(SUM(jl.debit), 0) as debit,
            COALESCE(SUM(jl.credit), 0) as credit
        FROM ohada_accounts a
        LEFT JOIN ohada_journal_lines jl ON a.account_code = jl.account_code
        LEFT JOIN ohada_journal_entries je ON jl.entry_id = je.id AND je.clinic_id = ?
        WHERE a.clinic_id = ? OR a.clinic_id = 'system'
        GROUP BY a.account_code, a.account_type
    ");
    $stmt->execute([$tenant_id, $tenant_id]);
    $balances = $stmt->fetchAll();

    $reports = [
        'assets' => [], // Class 2, 3, 5 (Debits - Credits)
        'liabilities_equity' => [], // Class 1, 4 (Credits - Debits)
        'expenses' => [], // Class 6 (Debits)
        'income' => [], // Class 7 (Credits)
        'net_income' => 0
    ];

    $totalIncome = 0;
    $totalExpenses = 0;

    foreach ($balances as $b) {
        $code = $b['account_code'];
        $type = $b['account_type'];
        $netDebit = (float)$b['debit'] - (float)$b['credit'];
        $netCredit = (float)$b['credit'] - (float)$b['debit'];

        if (strpos($code, '6') === 0) {
            $totalExpenses += $netDebit;
        } elseif (strpos($code, '7') === 0) {
            $totalIncome += $netCredit;
        }
    }

    $reports['net_income'] = $totalIncome - $totalExpenses;

    sendResponse([
        "status" => "success",
        "total_income" => $totalIncome,
        "total_expenses" => $totalExpenses,
        "net_income" => $reports['net_income']
    ]);

// ════════════════════════════════════════════════════════════════════════════
// COMMERCIAL DOCUMENTATION FLOW
// ════════════════════════════════════════════════════════════════════════════
} elseif ($action === 'quotes_list') {
    $stmt = $pdo->prepare("SELECT * FROM erp_quotes WHERE clinic_id = ? ORDER BY created_at DESC");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'quotes_create') {
    $id = 'QTE-' . time();
    $number = 'DEV-' . date('Ymd') . '-' . rand(100, 999);
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO erp_quotes (id, clinic_id, quote_number, customer_id, customer_name, total_ht, tax_rate, total_ttc, valid_until, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id, $tenant_id, $number, $data['customer_id'] ?? null, $data['customer_name'] ?? 'Client Passager',
            $data['total_ht'] ?? 0, $data['tax_rate'] ?? 18, $data['total_ttc'] ?? 0, $data['valid_until'] ?? null, $data['notes'] ?? ''
        ]);

        $stmtItem = $pdo->prepare("INSERT INTO erp_quote_items (quote_id, product_name, quantity, unit, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($data['items'] ?? [] as $item) {
            $stmtItem->execute([$id, $item['product_name'], $item['quantity'], $item['unit'] ?? 'unité', $item['unit_price'], $item['total_price']]);
        }

        $pdo->commit();
        sendResponse(["status" => "success", "id" => $id, "number" => $number]);
    } catch(Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
    }

} elseif ($action === 'quotes_update_status') {
    $id = $data['id'] ?? '';
    $status = $data['status'] ?? 'sent';
    $stmt = $pdo->prepare("UPDATE erp_quotes SET status = ? WHERE id = ? AND clinic_id = ?");
    $stmt->execute([$status, $id, $tenant_id]);
    sendResponse(["status" => "success"]);

} elseif ($action === 'delivery_slips_list') {
    $stmt = $pdo->prepare("SELECT * FROM erp_delivery_slips WHERE clinic_id = ? ORDER BY created_at DESC");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'delivery_slips_create') {
    $id = 'DEL-' . time();
    $number = 'BL-' . date('Ymd') . '-' . rand(100, 999);
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO erp_delivery_slips (id, clinic_id, slip_number, order_id, customer_id, customer_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $tenant_id, $number, $data['order_id'] ?? null, $data['customer_id'] ?? null, $data['customer_name'] ?? 'Client Passager', $data['notes'] ?? '']);

        $stmtItem = $pdo->prepare("INSERT INTO erp_delivery_slip_items (slip_id, product_name, qty_ordered, qty_shipped) VALUES (?, ?, ?, ?)");
        foreach ($data['items'] ?? [] as $item) {
            $stmtItem->execute([$id, $item['product_name'], $item['qty_ordered'], $item['qty_shipped']]);
        }

        $pdo->commit();
        sendResponse(["status" => "success", "id" => $id, "number" => $number]);
    } catch(Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
    }

} elseif ($action === 'delivery_slips_update_status') {
    $id = $data['id'] ?? '';
    $status = $data['status'] ?? 'preparation';
    $sql = "UPDATE erp_delivery_slips SET status = ?";
    if ($status === 'shipped') $sql .= ", shipped_at = NOW()";
    elseif ($status === 'delivered') $sql .= ", delivered_at = NOW()";
    $sql .= " WHERE id = ? AND clinic_id = ?";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$status, $id, $tenant_id]);
    sendResponse(["status" => "success"]);

// ════════════════════════════════════════════════════════════════════════════
// FRACTIONAL UNITS CONFIG
// ════════════════════════════════════════════════════════════════════════════
} elseif ($action === 'add_unit_conversion') {
    $stmt = $pdo->prepare("INSERT INTO erp_product_units (clinic_id, product_id, unit_name, conversion_factor, price_sell) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$tenant_id, $data['product_id'], $data['unit_name'], $data['conversion_factor'], $data['price_sell'] ?? null]);
    sendResponse(["status" => "success"]);

} elseif ($action === 'list_product_units') {
    $prod_id = $_GET['product_id'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM erp_product_units WHERE clinic_id = ? AND product_id = ?");
    $stmt->execute([$tenant_id, $prod_id]);
    sendResponse($stmt->fetchAll());

} else {
    sendResponse(["status" => "error", "message" => "Action '$action' non reconnue"], 404);
}
?>
