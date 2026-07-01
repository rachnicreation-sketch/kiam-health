<?php
/**
 * Kiam Pharmacy – Unified Advanced Backend API
 */
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$clinicId = $auth['tenant_id'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Helper to post an OHADA Journal Entry
function postOhadaEntry($pdo, $clinicId, $date, $journal, $ref, $label, $lines) {
    $entryId = "JE-" . time() . rand(10, 99);
    $stmt = $pdo->prepare("INSERT INTO ohada_journal_entries (id, clinic_id, entry_date, journal_code, reference, label) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$entryId, $clinicId, $date, $journal, $ref, $label]);

    $stmtLine = $pdo->prepare("INSERT INTO ohada_journal_lines (entry_id, account_code, debit, credit, partner_id) VALUES (?, ?, ?, ?, ?)");
    foreach ($lines as $line) {
        $stmtLine->execute([
            $entryId,
            $line['account_code'],
            $line['debit'] ?? 0,
            $line['credit'] ?? 0,
            $line['partner_id'] ?? null
        ]);
    }
    return $entryId;
}

if ($method === 'GET') {
    switch ($action) {
        case 'list_medications':
            // Fetch medications with stock counts and categories
            $stmt = $pdo->prepare("SELECT * FROM medications WHERE clinic_id = ? ORDER BY name ASC");
            $stmt->execute([$clinicId]);
            $meds = $stmt->fetchAll();
            
            // Add remaining batches stock
            foreach ($meds as &$m) {
                $stmtBatch = $pdo->prepare("SELECT SUM(remaining_qty) FROM medication_batches WHERE medication_id = ?");
                $stmtBatch->execute([$m['id']]);
                $batchStock = $stmtBatch->fetchColumn();
                $m['batch_stock'] = $batchStock !== null ? (int)$batchStock : (int)$m['stock'];
            }
            sendResponse($meds);
            break;

        case 'list_batches':
            $medId = $_GET['medication_id'] ?? '';
            if ($medId) {
                $stmt = $pdo->prepare("SELECT * FROM medication_batches WHERE clinic_id = ? AND medication_id = ? ORDER BY expiry_date ASC");
                $stmt->execute([$clinicId, $medId]);
            } else {
                $stmt = $pdo->prepare("SELECT b.*, m.name as medication_name FROM medication_batches b JOIN medications m ON b.medication_id = m.id WHERE b.clinic_id = ? ORDER BY b.expiry_date ASC");
                $stmt->execute([$clinicId]);
            }
            sendResponse($stmt->fetchAll());
            break;

        case 'list_customers':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_customers WHERE clinic_id = ? ORDER BY name ASC");
            $stmt->execute([$clinicId]);
            sendResponse($stmt->fetchAll());
            break;

        case 'list_prescriptions':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_prescriptions WHERE clinic_id = ? ORDER BY created_at DESC");
            $stmt->execute([$clinicId]);
            sendResponse($stmt->fetchAll());
            break;

        case 'caisse_status':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_cash_sessions WHERE clinic_id = ? AND status = 'open' LIMIT 1");
            $stmt->execute([$clinicId]);
            $session = $stmt->fetch();
            
            if ($session) {
                // Fetch recent logs
                $stmtTrans = $pdo->prepare("SELECT * FROM pharmacy_cash_transactions WHERE session_id = ? ORDER BY created_at DESC");
                $stmtTrans->execute([$session['id']]);
                $session['transactions'] = $stmtTrans->fetchAll();
                sendResponse(["isOpen" => true, "session" => $session]);
            } else {
                sendResponse(["isOpen" => false]);
            }
            break;

        case 'list_closed_sessions':
            $stmt = $pdo->prepare("SELECT s.*, u.name as user_name FROM pharmacy_cash_sessions s LEFT JOIN users u ON s.user_id = u.id WHERE s.clinic_id = ? AND s.status = 'closed' ORDER BY s.closed_at DESC");
            $stmt->execute([$clinicId]);
            $sessions = $stmt->fetchAll();
            sendResponse($sessions);
            break;

        case 'list_credits':
            $stmt = $pdo->prepare("SELECT c.*, cust.name as customer_name, cust.type as customer_type 
                                   FROM pharmacy_credit_contracts c
                                   JOIN pharmacy_customers cust ON c.customer_id = cust.id
                                   WHERE c.clinic_id = ? 
                                   ORDER BY c.due_date ASC");
            $stmt->execute([$clinicId]);
            $credits = $stmt->fetchAll();
            
            foreach ($credits as &$c) {
                $stmtPay = $pdo->prepare("SELECT * FROM pharmacy_credit_payments WHERE contract_id = ? ORDER BY created_at DESC");
                $stmtPay->execute([$c['id']]);
                $c['payments'] = $stmtPay->fetchAll();
            }
            sendResponse($credits);
            break;

        case 'list_docs':
            $type = $_GET['type'] ?? '';
            if ($type) {
                $stmt = $pdo->prepare("SELECT d.*, c.name as customer_name FROM pharmacy_commercial_docs d LEFT JOIN pharmacy_customers c ON d.customer_id = c.id WHERE d.clinic_id = ? AND d.type = ? ORDER BY d.created_at DESC");
                $stmt->execute([$clinicId, $type]);
            } else {
                $stmt = $pdo->prepare("SELECT d.*, c.name as customer_name FROM pharmacy_commercial_docs d LEFT JOIN pharmacy_customers c ON d.customer_id = c.id WHERE d.clinic_id = ? ORDER BY d.created_at DESC");
                $stmt->execute([$clinicId]);
            }
            $docs = $stmt->fetchAll();
            foreach ($docs as &$doc) {
                $stmtItems = $pdo->prepare("SELECT i.*, m.name as medication_name FROM pharmacy_commercial_doc_items i JOIN medications m ON i.medication_id = m.id WHERE i.doc_id = ?");
                $stmtItems->execute([$doc['id']]);
                $doc['items'] = $stmtItems->fetchAll();
            }
            sendResponse($docs);
            break;

        case 'list_internal_requests':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_internal_requests WHERE clinic_id = ? ORDER BY created_at DESC");
            $stmt->execute([$clinicId]);
            $requests = $stmt->fetchAll();
            foreach ($requests as &$req) {
                $stmtItems = $pdo->prepare("SELECT i.*, m.name as medication_name FROM pharmacy_internal_request_items i JOIN medications m ON i.medication_id = m.id WHERE i.request_id = ?");
                $stmtItems->execute([$req['id']]);
                $req['items'] = $stmtItems->fetchAll();
            }
            sendResponse($requests);
            break;

        case 'list_administrations':
            $stmt = $pdo->prepare("SELECT a.*, p.name as patient_name, p.first_name as patient_first_name, m.name as medication_name 
                                   FROM pharmacy_patient_administrations a
                                   JOIN patients p ON a.patient_id = p.id
                                   JOIN medications m ON a.medication_id = m.id
                                   WHERE a.clinic_id = ? ORDER BY a.administered_at DESC");
            $stmt->execute([$clinicId]);
            sendResponse($stmt->fetchAll());
            break;

        case 'get_medication_by_barcode':
            $barcode = $_GET['barcode'] ?? '';
            if (!$barcode) {
                sendResponse(["error" => "Barcode missing"], 400);
                break;
            }
            $stmt = $pdo->prepare("SELECT * FROM medications WHERE clinic_id = ? AND barcode = ?");
            $stmt->execute([$clinicId, $barcode]);
            $med = $stmt->fetch();
            sendResponse($med);
            break;
        case 'stats':
            // High level indicators for dashboard
            // High level indicators for dashboard
            $totalMeds = $pdo->prepare("SELECT COUNT(*) FROM medications WHERE clinic_id = ?");
            $totalMeds->execute([$clinicId]);
            
            $lowStock = $pdo->prepare("SELECT COUNT(*) FROM medications WHERE clinic_id = ? AND stock <= threshold");
            $lowStock->execute([$clinicId]);
            
            $expired = $pdo->prepare("SELECT COUNT(*) FROM medication_batches WHERE clinic_id = ? AND expiry_date < CURDATE() AND remaining_qty > 0");
            $expired->execute([$clinicId]);

            $salesToday = $pdo->prepare("SELECT COALESCE(SUM(total_ttc), 0) FROM pharmacy_commercial_docs WHERE clinic_id = ? AND type = 'invoice' AND DATE(created_at) = CURDATE()");
            $salesToday->execute([$clinicId]);

            $marginToday = $pdo->prepare("SELECT COALESCE(SUM(i.total_price - (i.quantity * COALESCE(m.price_buy, 0))), 0) 
                                          FROM pharmacy_commercial_doc_items i 
                                          JOIN pharmacy_commercial_docs d ON i.doc_id = d.id 
                                          JOIN medications m ON i.medication_id = m.id
                                          WHERE d.clinic_id = ? AND d.type = 'invoice' AND DATE(d.created_at) = CURDATE()");
            $marginToday->execute([$clinicId]);

            $debts = $pdo->prepare("SELECT COALESCE(SUM(debt_balance), 0) FROM pharmacy_customers WHERE clinic_id = ?");
            $debts->execute([$clinicId]);

            sendResponse([
                "total_items" => $totalMeds->fetchColumn(),
                "low_stock" => $lowStock->fetchColumn(),
                "expired" => $expired->fetchColumn(),
                "sales_today" => $salesToday->fetchColumn(),
                "margin_today" => $marginToday->fetchColumn(),
                "debts" => $debts->fetchColumn()
            ]);
            break;
            
        case 'accounting_reports':
            // Simple ledger/reports summary for sector: pharmacy
            $stmt = $pdo->prepare("SELECT * FROM ohada_journal_entries WHERE clinic_id = ? ORDER BY entry_date DESC");
            $stmt->execute([$clinicId]);
            $entries = $stmt->fetchAll();
            foreach ($entries as &$entry) {
                $stmtLines = $pdo->prepare("SELECT l.*, a.label as account_label FROM ohada_journal_lines l JOIN ohada_accounts a ON l.account_code = a.account_code WHERE l.entry_id = ?");
                $stmtLines->execute([$entry['id']]);
                $entry['lines'] = $stmtLines->fetchAll();
            }
            sendResponse([
                "journal" => $entries
            ]);
            break;

        case 'sales_report':
            $period = $_GET['period'] ?? 'month'; // today | week | month | year
            $dateFilter = match($period) {
                'today'  => "DATE(created_at) = CURDATE()",
                'week'   => "created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
                'month'  => "created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)",
                'year'   => "created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)",
                default  => "created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
            };

            // Daily totals (for chart)
            $stmtDaily = $pdo->prepare("
                SELECT DATE(created_at) as day,
                       COUNT(*) as nb_invoices,
                       COALESCE(SUM(total_ht), 0) as total_ht,
                       COALESCE(SUM(total_ttc), 0) as total_ttc
                FROM pharmacy_commercial_docs
                WHERE clinic_id = ? AND type = 'invoice' AND $dateFilter
                GROUP BY DATE(created_at)
                ORDER BY day ASC
            ");
            $stmtDaily->execute([$clinicId]);
            $daily = $stmtDaily->fetchAll();

            // Top products sold
            $stmtTop = $pdo->prepare("
                SELECT m.name, m.barcode, m.dci, m.category,
                       SUM(i.quantity) as qty_sold,
                       SUM(i.total_price) as revenue
                FROM pharmacy_commercial_doc_items i
                JOIN pharmacy_commercial_docs d ON i.doc_id = d.id
                JOIN medications m ON i.medication_id = m.id
                WHERE d.clinic_id = ? AND d.type = 'invoice' AND $dateFilter
                GROUP BY i.medication_id
                ORDER BY qty_sold DESC
                LIMIT 10
            ");
            $stmtTop->execute([$clinicId]);
            $topProducts = $stmtTop->fetchAll();

            // Payment method breakdown
            $stmtPay = $pdo->prepare("
                SELECT COALESCE(payment_method, 'Cash') as method,
                       COUNT(*) as count,
                       COALESCE(SUM(total_ttc), 0) as total
                FROM pharmacy_commercial_docs
                WHERE clinic_id = ? AND type = 'invoice' AND $dateFilter
                GROUP BY payment_method
            ");
            $stmtPay->execute([$clinicId]);
            $byPayment = $stmtPay->fetchAll();

            // Summary totals
            $stmtSum = $pdo->prepare("
                SELECT COUNT(*) as nb_invoices,
                       COALESCE(SUM(total_ht), 0) as total_ht,
                       COALESCE(SUM(total_ttc), 0) as total_ttc,
                       COALESCE(SUM(CASE WHEN status = 'paid' THEN total_ttc ELSE 0 END), 0) as total_paid,
                       COALESCE(SUM(CASE WHEN status = 'pending' THEN total_ttc ELSE 0 END), 0) as total_credit
                FROM pharmacy_commercial_docs
                WHERE clinic_id = ? AND type = 'invoice' AND $dateFilter
            ");
            $stmtSum->execute([$clinicId]);
            $summary = $stmtSum->fetch();

            // Margin (revenue - purchase cost)
            $stmtMargin = $pdo->prepare("
                SELECT COALESCE(SUM(i.total_price - (i.quantity * COALESCE(m.price_buy, 0))), 0) as margin
                FROM pharmacy_commercial_doc_items i
                JOIN pharmacy_commercial_docs d ON i.doc_id = d.id
                JOIN medications m ON i.medication_id = m.id
                WHERE d.clinic_id = ? AND d.type = 'invoice' AND $dateFilter
            ");
            $stmtMargin->execute([$clinicId]);
            $margin = $stmtMargin->fetchColumn();

            sendResponse([
                'period'       => $period,
                'summary'      => $summary,
                'margin'       => $margin,
                'daily'        => $daily,
                'top_products' => $topProducts,
                'by_payment'   => $byPayment
            ]);
            break;

        case 'list_suppliers':
            // Suppliers = pharmacy customers of type 'company' or tagged as suppliers
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_customers WHERE clinic_id = ? AND (type = 'company' OR type = 'supplier') ORDER BY name ASC");
            $stmt->execute([$clinicId]);
            sendResponse($stmt->fetchAll());
            break;


        case 'get_settings':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_settings WHERE clinic_id = ? LIMIT 1");
            $stmt->execute([$clinicId]);
            $settings = $stmt->fetch();
            if (!$settings) {
                // Return defaults if none saved yet
                $settings = [
                    'clinic_id'        => $clinicId,
                    'pharmacy_name'    => 'Pharmacie',
                    'address'          => '',
                    'phone'            => '',
                    'email'            => '',
                    'rccm'             => '',
                    'contribuable'     => '',
                    'tva_enabled'      => 0,
                    'tva_rate'         => 18.0,
                    'ca_enabled'       => 0,
                    'ca_rate'          => 5.0,
                    'receipt_footer'   => 'Merci de votre visite ! Les médicaments ne sont ni repris ni échangés.',
                    'currency'         => 'CFA'
                ];
            }
            sendResponse($settings);
            break;

        case 'list_roles':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_roles WHERE clinic_id = ? ORDER BY name ASC");
            $stmt->execute([$clinicId]);
            $roles = $stmt->fetchAll();
            foreach ($roles as &$role) {
                $stmtPerm = $pdo->prepare("SELECT permission_key FROM pharmacy_role_permissions WHERE role_id = ?");
                $stmtPerm->execute([$role['id']]);
                $role['permissions'] = $stmtPerm->fetchAll(PDO::FETCH_COLUMN);
            }
            sendResponse($roles);
            break;

        case 'list_registers':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_registers WHERE clinic_id = ? ORDER BY name ASC");
            $stmt->execute([$clinicId]);
            sendResponse($stmt->fetchAll());
            break;

        case 'list_returns':
            $stmt = $pdo->prepare("
                SELECT r.*, c.name as customer_name, s.name as supplier_name 
                FROM pharmacy_returns r 
                LEFT JOIN pharmacy_customers c ON r.customer_id = c.id
                LEFT JOIN suppliers s ON r.supplier_id = s.id
                WHERE r.clinic_id = ? 
                ORDER BY r.created_at DESC
            ");
            $stmt->execute([$clinicId]);
            $returns = $stmt->fetchAll();
            foreach ($returns as &$ret) {
                $stmtIt = $pdo->prepare("SELECT ri.*, m.name as medication_name FROM pharmacy_return_items ri JOIN medications m ON ri.medication_id = m.id WHERE ri.return_id = ?");
                $stmtIt->execute([$ret['id']]);
                $ret['items'] = $stmtIt->fetchAll();
            }
            sendResponse($returns);
            break;

        case 'list_promotions':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_promotions WHERE clinic_id = ? ORDER BY created_at DESC");
            $stmt->execute([$clinicId]);
            sendResponse($stmt->fetchAll());
            break;

        case 'active_promotions':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_promotions WHERE clinic_id = ? AND is_active = 1 AND start_date <= CURDATE() AND end_date >= CURDATE() ORDER BY name ASC");
            $stmt->execute([$clinicId]);
            sendResponse($stmt->fetchAll());
            break;

        case 'loyalty_config':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_loyalty_config WHERE clinic_id = ?");
            $stmt->execute([$clinicId]);
            $config = $stmt->fetch();
            if (!$config) {
                $config = ['clinic_id' => $clinicId, 'points_per_unit' => 1, 'currency_per_point' => 10, 'min_redeem_points' => 100, 'is_active' => 0];
            }
            sendResponse($config);
            break;

        case 'customer_loyalty':
            $custId = $_GET['customer_id'] ?? '';
            if (!$custId) { sendResponse(['error' => 'customer_id requis'], 400); break; }
            $stmt = $pdo->prepare("SELECT loyalty_points, loyalty_tier FROM pharmacy_customers WHERE id = ? AND clinic_id = ?");
            $stmt->execute([$custId, $clinicId]);
            $cust = $stmt->fetch();
            $stmtHist = $pdo->prepare("SELECT * FROM pharmacy_loyalty_transactions WHERE customer_id = ? AND clinic_id = ? ORDER BY created_at DESC LIMIT 50");
            $stmtHist->execute([$custId, $clinicId]);
            sendResponse(['customer' => $cust, 'history' => $stmtHist->fetchAll()]);
            break;

        case 'list_transfers':
            $stmt = $pdo->prepare("SELECT * FROM pharmacy_stock_transfers WHERE clinic_id = ? ORDER BY created_at DESC");
            $stmt->execute([$clinicId]);
            $transfers = $stmt->fetchAll();
            foreach ($transfers as &$tr) {
                $stmtIt = $pdo->prepare("SELECT ti.*, m.name as medication_name FROM pharmacy_stock_transfer_items ti JOIN medications m ON ti.medication_id = m.id WHERE ti.transfer_id = ?");
                $stmtIt->execute([$tr['id']]);
                $tr['items'] = $stmtIt->fetchAll();
            }
            sendResponse($transfers);
            break;
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    switch ($action) {
        case 'save_settings':
            // Check if row exists
            $stmtChk = $pdo->prepare("SELECT COUNT(*) FROM pharmacy_settings WHERE clinic_id = ?");
            $stmtChk->execute([$clinicId]);
            $exists = (int)$stmtChk->fetchColumn();

            if ($exists) {
                $stmt = $pdo->prepare("UPDATE pharmacy_settings SET pharmacy_name=?, address=?, phone=?, email=?, rccm=?, contribuable=?, tva_enabled=?, tva_rate=?, ca_enabled=?, ca_rate=?, receipt_footer=?, currency=? WHERE clinic_id=?");
                $stmt->execute([
                    $data['pharmacy_name'] ?? '', $data['address'] ?? '', $data['phone'] ?? '',
                    $data['email'] ?? '', $data['rccm'] ?? '', $data['contribuable'] ?? '',
                    (int)($data['tva_enabled'] ?? 0), (float)($data['tva_rate'] ?? 18.0),
                    (int)($data['ca_enabled'] ?? 0), (float)($data['ca_rate'] ?? 5.0),
                    $data['receipt_footer'] ?? '', $data['currency'] ?? 'CFA',
                    $clinicId
                ]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO pharmacy_settings (clinic_id, pharmacy_name, address, phone, email, rccm, contribuable, tva_enabled, tva_rate, ca_enabled, ca_rate, receipt_footer, currency) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
                $stmt->execute([
                    $clinicId, $data['pharmacy_name'] ?? '', $data['address'] ?? '', $data['phone'] ?? '',
                    $data['email'] ?? '', $data['rccm'] ?? '', $data['contribuable'] ?? '',
                    (int)($data['tva_enabled'] ?? 0), (float)($data['tva_rate'] ?? 18.0),
                    (int)($data['ca_enabled'] ?? 0), (float)($data['ca_rate'] ?? 5.0),
                    $data['receipt_footer'] ?? '', $data['currency'] ?? 'CFA'
                ]);
            }
            sendResponse(['status' => 'success']);
            break;

        case 'generate_receipt':
            // Fetch the document + items for receipt printing
            $docId = $data['doc_id'] ?? '';
            if (!$docId) {
                sendResponse(['error' => 'doc_id required'], 400);
                break;
            }
            $stmtDoc = $pdo->prepare("SELECT d.*, c.name as customer_name FROM pharmacy_commercial_docs d LEFT JOIN pharmacy_customers c ON d.customer_id = c.id WHERE d.id = ? AND d.clinic_id = ?");
            $stmtDoc->execute([$docId, $clinicId]);
            $doc = $stmtDoc->fetch();
            if (!$doc) {
                sendResponse(['error' => 'Document not found'], 404);
                break;
            }
            $stmtItems = $pdo->prepare("SELECT i.*, m.name as medication_name, m.barcode FROM pharmacy_commercial_doc_items i JOIN medications m ON i.medication_id = m.id WHERE i.doc_id = ?");
            $stmtItems->execute([$docId]);
            $doc['items'] = $stmtItems->fetchAll();

            // Also get pharmacy settings for header
            $stmtSet = $pdo->prepare("SELECT * FROM pharmacy_settings WHERE clinic_id = ? LIMIT 1");
            $stmtSet->execute([$clinicId]);
            $settings = $stmtSet->fetch() ?: ['pharmacy_name' => 'Pharmacie', 'address' => '', 'phone' => '', 'receipt_footer' => 'Merci de votre visite !', 'currency' => 'CFA'];

            sendResponse(['doc' => $doc, 'settings' => $settings]);
            break;

        case 'expiring_batches':
            $stmt = $pdo->prepare("SELECT b.*, m.name as medication_name FROM medication_batches b JOIN medications m ON b.medication_id = m.id WHERE b.clinic_id = ? AND b.remaining_qty > 0 AND b.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY) ORDER BY b.expiry_date ASC");
            $stmt->execute([$clinicId]);
            sendResponse($stmt->fetchAll());
            break;

        case 'low_stock_meds':
            $stmt = $pdo->prepare("SELECT * FROM medications WHERE clinic_id = ? AND stock <= threshold ORDER BY name ASC");
            $stmt->execute([$clinicId]);
            sendResponse($stmt->fetchAll());
            break;

        case 'list_physical_inventories':
            $stmt = $pdo->prepare("SELECT i.*, u.name as user_name FROM pharmacy_physical_inventories i LEFT JOIN users u ON i.user_id = u.id WHERE i.clinic_id = ? ORDER BY i.created_at DESC");
            $stmt->execute([$clinicId]);
            $invs = $stmt->fetchAll();
            foreach ($invs as &$inv) {
                $stmtIt = $pdo->prepare("SELECT item.*, m.name as medication_name FROM pharmacy_physical_inventory_items item JOIN medications m ON item.medication_id = m.id WHERE item.inventory_id = ?");
                $stmtIt->execute([$inv['id']]);
                $inv['items'] = $stmtIt->fetchAll();
            }
            sendResponse($invs);
            break;

        case 'start_physical_inventory':
            $id = "INV-" . date("YmdHis");
            $stmt = $pdo->prepare("INSERT INTO pharmacy_physical_inventories (id, clinic_id, user_id, status) VALUES (?, ?, ?, 'draft')");
            $stmt->execute([$id, $clinicId, $auth['id']]);
            
            // Populate items with current stock
            $stmtMeds = $pdo->prepare("SELECT id, stock FROM medications WHERE clinic_id = ?");
            $stmtMeds->execute([$clinicId]);
            $meds = $stmtMeds->fetchAll();
            
            $stmtItem = $pdo->prepare("INSERT INTO pharmacy_physical_inventory_items (inventory_id, medication_id, expected_qty, actual_qty, difference) VALUES (?, ?, ?, ?, 0)");
            foreach ($meds as $m) {
                $stmtItem->execute([$id, $m['id'], $m['stock'], $m['stock']]);
            }
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'save_physical_inventory':
            $invId = $data['inventory_id'];
            $items = $data['items']; // array of {id, actual_qty, difference, reason}
            
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("UPDATE pharmacy_physical_inventory_items SET actual_qty = ?, difference = ?, reason = ? WHERE id = ?");
            foreach ($items as $item) {
                $stmt->execute([(int)$item['actual_qty'], (int)$item['difference'], $item['reason'] ?? '', $item['id']]);
            }
            
            if (!empty($data['status']) && $data['status'] === 'validated') {
                $stmtVal = $pdo->prepare("UPDATE pharmacy_physical_inventories SET status = 'validated', validated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $stmtVal->execute([$invId]);
                
                // Adjust medication stocks based on the difference
                $stmtStock = $pdo->prepare("UPDATE medications SET stock = stock + ? WHERE id = ?");
                foreach ($items as $item) {
                    if ((int)$item['difference'] !== 0) {
                        $stmtStock->execute([(int)$item['difference'], $item['medication_id']]);
                    }
                }
            }
            $pdo->commit();
            sendResponse(["status" => "success"]);
            break;

        case 'save_medication':
            $id = $data['id'] ?? ("MED-" . time() . rand(10, 99));
            $isNew = !isset($data['id']);
            $stock_max = !empty($data['stock_max']) ? (int)$data['stock_max'] : null;

            // Barcode Generation
            $barcode = $data['barcode'] ?? '';
            if (empty($barcode)) {
                $barcode = '200' . str_pad(rand(0, 999999999), 9, '0', STR_PAD_LEFT);
                $sum = 0;
                for ($i = 0; $i < 12; $i++) {
                    $sum += (int)$barcode[$i] * ($i % 2 === 0 ? 1 : 3);
                }
                $checksum = (10 - ($sum % 10)) % 10;
                $barcode .= $checksum;
            }

            if (!$isNew) {
                $stmt = $pdo->prepare("UPDATE medications SET name=?, category=?, threshold=?, price=?, unit=?, code_product=?, barcode=?, dci=?, form=?, dosage=?, presentation=?, brand=?, supplier=?, price_buy=?, price_wholesale=?, stock_max=?, storage_location=?, description=?, image=? WHERE id=? AND clinic_id=?");
                $stmt->execute([
                    $data['name'], $data['category'] ?? '', (int)($data['threshold'] ?? 5), (float)($data['price'] ?? 0), $data['unit'] ?? 'boîte',
                    $data['code_product'] ?? '', $barcode, $data['dci'] ?? '', $data['form'] ?? '', $data['dosage'] ?? '',
                    $data['presentation'] ?? '', $data['brand'] ?? '', $data['supplier'] ?? '', (float)($data['price_buy'] ?? 0),
                    (float)($data['price_wholesale'] ?? 0), $stock_max, $data['storage_location'] ?? '', $data['description'] ?? '', $data['image'] ?? '',
                    $id, $clinicId
                ]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO medications (id, clinic_id, name, category, stock, threshold, price, unit, code_product, barcode, dci, form, dosage, presentation, brand, supplier, price_buy, price_wholesale, stock_max, storage_location, description, image) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id, $clinicId, $data['name'], $data['category'] ?? '', (int)($data['threshold'] ?? 5), (float)($data['price'] ?? 0), $data['unit'] ?? 'boîte',
                    $data['code_product'] ?? '', $barcode, $data['dci'] ?? '', $data['form'] ?? '', $data['dosage'] ?? '',
                    $data['presentation'] ?? '', $data['brand'] ?? '', $data['supplier'] ?? '', (float)($data['price_buy'] ?? 0),
                    (float)($data['price_wholesale'] ?? 0), $stock_max, $data['storage_location'] ?? '', $data['description'] ?? '', $data['image'] ?? ''
                ]);
            }
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', $isNew ? 'CREATE_MED' : 'UPDATE_MED', 'medications', $id, null, $data);
            sendResponse(["status" => "success", "id" => $id, "barcode" => $barcode]);
            break;

        case 'save_batch':
            $id = $data['id'] ?? ("BAT-" . time() . rand(10, 99));
            $isNew = !isset($data['id']);
            $qty = (int)$data['quantity'];
            
            $pdo->beginTransaction();
            if ($isNew) {
                $stmt = $pdo->prepare("INSERT INTO medication_batches (id, clinic_id, medication_id, batch_number, mfg_date, expiry_date, quantity, remaining_qty, price_buy, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id, $clinicId, $data['medication_id'], $data['batch_number'], $data['mfg_date'] ?? null, 
                    $data['expiry_date'], $qty, $qty, (float)($data['price_buy'] ?? 0), $data['supplier'] ?? ''
                ]);
                
                // Adjust parent medication stock
                $stmtMed = $pdo->prepare("UPDATE medications SET stock = stock + ? WHERE id = ? AND clinic_id = ?");
                $stmtMed->execute([$qty, $data['medication_id'], $clinicId]);
            } else {
                // Get difference
                $stmtOld = $pdo->prepare("SELECT remaining_qty FROM medication_batches WHERE id = ?");
                $stmtOld->execute([$id]);
                $oldQty = (int)$stmtOld->fetchColumn();
                $diff = $qty - $oldQty;

                $stmt = $pdo->prepare("UPDATE medication_batches SET batch_number = ?, mfg_date = ?, expiry_date = ?, quantity = ?, remaining_qty = ?, price_buy = ?, supplier = ? WHERE id = ? AND clinic_id = ?");
                $stmt->execute([
                    $data['batch_number'], $data['mfg_date'] ?? null, $data['expiry_date'], $qty, $qty, (float)($data['price_buy'] ?? 0), $data['supplier'] ?? '',
                    $id, $clinicId
                ]);

                // Adjust parent medication stock
                $stmtMed = $pdo->prepare("UPDATE medications SET stock = stock + ? WHERE id = ? AND clinic_id = ?");
                $stmtMed->execute([$diff, $data['medication_id'], $clinicId]);
            }
            $pdo->commit();
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'save_customer':
            $id = $data['id'] ?? ("CUST-" . time() . rand(10, 99));
            $isNew = !isset($data['id']);
            if ($isNew) {
                $stmt = $pdo->prepare("INSERT INTO pharmacy_customers (id, clinic_id, type, name, contact_name, phone, email, address, credit_limit, debt_balance, company_name, insurance_agreement, reimbursement_rate, ceiling, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id, $clinicId, $data['type'], $data['name'], $data['contact_name'] ?? '', $data['phone'] ?? '', 
                    $data['email'] ?? '', $data['address'] ?? '', (float)($data['credit_limit'] ?? 0), (float)($data['debt_balance'] ?? 0),
                    $data['company_name'] ?? '', $data['insurance_agreement'] ?? '', (float)($data['reimbursement_rate'] ?? 0), 
                    (float)($data['ceiling'] ?? 0), $data['status'] ?? 'active'
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE pharmacy_customers SET type = ?, name = ?, contact_name = ?, phone = ?, email = ?, address = ?, credit_limit = ?, company_name = ?, insurance_agreement = ?, reimbursement_rate = ?, ceiling = ?, status = ? WHERE id = ? AND clinic_id = ?");
                $stmt->execute([
                    $data['type'], $data['name'], $data['contact_name'] ?? '', $data['phone'] ?? '', 
                    $data['email'] ?? '', $data['address'] ?? '', (float)($data['credit_limit'] ?? 0),
                    $data['company_name'] ?? '', $data['insurance_agreement'] ?? '', (float)($data['reimbursement_rate'] ?? 0), 
                    (float)($data['ceiling'] ?? 0), $data['status'] ?? 'active', $id, $clinicId
                ]);
            }
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'save_prescription':
            $id = "PRES-" . time() . rand(10, 99);
            $stmt = $pdo->prepare("INSERT INTO pharmacy_prescriptions (id, clinic_id, patient_name, doctor_name, institution, prescription_date, file_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id, $clinicId, $data['patient_name'], $data['doctor_name'] ?? '', $data['institution'] ?? '',
                $data['prescription_date'] ?? date('Y-m-d'), $data['file_url'] ?? '', $data['notes'] ?? ''
            ]);
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'open_caisse':
            $registerId = $data['register_id'] ?? null;
            if (!$registerId) {
                sendResponse(["status" => "error", "message" => "Veuillez sélectionner une caisse physique."], 400);
            }

            $stmtCheckReg = $pdo->prepare("SELECT id FROM pharmacy_registers WHERE id = ? AND clinic_id = ? AND status = 'open'");
            $stmtCheckReg->execute([$registerId, $clinicId]);
            if ($stmtCheckReg->fetchColumn()) {
                sendResponse(["status" => "error", "message" => "Cette caisse est déjà ouverte par un autre utilisateur."], 400);
            }

            $stmtCheckUser = $pdo->prepare("SELECT id FROM pharmacy_cash_sessions WHERE clinic_id = ? AND user_id = ? AND status = 'open' LIMIT 1");
            $stmtCheckUser->execute([$clinicId, $auth['id']]);
            if ($stmtCheckUser->fetchColumn()) {
                sendResponse(["status" => "error", "message" => "Vous avez déjà une session de caisse ouverte."], 400);
            }
            
            $id = "SESS-" . time();
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("INSERT INTO pharmacy_cash_sessions (id, clinic_id, register_id, user_id, status, opening_balance) VALUES (?, ?, ?, ?, 'open', ?)");
            $stmt->execute([$id, $clinicId, $registerId, $auth['id'], (float)($data['opening_balance'] ?? 0)]);
            
            $stmtUpdReg = $pdo->prepare("UPDATE pharmacy_registers SET status = 'open', current_session_id = ? WHERE id = ?");
            $stmtUpdReg->execute([$id, $registerId]);
            
            $pdo->commit();
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'close_caisse':
            $sessionId = $data['session_id'];
            $closingBal = (float)$data['closing_balance'];
            
            // Calculate totals
            $stmtSum = $pdo->prepare("SELECT 
                                        COALESCE(SUM(CASE WHEN type='in' THEN amount ELSE 0 END), 0) as total_in,
                                        COALESCE(SUM(CASE WHEN type='out' THEN amount ELSE 0 END), 0) as total_out
                                      FROM pharmacy_cash_transactions WHERE session_id = ?");
            $stmtSum->execute([$sessionId]);
            $totals = $stmtSum->fetch();

            $stmtSess = $pdo->prepare("SELECT opening_balance FROM pharmacy_cash_sessions WHERE id = ?");
            $stmtSess->execute([$sessionId]);
            $openingBal = (float)$stmtSess->fetchColumn();

            $expected = $openingBal + $totals['total_in'] - $totals['total_out'];
            $discrepancy = $closingBal - $expected;

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("UPDATE pharmacy_cash_sessions SET status = 'closed', closed_at = CURRENT_TIMESTAMP, closing_balance = ?, total_sales = ?, total_expenses = ?, discrepancy = ?, notes = ? WHERE id = ?");
            $stmt->execute([
                $closingBal, $totals['total_in'], $totals['total_out'], $discrepancy, $data['notes'] ?? '', $sessionId
            ]);
            
            $stmtRel = $pdo->prepare("UPDATE pharmacy_registers SET status = 'closed', current_session_id = NULL WHERE current_session_id = ?");
            $stmtRel->execute([$sessionId]);
            
            $pdo->commit();

            sendResponse(["status" => "success", "expected" => $expected, "discrepancy" => $discrepancy]);
            break;

        case 'add_cash_transaction':
            $sessionId = $data['session_id'];
            $id = "TX-" . time() . rand(10, 99);
            $stmt = $pdo->prepare("INSERT INTO pharmacy_cash_transactions (id, session_id, type, amount, reason) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $sessionId, $data['type'], (float)$data['amount'], $data['reason']]);
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'add_credit_payment':
            $contractId = $data['contract_id'];
            $amount = (float)$data['amount'];
            $paymentMethod = $data['payment_method'];

            $pdo->beginTransaction();
            // Get contract
            $stmtC = $pdo->prepare("SELECT * FROM pharmacy_credit_contracts WHERE id = ? AND clinic_id = ?");
            $stmtC->execute([$contractId, $clinicId]);
            $contract = $stmtC->fetch();

            if (!$contract || $contract['remaining_amount'] < $amount) {
                $pdo->rollBack();
                sendResponse(["status" => "error", "message" => "Montant incorrect ou contrat introuvable"], 400);
            }

            // Save payment
            $payId = "PAY-" . time() . rand(10, 99);
            $stmtPay = $pdo->prepare("INSERT INTO pharmacy_credit_payments (id, contract_id, amount, payment_method) VALUES (?, ?, ?, ?)");
            $stmtPay->execute([$payId, $contractId, $amount, $paymentMethod]);

            // Update contract remaining and status
            $newRemaining = $contract['remaining_amount'] - $amount;
            $newStatus = $newRemaining <= 0 ? 'paid' : 'partially_paid';
            
            $stmtUpC = $pdo->prepare("UPDATE pharmacy_credit_contracts SET remaining_amount = ?, status = ? WHERE id = ?");
            $stmtUpC->execute([$newRemaining, $newStatus, $contractId]);

            // Update customer debt balance
            $stmtUpCust = $pdo->prepare("UPDATE pharmacy_customers SET debt_balance = debt_balance - ? WHERE id = ?");
            $stmtUpCust->execute([$amount, $contract['customer_id']]);

            // Record to Caisse if open session
            $stmtCheck = $pdo->prepare("SELECT id FROM pharmacy_cash_sessions WHERE clinic_id = ? AND status = 'open' LIMIT 1");
            $stmtCheck->execute([$clinicId]);
            $sessionId = $stmtCheck->fetchColumn();
            if ($sessionId) {
                $txId = "TX-" . time() . rand(10, 99);
                $stmtTx = $pdo->prepare("INSERT INTO pharmacy_cash_transactions (id, session_id, type, amount, reason) VALUES (?, ?, 'in', ?, ?)");
                $stmtTx->execute([$txId, $sessionId, $amount, "Règlement Crédit " . $contractId]);
            }

            // Post OHADA entry: Debit Cash/Bank (571000/521000), Credit Client (411100)
            $accountDebit = ($paymentMethod === 'Virement' || $paymentMethod === 'Chèque') ? '521000' : '571000';
            postOhadaEntry($pdo, $clinicId, date('Y-m-d'), 'CA', $contractId, "Règlement crédit client", [
                ['account_code' => $accountDebit, 'debit' => $amount, 'credit' => 0],
                ['account_code' => '411100', 'debit' => 0, 'credit' => $amount, 'partner_id' => $contract['customer_id']]
            ]);

            $pdo->commit();
            sendResponse(["status" => "success"]);
            break;

        case 'save_doc':
            // quote, invoice, purchase_order, delivery_slip
            $id = $data['id'] ?? ("DOC-" . time() . rand(10, 99));
            $isNew = !isset($data['id']);
            $type = $data['type'];
            
            $pdo->beginTransaction();
            if ($isNew) {
                $docNum = strtoupper(substr($type, 0, 3)) . "-" . date('Ymd') . "-" . rand(100, 999);
                $stmt = $pdo->prepare("INSERT INTO pharmacy_commercial_docs (id, clinic_id, type, doc_number, customer_id, supplier_id, total_ht, tax_rate, total_ttc, status, payment_method, insurance_amount, patient_amount, due_date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id, $clinicId, $type, $docNum, !empty($data['customer_id']) ? $data['customer_id'] : null, !empty($data['supplier_id']) ? $data['supplier_id'] : null,
                    (float)($data['total_ht'] ?? 0), (float)($data['tax_rate'] ?? 0), (float)($data['total_ttc'] ?? 0),
                    $data['status'], $data['payment_method'] ?? null, (float)($data['insurance_amount'] ?? 0),
                    (float)($data['patient_amount'] ?? 0), $data['due_date'] ?? null, $data['notes'] ?? '', $auth['name'] ?? 'System'
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE pharmacy_commercial_docs SET customer_id = ?, supplier_id = ?, total_ht = ?, tax_rate = ?, total_ttc = ?, status = ?, payment_method = ?, insurance_amount = ?, patient_amount = ?, due_date = ?, notes = ? WHERE id = ? AND clinic_id = ?");
                $stmt->execute([
                    !empty($data['customer_id']) ? $data['customer_id'] : null, !empty($data['supplier_id']) ? $data['supplier_id'] : null, (float)($data['total_ht'] ?? 0), 
                    (float)($data['tax_rate'] ?? 0), (float)($data['total_ttc'] ?? 0), $data['status'], 
                    $data['payment_method'] ?? null, (float)($data['insurance_amount'] ?? 0), 
                    (float)($data['patient_amount'] ?? 0), $data['due_date'] ?? null, $data['notes'] ?? '', $id, $clinicId
                ]);
                
                // Clear old items if updating
                $stmtClear = $pdo->prepare("DELETE FROM pharmacy_commercial_doc_items WHERE doc_id = ?");
                $stmtClear->execute([$id]);
            }

            // Insert Items
            $stmtItem = $pdo->prepare("INSERT INTO pharmacy_commercial_doc_items (doc_id, medication_id, quantity, unit_type, unit_price, total_price, batch_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['items'] as $item) {
                $stmtItem->execute([
                    $id, $item['medication_id'], (int)$item['quantity'], $item['unit_type'] ?? 'box',
                    (float)$item['unit_price'], (float)$item['total_price'], $item['batch_id'] ?? null
                ]);

                // Stock Update Logic: Invoices decrease stock, Purchase Orders do not, but Delivery Slips do.
                if ($type === 'invoice' || $type === 'delivery_slip') {
                    $qtyToDeduct = (int)$item['quantity'];

                    // FIFO Stock Deduction from Batches
                    $stmtBatches = $pdo->prepare("SELECT * FROM medication_batches WHERE medication_id = ? AND clinic_id = ? AND remaining_qty > 0 ORDER BY expiry_date ASC");
                    $stmtBatches->execute([$item['medication_id'], $clinicId]);
                    $batches = $stmtBatches->fetchAll();

                    foreach ($batches as $batch) {
                        if ($qtyToDeduct <= 0) break;
                        $deduct = min($qtyToDeduct, $batch['remaining_qty']);
                        
                        $stmtUpdateBatch = $pdo->prepare("UPDATE medication_batches SET remaining_qty = remaining_qty - ? WHERE id = ?");
                        $stmtUpdateBatch->execute([$deduct, $batch['id']]);
                        $qtyToDeduct -= $deduct;
                    }

                    // Deduct parent medication stock
                    $stmtMed = $pdo->prepare("UPDATE medications SET stock = stock - ? WHERE id = ?");
                    $stmtMed->execute([(int)$item['quantity'], $item['medication_id']]);
                }
            }

            // Vente -> Stock -> Caisse -> Comptabilité (Sync)
            if ($type === 'invoice' && $data['status'] === 'paid') {
                $totalTTC = (float)$data['total_ttc'];
                $totalHT = (float)$data['total_ht'];
                $taxAmount = $totalTTC - $totalHT;
                
                // Caisse entry
                $stmtCheck = $pdo->prepare("SELECT id FROM pharmacy_cash_sessions WHERE clinic_id = ? AND status = 'open' LIMIT 1");
                $stmtCheck->execute([$clinicId]);
                $sessionId = $stmtCheck->fetchColumn();
                if ($sessionId) {
                    $txId = "TX-" . time() . rand(10, 99);
                    $stmtTx = $pdo->prepare("INSERT INTO pharmacy_cash_transactions (id, session_id, type, amount, reason) VALUES (?, ?, 'in', ?, ?)");
                    $stmtTx->execute([$txId, $sessionId, $totalTTC, "Vente comptoir " . $id]);
                }

                // OHADA Entry: Debit Cash/Bank (571000/521000), Credit Sales (701100), Credit VAT (442000)
                $accountDebit = ($data['payment_method'] === 'Virement' || $data['payment_method'] === 'Chèque') ? '521000' : '571000';
                postOhadaEntry($pdo, $clinicId, date('Y-m-d'), 'VE', $id, "Vente au comptant", [
                    ['account_code' => $accountDebit, 'debit' => $totalTTC, 'credit' => 0],
                    ['account_code' => '701100', 'debit' => 0, 'credit' => $totalHT],
                    ['account_code' => '442000', 'debit' => 0, 'credit' => $taxAmount]
                ]);
            }

            // Vente avec Crédit Client
            if ($type === 'invoice' && ($data['status'] === 'pending' || $data['status'] === 'partially_paid')) {
                $totalTTC = (float)$data['total_ttc'];
                $patientAmt = (float)($data['patient_amount'] ?? $totalTTC);
                $insurAmt = (float)($data['insurance_amount'] ?? 0);
                
                // Create credit contract for customer copay/debt
                if ($patientAmt > 0 && isset($data['customer_id'])) {
                    $cId = "CRD-" . time() . rand(10, 99);
                    $stmtCred = $pdo->prepare("INSERT INTO pharmacy_credit_contracts (id, clinic_id, customer_id, sale_id, total_amount, remaining_amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')");
                    $stmtCred->execute([
                        $cId, $clinicId, $data['customer_id'], $id, $patientAmt, $patientAmt,
                        $data['due_date'] ?? date('Y-m-d', strtotime('+30 days'))
                    ]);

                    // Update customer balance
                    $stmtCust = $pdo->prepare("UPDATE pharmacy_customers SET debt_balance = debt_balance + ? WHERE id = ?");
                    $stmtCust->execute([$patientAmt, $data['customer_id']]);

                    // OHADA Entry: Debit Customer account (411100)
                    postOhadaEntry($pdo, $clinicId, date('Y-m-d'), 'VE', $id, "Vente à crédit particulier", [
                        ['account_code' => '411100', 'debit' => $patientAmt, 'credit' => 0, 'partner_id' => $data['customer_id']],
                        ['account_code' => '701100', 'debit' => 0, 'credit' => $patientAmt]
                    ]);
                }

                // If insurance copay exists
                if ($insurAmt > 0 && isset($data['insurance_id'])) {
                    $cId = "CRD-" . time() . rand(10, 99);
                    $stmtCred = $pdo->prepare("INSERT INTO pharmacy_credit_contracts (id, clinic_id, customer_id, sale_id, total_amount, remaining_amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')");
                    $stmtCred->execute([
                        $cId, $clinicId, $data['insurance_id'], $id, $insurAmt, $insurAmt,
                        date('Y-m-d', strtotime('+45 days'))
                    ]);

                    // Update customer balance (for insurance)
                    $stmtCust = $pdo->prepare("UPDATE pharmacy_customers SET debt_balance = debt_balance + ? WHERE id = ?");
                    $stmtCust->execute([$insurAmt, $data['insurance_id']]);

                    // OHADA Entry: Debit Insurance Client Account (411100)
                    postOhadaEntry($pdo, $clinicId, date('Y-m-d'), 'VE', $id, "Vente avec tiers-payant assurance", [
                        ['account_code' => '411100', 'debit' => $insurAmt, 'credit' => 0, 'partner_id' => $data['insurance_id']],
                        ['account_code' => '701100', 'debit' => 0, 'credit' => $insurAmt]
                    ]);
                }
            }

            $pdo->commit();
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', $isNew ? 'CREATE_DOC' : 'UPDATE_DOC', 'pharmacy_commercial_docs', $id, null, $data);
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'save_internal_request':
            $id = "REQ-" . time() . rand(10, 99);
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO pharmacy_internal_requests (id, clinic_id, service_name, status, notes, created_by) VALUES (?, ?, ?, 'pending', ?, ?)");
            $stmt->execute([$id, $clinicId, $data['service_name'], $data['notes'] ?? '', $auth['name']]);

            $stmtItem = $pdo->prepare("INSERT INTO pharmacy_internal_request_items (request_id, medication_id, quantity) VALUES (?, ?, ?)");
            foreach ($data['items'] as $item) {
                $stmtItem->execute([$id, $item['medication_id'], (int)$item['quantity']]);
            }
            $pdo->commit();
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'update_internal_request_status':
            $id = $data['id'];
            $status = $data['status']; // validated, prepared, delivered, refused

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("UPDATE pharmacy_internal_requests SET status = ? WHERE id = ? AND clinic_id = ?");
            $stmt->execute([$status, $id, $clinicId]);

            // If delivered, decrease stock using FIFO
            if ($status === 'delivered') {
                $stmtItems = $pdo->prepare("SELECT * FROM pharmacy_internal_request_items WHERE request_id = ?");
                $stmtItems->execute([$id]);
                $items = $stmtItems->fetchAll();

                foreach ($items as $item) {
                    $qtyToDeduct = $item['quantity'];

                    // FIFO Stock Deduction from Batches
                    $stmtBatches = $pdo->prepare("SELECT * FROM medication_batches WHERE medication_id = ? AND clinic_id = ? AND remaining_qty > 0 ORDER BY expiry_date ASC");
                    $stmtBatches->execute([$item['medication_id'], $clinicId]);
                    $batches = $stmtBatches->fetchAll();

                    foreach ($batches as $batch) {
                        if ($qtyToDeduct <= 0) break;
                        $deduct = min($qtyToDeduct, $batch['remaining_qty']);
                        
                        $stmtUpdateBatch = $pdo->prepare("UPDATE medication_batches SET remaining_qty = remaining_qty - ? WHERE id = ?");
                        $stmtUpdateBatch->execute([$deduct, $batch['id']]);
                        $qtyToDeduct -= $deduct;
                    }

                    // Deduct parent medication stock
                    $stmtMed = $pdo->prepare("UPDATE medications SET stock = stock - ? WHERE id = ?");
                    $stmtMed->execute([$item['quantity'], $item['medication_id']]);
                }
            }
            $pdo->commit();
            sendResponse(["status" => "success"]);
            break;

        case 'administer_medication':
            $id = "ADM-" . time() . rand(10, 99);
            $qty = (int)$data['quantity'];

            $pdo->beginTransaction();
            // Fetch Medication Price
            $stmtMed = $pdo->prepare("SELECT price, stock FROM medications WHERE id = ? AND clinic_id = ?");
            $stmtMed->execute([$data['medication_id'], $clinicId]);
            $med = $stmtMed->fetch();

            if (!$med || $med['stock'] < $qty) {
                $pdo->rollBack();
                sendResponse(["status" => "error", "message" => "Médicament introuvable ou stock insuffisant."], 400);
            }

            $priceSell = (float)$med['price'];
            $totalCost = $priceSell * $qty;

            // Log administration
            $stmt = $pdo->prepare("INSERT INTO pharmacy_patient_administrations (id, clinic_id, patient_id, consultation_id, hospitalization_id, prescription_id, medication_id, quantity, price_sell, administered_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id, $clinicId, $data['patient_id'], $data['consultation_id'] ?? null, 
                $data['hospitalization_id'] ?? null, $data['prescription_id'] ?? null,
                $data['medication_id'], $qty, $priceSell, $auth['name']
            ]);

            // Add billing record if patient is known
            if (!empty($data['patient_id'])) {
                $invId = "INV-PH-" . date("YmdHis");
                $stmtInv = $pdo->prepare("INSERT INTO invoices (id, clinic_id, patient_id, invoice_date, total_amount, status, payment_method, amount_patient) VALUES (?, ?, ?, CURRENT_DATE, ?, 'pending', 'cash', ?)");
                $stmtInv->execute([$invId, $clinicId, $data['patient_id'], $totalCost, $totalCost]);
                
                $stmtInvItem = $pdo->prepare("INSERT INTO invoice_items (invoice_id, description, amount) VALUES (?, ?, ?)");
                $stmtInvItem->execute([$invId, "Administration Médicament: " . $med['name'], $totalCost]);
            }

            // Deduct stock using FIFO
            $qtyToDeduct = $qty;
            $stmtBatches = $pdo->prepare("SELECT * FROM medication_batches WHERE medication_id = ? AND clinic_id = ? AND remaining_qty > 0 ORDER BY expiry_date ASC");
            $stmtBatches->execute([$data['medication_id'], $clinicId]);
            $batches = $stmtBatches->fetchAll();

            foreach ($batches as $batch) {
                if ($qtyToDeduct <= 0) break;
                $deduct = min($qtyToDeduct, $batch['remaining_qty']);
                $stmtUpdateBatch = $pdo->prepare("UPDATE medication_batches SET remaining_qty = remaining_qty - ? WHERE id = ?");
                $stmtUpdateBatch->execute([$deduct, $batch['id']]);
                $qtyToDeduct -= $deduct;
            }

            $stmtMedDeduct = $pdo->prepare("UPDATE medications SET stock = stock - ? WHERE id = ?");
            $stmtMedDeduct->execute([$qty, $data['medication_id']]);

            // Auto Billing: add line to pending invoice for that patient
            // Check if patient has an active pending invoice, otherwise create one
            $stmtInv = $pdo->prepare("SELECT id FROM invoices WHERE clinic_id = ? AND patient_id = ? AND status = 'pending' ORDER BY invoice_date DESC LIMIT 1");
            $stmtInv->execute([$clinicId, $data['patient_id']]);
            $invoiceId = $stmtInv->fetchColumn();

            if (!$invoiceId) {
                $invoiceId = "INV-" . time();
                $stmtCreateInv = $pdo->prepare("INSERT INTO invoices (id, clinic_id, patient_id, invoice_date, total_amount, status) VALUES (?, ?, ?, CURDATE(), ?, 'pending')");
                $stmtCreateInv->execute([$invoiceId, $clinicId, $data['patient_id'], $totalCost]);
            } else {
                // Update total
                $stmtUpdateInv = $pdo->prepare("UPDATE invoices SET total_amount = total_amount + ? WHERE id = ?");
                $stmtUpdateInv->execute([$totalCost, $invoiceId]);
            }

            // Insert Item
            $stmtInvItem = $pdo->prepare("INSERT INTO invoice_items (invoice_id, description, amount) VALUES (?, ?, ?)");
            $stmtInvItem->execute([$invoiceId, "Administration Pharmacie: " . $data['medication_name'] . " (x" . $qty . ")", $totalCost]);

            // Log activity & OHADA Entry (Debit Patient Receivable 411100, Credit Medical Revenue 701100)
            postOhadaEntry($pdo, $clinicId, date('Y-m-d'), 'VE', $invoiceId, "Administration soins pharmacie", [
                ['account_code' => '411100', 'debit' => $totalCost, 'credit' => 0, 'partner_id' => $data['patient_id']],
                ['account_code' => '701100', 'debit' => 0, 'credit' => $totalCost]
            ]);

            $pdo->commit();
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'save_role':
            $id = $data['id'] ?? ("ROL-" . time() . rand(10, 99));
            $isNew = !isset($data['id']);
            
            $pdo->beginTransaction();
            if ($isNew) {
                $stmt = $pdo->prepare("INSERT INTO pharmacy_roles (id, clinic_id, name, description) VALUES (?, ?, ?, ?)");
                $stmt->execute([$id, $clinicId, $data['name'], $data['description'] ?? '']);
            } else {
                $stmt = $pdo->prepare("UPDATE pharmacy_roles SET name = ?, description = ? WHERE id = ? AND clinic_id = ?");
                $stmt->execute([$data['name'], $data['description'] ?? '', $id, $clinicId]);
                
                $stmtDel = $pdo->prepare("DELETE FROM pharmacy_role_permissions WHERE role_id = ?");
                $stmtDel->execute([$id]);
            }
            
            if (!empty($data['permissions']) && is_array($data['permissions'])) {
                $stmtPerm = $pdo->prepare("INSERT INTO pharmacy_role_permissions (role_id, permission_key) VALUES (?, ?)");
                foreach ($data['permissions'] as $perm) {
                    $stmtPerm->execute([$id, $perm]);
                }
            }
            
            $pdo->commit();
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', $isNew ? 'CREATE_ROLE' : 'UPDATE_ROLE', 'pharmacy_roles', $id, null, $data);
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'delete_role':
            $id = $data['id'];
            $stmt = $pdo->prepare("DELETE FROM pharmacy_roles WHERE id = ? AND clinic_id = ? AND is_system = 0");
            $stmt->execute([$id, $clinicId]);
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', 'DELETE_ROLE', 'pharmacy_roles', $id, null, null);
            sendResponse(["status" => "success"]);
            break;

        case 'save_register':
            $id = $data['id'] ?? ("REG-" . time() . rand(10, 99));
            $isNew = !isset($data['id']);
            if ($isNew) {
                $stmt = $pdo->prepare("INSERT INTO pharmacy_registers (id, clinic_id, name) VALUES (?, ?, ?)");
                $stmt->execute([$id, $clinicId, $data['name']]);
            } else {
                $stmt = $pdo->prepare("UPDATE pharmacy_registers SET name = ? WHERE id = ? AND clinic_id = ?");
                $stmt->execute([$data['name'], $id, $clinicId]);
            }
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', $isNew ? 'CREATE_REGISTER' : 'UPDATE_REGISTER', 'pharmacy_registers', $id, null, $data);
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'delete_register':
            $id = $data['id'];
            $stmt = $pdo->prepare("DELETE FROM pharmacy_registers WHERE id = ? AND clinic_id = ? AND status = 'closed'");
            $stmt->execute([$id, $clinicId]);
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', 'DELETE_REGISTER', 'pharmacy_registers', $id, null, null);
            sendResponse(["status" => "success"]);
            break;

        // ═══════════════════════════════════════════════════════════════
        //  MODULE 20 : RETOURS
        // ═══════════════════════════════════════════════════════════════
        case 'save_return':
            $id = "RET-" . time() . rand(10, 99);
            $type = $data['type']; // customer | supplier

            $pdo->beginTransaction();
            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $totalAmount += (float)$item['total_price'];
            }

            $stmt = $pdo->prepare("INSERT INTO pharmacy_returns (id, clinic_id, type, doc_id, customer_id, supplier_id, reason, total_amount, refund_method, processed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id, $clinicId, $type, $data['doc_id'] ?? null,
                !empty($data['customer_id']) ? $data['customer_id'] : null,
                !empty($data['supplier_id']) ? $data['supplier_id'] : null,
                $data['reason'] ?? '', $totalAmount,
                $data['refund_method'] ?? 'credit_note',
                $auth['name'] ?? 'System'
            ]);

            $stmtItem = $pdo->prepare("INSERT INTO pharmacy_return_items (return_id, medication_id, batch_id, quantity, unit_price, total_price, reason) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['items'] as $item) {
                $stmtItem->execute([
                    $id, $item['medication_id'], $item['batch_id'] ?? null,
                    (int)$item['quantity'], (float)$item['unit_price'],
                    (float)$item['total_price'], $item['reason'] ?? ''
                ]);
            }
            $pdo->commit();
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', 'CREATE_RETURN', 'pharmacy_returns', $id, null, $data);
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'validate_return':
            $id = $data['id'];
            $action_type = $data['decision']; // validated | rejected

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("UPDATE pharmacy_returns SET status = ?, validated_by = ?, validated_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ?");
            $stmt->execute([$action_type, $auth['name'] ?? 'System', $id, $clinicId]);

            if ($action_type === 'validated') {
                // Réintégrer le stock
                $stmtItems = $pdo->prepare("SELECT * FROM pharmacy_return_items WHERE return_id = ?");
                $stmtItems->execute([$id]);
                $items = $stmtItems->fetchAll();

                foreach ($items as $item) {
                    // Remettre dans le lot si batch_id fourni
                    if ($item['batch_id']) {
                        $pdo->prepare("UPDATE medication_batches SET remaining_qty = remaining_qty + ? WHERE id = ?")->execute([$item['quantity'], $item['batch_id']]);
                    }
                    // Remettre dans le stock global
                    $pdo->prepare("UPDATE medications SET stock = stock + ? WHERE id = ?")->execute([$item['quantity'], $item['medication_id']]);
                }

                // Écriture comptable OHADA (retour = avoir)
                $stmtRet = $pdo->prepare("SELECT total_amount, type, customer_id FROM pharmacy_returns WHERE id = ?");
                $stmtRet->execute([$id]);
                $retData = $stmtRet->fetch();

                if ($retData && $retData['type'] === 'customer') {
                    postOhadaEntry($pdo, $clinicId, date('Y-m-d'), 'VE', $id, "Avoir client - Retour marchandise", [
                        ['account_code' => '701100', 'debit' => $retData['total_amount'], 'credit' => 0],
                        ['account_code' => '411100', 'debit' => 0, 'credit' => $retData['total_amount'], 'partner_id' => $retData['customer_id']]
                    ]);
                }
            }

            $pdo->commit();
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', 'VALIDATE_RETURN', 'pharmacy_returns', $id, null, $data);
            sendResponse(["status" => "success"]);
            break;

        // ═══════════════════════════════════════════════════════════════
        //  MODULE 21 : PROMOTIONS
        // ═══════════════════════════════════════════════════════════════
        case 'save_promotion':
            $id = $data['id'] ?? ("PROMO-" . time() . rand(10, 99));
            $isNew = !isset($data['id']);

            if ($isNew) {
                $stmt = $pdo->prepare("INSERT INTO pharmacy_promotions (id, clinic_id, name, type, value, buy_qty, free_qty, applies_to, target_id, min_purchase, start_date, end_date, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id, $clinicId, $data['name'], $data['type'],
                    (float)($data['value'] ?? 0),
                    !empty($data['buy_qty']) ? (int)$data['buy_qty'] : null,
                    !empty($data['free_qty']) ? (int)$data['free_qty'] : null,
                    $data['applies_to'] ?? 'all',
                    !empty($data['target_id']) ? $data['target_id'] : null,
                    (float)($data['min_purchase'] ?? 0),
                    $data['start_date'], $data['end_date'],
                    isset($data['is_active']) ? (int)$data['is_active'] : 1,
                    $auth['name'] ?? 'System'
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE pharmacy_promotions SET name = ?, type = ?, value = ?, buy_qty = ?, free_qty = ?, applies_to = ?, target_id = ?, min_purchase = ?, start_date = ?, end_date = ?, is_active = ? WHERE id = ? AND clinic_id = ?");
                $stmt->execute([
                    $data['name'], $data['type'], (float)($data['value'] ?? 0),
                    !empty($data['buy_qty']) ? (int)$data['buy_qty'] : null,
                    !empty($data['free_qty']) ? (int)$data['free_qty'] : null,
                    $data['applies_to'] ?? 'all',
                    !empty($data['target_id']) ? $data['target_id'] : null,
                    (float)($data['min_purchase'] ?? 0),
                    $data['start_date'], $data['end_date'],
                    isset($data['is_active']) ? (int)$data['is_active'] : 1,
                    $id, $clinicId
                ]);
            }
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', $isNew ? 'CREATE_PROMO' : 'UPDATE_PROMO', 'pharmacy_promotions', $id, null, $data);
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'delete_promotion':
            $id = $data['id'];
            $pdo->prepare("DELETE FROM pharmacy_promotions WHERE id = ? AND clinic_id = ?")->execute([$id, $clinicId]);
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', 'DELETE_PROMO', 'pharmacy_promotions', $id, null, null);
            sendResponse(["status" => "success"]);
            break;

        // ═══════════════════════════════════════════════════════════════
        //  MODULE 22 : FIDÉLITÉ
        // ═══════════════════════════════════════════════════════════════
        case 'save_loyalty_config':
            $stmtChk = $pdo->prepare("SELECT COUNT(*) FROM pharmacy_loyalty_config WHERE clinic_id = ?");
            $stmtChk->execute([$clinicId]);
            if ($stmtChk->fetchColumn() > 0) {
                $stmt = $pdo->prepare("UPDATE pharmacy_loyalty_config SET points_per_unit = ?, currency_per_point = ?, min_redeem_points = ?, is_active = ? WHERE clinic_id = ?");
                $stmt->execute([
                    (float)($data['points_per_unit'] ?? 1),
                    (float)($data['currency_per_point'] ?? 10),
                    (int)($data['min_redeem_points'] ?? 100),
                    (int)($data['is_active'] ?? 0),
                    $clinicId
                ]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO pharmacy_loyalty_config (clinic_id, points_per_unit, currency_per_point, min_redeem_points, is_active) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $clinicId,
                    (float)($data['points_per_unit'] ?? 1),
                    (float)($data['currency_per_point'] ?? 10),
                    (int)($data['min_redeem_points'] ?? 100),
                    (int)($data['is_active'] ?? 0)
                ]);
            }
            sendResponse(["status" => "success"]);
            break;

        case 'redeem_loyalty':
            $custId = $data['customer_id'];
            $points = (int)$data['points'];

            // Vérifier config et solde
            $stmtConf = $pdo->prepare("SELECT * FROM pharmacy_loyalty_config WHERE clinic_id = ?");
            $stmtConf->execute([$clinicId]);
            $conf = $stmtConf->fetch();

            $stmtCust = $pdo->prepare("SELECT loyalty_points FROM pharmacy_customers WHERE id = ? AND clinic_id = ?");
            $stmtCust->execute([$custId, $clinicId]);
            $custPoints = (int)$stmtCust->fetchColumn();

            if (!$conf || !$conf['is_active']) {
                sendResponse(["status" => "error", "message" => "Programme de fidélité non actif."], 400);
            }
            if ($points < $conf['min_redeem_points'] || $points > $custPoints) {
                sendResponse(["status" => "error", "message" => "Points insuffisants ou en dessous du minimum."], 400);
            }

            $value = $points * (float)$conf['currency_per_point'];
            $pdo->beginTransaction();
            $pdo->prepare("UPDATE pharmacy_customers SET loyalty_points = loyalty_points - ? WHERE id = ?")->execute([$points, $custId]);
            $pdo->prepare("INSERT INTO pharmacy_loyalty_transactions (clinic_id, customer_id, type, points, description) VALUES (?, ?, 'redeem', ?, ?)")->execute([
                $clinicId, $custId, $points, "Échange de $points points pour $value CFA"
            ]);
            $pdo->commit();
            sendResponse(["status" => "success", "redeemed_value" => $value]);
            break;

        // ═══════════════════════════════════════════════════════════════
        //  MODULE 19 : TRANSFERTS DE STOCK
        // ═══════════════════════════════════════════════════════════════
        case 'save_transfer':
            $id = "TRF-" . time() . rand(10, 99);

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO pharmacy_stock_transfers (id, clinic_id, from_location, to_location, status, notes, requested_by) VALUES (?, ?, ?, ?, 'pending', ?, ?)");
            $stmt->execute([
                $id, $clinicId,
                $data['from_location'], $data['to_location'],
                $data['notes'] ?? '', $auth['name'] ?? 'System'
            ]);

            $stmtItem = $pdo->prepare("INSERT INTO pharmacy_stock_transfer_items (transfer_id, medication_id, batch_id, quantity_sent) VALUES (?, ?, ?, ?)");
            foreach ($data['items'] as $item) {
                $stmtItem->execute([$id, $item['medication_id'], $item['batch_id'] ?? null, (int)$item['quantity']]);
            }
            $pdo->commit();
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', 'CREATE_TRANSFER', 'pharmacy_stock_transfers', $id, null, $data);
            sendResponse(["status" => "success", "id" => $id]);
            break;

        case 'update_transfer_status':
            $id = $data['id'];
            $newStatus = $data['status']; // in_transit, received, cancelled

            $pdo->beginTransaction();

            if ($newStatus === 'in_transit') {
                // Déduire le stock de la source
                $stmtItems = $pdo->prepare("SELECT * FROM pharmacy_stock_transfer_items WHERE transfer_id = ?");
                $stmtItems->execute([$id]);
                $items = $stmtItems->fetchAll();

                foreach ($items as $item) {
                    $pdo->prepare("UPDATE medications SET stock = stock - ? WHERE id = ? AND clinic_id = ?")->execute([$item['quantity_sent'], $item['medication_id'], $clinicId]);
                    if ($item['batch_id']) {
                        $pdo->prepare("UPDATE medication_batches SET remaining_qty = remaining_qty - ? WHERE id = ?")->execute([$item['quantity_sent'], $item['batch_id']]);
                    }
                }

                $pdo->prepare("UPDATE pharmacy_stock_transfers SET status = 'in_transit', approved_by = ?, shipped_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ?")->execute([$auth['name'] ?? 'System', $id, $clinicId]);

            } elseif ($newStatus === 'received') {
                // Ajouter au stock de destination
                $stmtItems = $pdo->prepare("SELECT * FROM pharmacy_stock_transfer_items WHERE transfer_id = ?");
                $stmtItems->execute([$id]);
                $items = $stmtItems->fetchAll();

                foreach ($items as $item) {
                    $recvQty = $item['quantity_received'] > 0 ? $item['quantity_received'] : $item['quantity_sent'];
                    $pdo->prepare("UPDATE medications SET stock = stock + ? WHERE id = ? AND clinic_id = ?")->execute([$recvQty, $item['medication_id'], $clinicId]);
                }

                $pdo->prepare("UPDATE pharmacy_stock_transfers SET status = 'received', received_by = ?, received_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ?")->execute([$auth['name'] ?? 'System', $id, $clinicId]);

            } elseif ($newStatus === 'cancelled') {
                $pdo->prepare("UPDATE pharmacy_stock_transfers SET status = 'cancelled' WHERE id = ? AND clinic_id = ?")->execute([$id, $clinicId]);
            }

            $pdo->commit();
            systemAuditLog($pdo, $clinicId, $auth['id'] ?? 'system', 'UPDATE_TRANSFER_' . strtoupper($newStatus), 'pharmacy_stock_transfers', $id, null, $data);
            sendResponse(["status" => "success"]);
            break;
    }
}
?>
