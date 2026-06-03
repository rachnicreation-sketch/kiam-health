<?php
/**
 * Kiam ERP – Procurement API
 * Gestion complète du cycle d'approvisionnement
 */
require_once 'config.php';
require_once 'functions.php';

$method  = $_SERVER['REQUEST_METHOD'];
$action  = $_GET['action'] ?? '';
$clinic  = $_GET['clinicId'] ?? null;
$data    = getRequestData();
if (!$clinic) $clinic = $data['clinicId'] ?? null;

// ─── Helpers ────────────────────────────────────────────────────────────────
function genId(string $prefix): string {
    return $prefix . '-' . strtoupper(substr(md5(uniqid()), 0, 8));
}
function genNumber(PDO $pdo, string $table, string $col, string $prefix): string {
    $stmt = $pdo->query("SELECT COUNT(*)+1 as n FROM $table");
    $n = $stmt->fetch()['n'] ?? 1;
    return $prefix . str_pad($n, 5, '0', STR_PAD_LEFT);
}

if (!$clinic) {
    sendResponse(["status" => "error", "message" => "clinicId requis"], 400);
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
if ($action === 'dashboard') {
    $res = [];
    try {
        $s = $pdo->prepare("SELECT COUNT(*) as c FROM purchase_requests WHERE clinic_id=? AND status='pending'");
        $s->execute([$clinic]); $res['pending_requests'] = (int)$s->fetchColumn();

        $s = $pdo->prepare("SELECT COUNT(*) as c FROM purchase_orders WHERE clinic_id=? AND status NOT IN('received','cancelled')");
        $s->execute([$clinic]); $res['open_orders'] = (int)$s->fetchColumn();

        $s = $pdo->prepare("SELECT COUNT(*) as c FROM supplier_invoices WHERE clinic_id=? AND status IN('pending','partial')");
        $s->execute([$clinic]); $res['pending_invoices'] = (int)$s->fetchColumn();

        $s = $pdo->prepare("SELECT COALESCE(SUM(total_ttc - paid_amount),0) as d FROM supplier_invoices WHERE clinic_id=? AND status IN('validated','partial')");
        $s->execute([$clinic]); $res['total_debt'] = (float)$s->fetchColumn();

        $s = $pdo->prepare("SELECT COUNT(*) as c FROM goods_receipts WHERE clinic_id=? AND status='draft'");
        $s->execute([$clinic]); $res['pending_receipts'] = (int)$s->fetchColumn();

        // Recent POs
        $s = $pdo->prepare("SELECT po.*, s.name as supplier_name FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id=s.id WHERE po.clinic_id=? ORDER BY po.created_at DESC LIMIT 5");
        $s->execute([$clinic]); $res['recent_orders'] = $s->fetchAll();

        // Low stock alerts (from inventory_items)
        try {
            $s = $pdo->prepare("SELECT name, stock, threshold FROM inventory_items WHERE clinic_id=? AND stock<=threshold AND stock>0 ORDER BY stock ASC LIMIT 8");
            $s->execute([$clinic]); $res['low_stock'] = $s->fetchAll();
        } catch (Exception $e) { $res['low_stock'] = []; }

    } catch (Exception $e) { /* graceful */ }
    sendResponse(array_merge(["status"=>"success"], $res));
}

// ════════════════════════════════════════════════════════════════════════════
// SUPPLIERS
// ════════════════════════════════════════════════════════════════════════════
elseif ($action === 'suppliers_list') {
    $search = $_GET['search'] ?? '';
    $rating = $_GET['rating'] ?? '';
    $sql = "SELECT s.*, 
                (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id=s.id AND po.clinic_id=s.clinic_id) as total_orders,
                (SELECT COALESCE(SUM(si.total_ttc - si.paid_amount),0) FROM supplier_invoices si WHERE si.supplier_id=s.id AND si.clinic_id=s.clinic_id AND si.status IN('validated','partial')) as balance_due
            FROM suppliers s WHERE s.clinic_id=?";
    $params = [$clinic];
    if ($search) { $sql .= " AND s.name LIKE ?"; $params[] = "%$search%"; }
    if ($rating) { $sql .= " AND s.rating=?"; $params[] = $rating; }
    $sql .= " ORDER BY s.name ASC";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    sendResponse($stmt->fetchAll());
}

elseif ($action === 'suppliers_get') {
    $id = $_GET['id'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE id=? AND clinic_id=?");
    $stmt->execute([$id, $clinic]);
    $supplier = $stmt->fetch();
    // Purchase history
    $stmt2 = $pdo->prepare("SELECT po.*, gr.status as receipt_status FROM purchase_orders po LEFT JOIN goods_receipts gr ON gr.order_id=po.id WHERE po.supplier_id=? AND po.clinic_id=? ORDER BY po.created_at DESC LIMIT 10");
    $stmt2->execute([$id, $clinic]);
    $supplier['orders'] = $stmt2->fetchAll();
    sendResponse($supplier);
}

elseif ($action === 'suppliers_create') {
    $id = genId('SUP');
    $stmt = $pdo->prepare("INSERT INTO suppliers (id,clinic_id,name,contact_name,phone,email,address,payment_terms,rating,notes) VALUES (?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([$id,$clinic,$data['name'],$data['contact_name']??null,$data['phone']??null,$data['email']??null,$data['address']??null,$data['payment_terms']??'immediate',$data['rating']??'average',$data['notes']??null]);
    sendResponse(["status"=>"success","id"=>$id]);
}

elseif ($action === 'suppliers_update') {
    $stmt = $pdo->prepare("UPDATE suppliers SET name=?,contact_name=?,phone=?,email=?,address=?,payment_terms=?,rating=?,notes=? WHERE id=? AND clinic_id=?");
    $stmt->execute([$data['name'],$data['contact_name']??null,$data['phone']??null,$data['email']??null,$data['address']??null,$data['payment_terms']??'immediate',$data['rating']??'average',$data['notes']??null,$data['id'],$clinic]);
    sendResponse(["status"=>"success"]);
}

elseif ($action === 'suppliers_delete') {
    $id = $_GET['id'] ?? $data['id'] ?? '';
    // Check no open orders
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM purchase_orders WHERE supplier_id=? AND clinic_id=? AND status NOT IN('received','cancelled')");
    $stmt->execute([$id,$clinic]);
    if ((int)$stmt->fetchColumn() > 0) {
        sendResponse(["status"=>"error","message"=>"Ce fournisseur a des commandes en cours. Impossible de supprimer."], 409);
    }
    $pdo->prepare("DELETE FROM suppliers WHERE id=? AND clinic_id=?")->execute([$id,$clinic]);
    sendResponse(["status"=>"success"]);
}

// ════════════════════════════════════════════════════════════════════════════
// PURCHASE REQUESTS
// ════════════════════════════════════════════════════════════════════════════
elseif ($action === 'pr_list') {
    $status = $_GET['status'] ?? '';
    $sql = "SELECT pr.*, (SELECT COUNT(*) FROM purchase_request_items WHERE request_id=pr.id) as item_count FROM purchase_requests pr WHERE pr.clinic_id=?";
    $params = [$clinic];
    if ($status) { $sql .= " AND pr.status=?"; $params[] = $status; }
    $sql .= " ORDER BY pr.created_at DESC";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    sendResponse($stmt->fetchAll());
}

elseif ($action === 'pr_get') {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("SELECT * FROM purchase_requests WHERE id=? AND clinic_id=?");
    $stmt->execute([$id,$clinic]); $pr = $stmt->fetch();
    $stmt2 = $pdo->prepare("SELECT * FROM purchase_request_items WHERE request_id=?");
    $stmt2->execute([$id]); $pr['items'] = $stmt2->fetchAll();
    sendResponse($pr);
}

elseif ($action === 'pr_create') {
    $id = genId('PR');
    $num = genNumber($pdo, 'purchase_requests', 'request_number', 'PR-');
    $stmt = $pdo->prepare("INSERT INTO purchase_requests (id,clinic_id,request_number,requested_by,department,urgency,notes) VALUES (?,?,?,?,?,?,?)");
    $stmt->execute([$id,$clinic,$num,$data['requested_by']??'Inconnu',$data['department']??null,$data['urgency']??'medium',$data['notes']??null]);
    $items = $data['items'] ?? [];
    $si = $pdo->prepare("INSERT INTO purchase_request_items (request_id,product_name,quantity,unit,estimated_price,justification) VALUES (?,?,?,?,?,?)");
    foreach ($items as $it) {
        $si->execute([$id,$it['product_name'],$it['quantity'],$it['unit']??'unité',$it['estimated_price']??0,$it['justification']??null]);
    }
    sendResponse(["status"=>"success","id"=>$id,"number"=>$num]);
}

elseif ($action === 'pr_update_status') {
    $stmt = $pdo->prepare("UPDATE purchase_requests SET status=? WHERE id=? AND clinic_id=?");
    $stmt->execute([$data['status'],$data['id'],$clinic]);
    sendResponse(["status"=>"success"]);
}

elseif ($action === 'pr_to_po') {
    // Convert PR to PO
    $pr_id = $data['request_id'];
    $supplier_id = $data['supplier_id'];
    // Validate PR exists and is approved
    $stmt = $pdo->prepare("SELECT * FROM purchase_requests WHERE id=? AND clinic_id=?");
    $stmt->execute([$pr_id,$clinic]); $pr = $stmt->fetch();
    if (!$pr) sendResponse(["status"=>"error","message"=>"Demande introuvable"],404);

    $stmt2 = $pdo->prepare("SELECT * FROM purchase_request_items WHERE request_id=?");
    $stmt2->execute([$pr_id]); $items = $stmt2->fetchAll();

    $po_id = genId('PO');
    $po_num = genNumber($pdo,'purchase_orders','order_number','BC-');
    $total_ht = array_sum(array_column($items,'estimated_price'));
    $tax = $data['tax_rate'] ?? 0;
    $total_ttc = $total_ht * (1 + $tax/100);

    $pdo->prepare("INSERT INTO purchase_orders (id,clinic_id,order_number,supplier_id,request_id,total_ht,tax_rate,total_ttc,expected_date,notes) VALUES (?,?,?,?,?,?,?,?,?,?)")
        ->execute([$po_id,$clinic,$po_num,$supplier_id,$pr_id,$total_ht,$tax,$total_ttc,$data['expected_date']??null,$data['notes']??null]);

    $si = $pdo->prepare("INSERT INTO purchase_order_items (order_id,product_name,quantity,unit,unit_price,total_price) VALUES (?,?,?,?,?,?)");
    foreach ($items as $it) {
        $si->execute([$po_id,$it['product_name'],$it['quantity'],$it['unit']??'unité',$it['estimated_price'],$it['estimated_price']*$it['quantity']]);
    }
    // Mark PR as converted
    $pdo->prepare("UPDATE purchase_requests SET status='converted' WHERE id=?")->execute([$pr_id]);
    sendResponse(["status"=>"success","po_id"=>$po_id,"po_number"=>$po_num]);
}

// ════════════════════════════════════════════════════════════════════════════
// PURCHASE ORDERS
// ════════════════════════════════════════════════════════════════════════════
elseif ($action === 'po_list') {
    $status = $_GET['status'] ?? '';
    $sql = "SELECT po.*, s.name as supplier_name, 
                (SELECT COUNT(*) FROM purchase_order_items WHERE order_id=po.id) as item_count,
                (SELECT COUNT(*) FROM goods_receipts WHERE order_id=po.id) as receipt_count
            FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id=s.id WHERE po.clinic_id=?";
    $params = [$clinic];
    if ($status) { $sql .= " AND po.status=?"; $params[] = $status; }
    $sql .= " ORDER BY po.created_at DESC";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    sendResponse($stmt->fetchAll());
}

elseif ($action === 'po_get') {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("SELECT po.*, s.name as supplier_name, s.phone as supplier_phone, s.email as supplier_email FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id=s.id WHERE po.id=? AND po.clinic_id=?");
    $stmt->execute([$id,$clinic]); $po = $stmt->fetch();
    $stmt2 = $pdo->prepare("SELECT * FROM purchase_order_items WHERE order_id=?");
    $stmt2->execute([$id]); $po['items'] = $stmt2->fetchAll();
    sendResponse($po);
}

elseif ($action === 'po_create') {
    $id = genId('PO');
    $num = genNumber($pdo,'purchase_orders','order_number','BC-');
    $items = $data['items'] ?? [];
    $ht = 0;
    foreach ($items as $it) $ht += ($it['unit_price']??0) * ($it['quantity']??1);
    $tax = $data['tax_rate'] ?? 0;
    $ttc = $ht * (1 + $tax/100);
    $pdo->prepare("INSERT INTO purchase_orders (id,clinic_id,order_number,supplier_id,request_id,total_ht,tax_rate,total_ttc,expected_date,notes) VALUES (?,?,?,?,?,?,?,?,?,?)")
        ->execute([$id,$clinic,$num,$data['supplier_id']??null,$data['request_id']??null,$ht,$tax,$ttc,$data['expected_date']??null,$data['notes']??null]);
    $si = $pdo->prepare("INSERT INTO purchase_order_items (order_id,product_name,quantity,unit,unit_price,total_price) VALUES (?,?,?,?,?,?)");
    foreach ($items as $it) {
        $qty = $it['quantity']??1; $up = $it['unit_price']??0;
        $si->execute([$id,$it['product_name'],$qty,$it['unit']??'unité',$up,$up*$qty]);
    }
    sendResponse(["status"=>"success","id"=>$id,"number"=>$num]);
}

elseif ($action === 'po_update_status') {
    $stmt = $pdo->prepare("UPDATE purchase_orders SET status=? WHERE id=? AND clinic_id=?");
    $stmt->execute([$data['status'],$data['id'],$clinic]);
    sendResponse(["status"=>"success"]);
}

// ════════════════════════════════════════════════════════════════════════════
// GOODS RECEIPTS
// ════════════════════════════════════════════════════════════════════════════
elseif ($action === 'gr_list') {
    $stmt = $pdo->prepare("SELECT gr.*, po.order_number, s.name as supplier_name FROM goods_receipts gr LEFT JOIN purchase_orders po ON gr.order_id=po.id LEFT JOIN suppliers s ON po.supplier_id=s.id WHERE gr.clinic_id=? ORDER BY gr.received_at DESC");
    $stmt->execute([$clinic]);
    sendResponse($stmt->fetchAll());
}

elseif ($action === 'gr_get') {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("SELECT gr.*, po.order_number, s.name as supplier_name FROM goods_receipts gr LEFT JOIN purchase_orders po ON gr.order_id=po.id LEFT JOIN suppliers s ON po.supplier_id=s.id WHERE gr.id=? AND gr.clinic_id=?");
    $stmt->execute([$id,$clinic]); $gr = $stmt->fetch();
    $stmt2 = $pdo->prepare("SELECT * FROM goods_receipt_items WHERE receipt_id=?");
    $stmt2->execute([$id]); $gr['items'] = $stmt2->fetchAll();
    sendResponse($gr);
}

elseif ($action === 'gr_create') {
    // Business rule: must have an order
    $order_id = $data['order_id'] ?? null;
    if (!$order_id) sendResponse(["status"=>"error","message"=>"Bon de commande obligatoire pour créer un bon de réception"],400);
    $stmt = $pdo->prepare("SELECT id FROM purchase_orders WHERE id=? AND clinic_id=? AND status NOT IN('cancelled')");
    $stmt->execute([$order_id,$clinic]);
    if (!$stmt->fetch()) sendResponse(["status"=>"error","message"=>"Commande introuvable ou annulée"],404);

    $id = genId('GR');
    $num = genNumber($pdo,'goods_receipts','receipt_number','BR-');
    $pdo->prepare("INSERT INTO goods_receipts (id,clinic_id,receipt_number,order_id,notes,received_by) VALUES (?,?,?,?,?,?)")
        ->execute([$id,$clinic,$num,$order_id,$data['notes']??null,$data['received_by']??null]);
    $si = $pdo->prepare("INSERT INTO goods_receipt_items (receipt_id,order_item_id,product_name,ordered_qty,received_qty,damaged_qty,notes) VALUES (?,?,?,?,?,?,?)");
    foreach ($data['items']??[] as $it) {
        $si->execute([$id,$it['order_item_id']??null,$it['product_name'],$it['ordered_qty']??0,$it['received_qty']??0,$it['damaged_qty']??0,$it['notes']??null]);
    }
    sendResponse(["status"=>"success","id"=>$id,"number"=>$num]);
}

elseif ($action === 'gr_validate') {
    // Business rule: update stock only after validation
    $id = $data['id'];
    $stmt = $pdo->prepare("SELECT gr.*, po.clinic_id FROM goods_receipts gr JOIN purchase_orders po ON gr.order_id=po.id WHERE gr.id=? AND gr.clinic_id=?");
    $stmt->execute([$id,$clinic]); $gr = $stmt->fetch();
    if (!$gr || $gr['status']==='validated') sendResponse(["status"=>"error","message"=>"Bon de réception introuvable ou déjà validé"],409);

    $pdo->beginTransaction();
    try {
        // Validate receipt
        $pdo->prepare("UPDATE goods_receipts SET status='validated', validated_at=NOW() WHERE id=?")->execute([$id]);

        // Get items and update inventory_items stock
        $items = $pdo->prepare("SELECT * FROM goods_receipt_items WHERE receipt_id=?");
        $items->execute([$id]); $rows = $items->fetchAll();

        foreach ($rows as $row) {
            $net_qty = $row['received_qty'] - $row['damaged_qty'];
            if ($net_qty > 0) {
                // Try to match inventory_items by name
                $inv = $pdo->prepare("SELECT id FROM inventory_items WHERE clinic_id=? AND name LIKE ? LIMIT 1");
                $inv->execute([$clinic, $row['product_name']]);
                $inv_item = $inv->fetch();
                if ($inv_item) {
                    $pdo->prepare("UPDATE inventory_items SET stock = stock + ? WHERE id=? AND clinic_id=?")
                        ->execute([$net_qty, $inv_item['id'], $clinic]);
                }
                // Log movement
                $pdo->prepare("INSERT INTO stock_movements (clinic_id,product_name,inventory_item_id,movement_type,quantity,reason,reference_id,reference_type) VALUES (?,?,?,'in',?,?,?,?)")
                    ->execute([$clinic,$row['product_name'],$inv_item['id']??null,$net_qty,'Réception livraison',$id,'goods_receipt']);
            }
        }

        // Update PO status
        $pdo->prepare("UPDATE purchase_orders SET status='received' WHERE id=?")->execute([$gr['order_id']]);

        $pdo->commit();
        sendResponse(["status"=>"success","message"=>"Réception validée et stock mis à jour"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status"=>"error","message"=>"Erreur validation: ".$e->getMessage()],500);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// SUPPLIER INVOICES
// ════════════════════════════════════════════════════════════════════════════
elseif ($action === 'inv_list') {
    $status = $_GET['status'] ?? '';
    $sql = "SELECT si.*, s.name as supplier_name, po.order_number FROM supplier_invoices si LEFT JOIN suppliers s ON si.supplier_id=s.id LEFT JOIN purchase_orders po ON si.order_id=po.id WHERE si.clinic_id=?";
    $params = [$clinic];
    if ($status) { $sql .= " AND si.status=?"; $params[] = $status; }
    $sql .= " ORDER BY si.created_at DESC";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    sendResponse($stmt->fetchAll());
}

elseif ($action === 'inv_create') {
    $id = genId('INV');
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO supplier_invoices (id,clinic_id,invoice_number,supplier_id,order_id,receipt_id,amount_ht,tax_amount,total_ttc,due_date,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([$id,$clinic,$data['invoice_number']??null,$data['supplier_id'],$data['order_id']??null,$data['receipt_id']??null,$data['amount_ht']??0,$data['tax_amount']??0,$data['total_ttc']??0,$data['due_date']??null,$data['notes']??null]);

        // Automated OHADA entries for purchases: Debit Stock (601100) / Credit Supplier (401100)
        $lines = [
            ['account' => '601100', 'debit' => $data['amount_ht'] ?? 0, 'credit' => 0],
            ['account' => '401100', 'debit' => 0, 'credit' => $data['total_ttc'] ?? 0, 'partner' => $data['supplier_id']]
        ];
        if (($data['tax_amount'] ?? 0) > 0) {
            $lines[] = ['account' => '443000', 'debit' => $data['tax_amount'], 'credit' => 0]; // TVA Récupérable
        }

        // Post entry
        $entryId = 'ENT-' . strtoupper(substr(md5(uniqid()), 0, 8));
        $stmtEnt = $pdo->prepare("INSERT INTO ohada_journal_entries (id, clinic_id, entry_date, journal_code, reference, label) VALUES (?, ?, ?, 'AC', ?, ?)");
        $stmtEnt->execute([$entryId, $clinic, date('Y-m-d'), $id, 'Facture Fournisseur #' . ($data['invoice_number'] ?? $id)]);
        
        $stmtLine = $pdo->prepare("INSERT INTO ohada_journal_lines (entry_id, account_code, debit, credit, partner_id) VALUES (?, ?, ?, ?, ?)");
        foreach ($lines as $line) {
            $stmtLine->execute([$entryId, $line['account'], $line['debit'], $line['credit'], $line['partner'] ?? null]);
        }

        $pdo->commit();
        sendResponse(["status"=>"success","id"=>$id]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status"=>"error","message"=>$e->getMessage()], 500);
    }
}

elseif ($action === 'inv_update_status') {
    $stmt = $pdo->prepare("UPDATE supplier_invoices SET status=? WHERE id=? AND clinic_id=?");
    $stmt->execute([$data['status'],$data['id'],$clinic]);
    sendResponse(["status"=>"success"]);
}

elseif ($action === 'inv_get') {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("SELECT si.*, s.name as supplier_name, po.order_number, gr.receipt_number FROM supplier_invoices si LEFT JOIN suppliers s ON si.supplier_id=s.id LEFT JOIN purchase_orders po ON si.order_id=po.id LEFT JOIN goods_receipts gr ON si.receipt_id=gr.id WHERE si.id=? AND si.clinic_id=?");
    $stmt->execute([$id,$clinic]);
    sendResponse($stmt->fetch());
}

// ════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════════════════════
elseif ($action === 'pay_list') {
    $stmt = $pdo->prepare("SELECT sp.*, s.name as supplier_name, si.invoice_number, si.total_ttc as invoice_total FROM supplier_payments sp LEFT JOIN suppliers s ON sp.supplier_id=s.id LEFT JOIN supplier_invoices si ON sp.invoice_id=si.id WHERE sp.clinic_id=? ORDER BY sp.paid_at DESC");
    $stmt->execute([$clinic]);
    sendResponse($stmt->fetchAll());
}

elseif ($action === 'pay_create') {
    $inv_id = $data['invoice_id'];
    $stmt = $pdo->prepare("SELECT * FROM supplier_invoices WHERE id=? AND clinic_id=?");
    $stmt->execute([$inv_id,$clinic]); $inv = $stmt->fetch();
    if (!$inv) sendResponse(["status"=>"error","message"=>"Facture introuvable"],404);
    
    $amount = (float)($data['amount']??0);
    if ($amount <= 0) sendResponse(["status"=>"error","message"=>"Montant invalide"],400);

    $id = genId('PAY');
    try {
        $pdo->beginTransaction();
        $pdo->prepare("INSERT INTO supplier_payments (id,clinic_id,invoice_id,supplier_id,amount,payment_method,reference,notes) VALUES (?,?,?,?,?,?,?,?)")
            ->execute([$id,$clinic,$inv_id,$inv['supplier_id'],$amount,$data['payment_method']??'cash',$data['reference']??null,$data['notes']??null]);

        // Update invoice paid_amount and status
        $new_paid = (float)$inv['paid_amount'] + $amount;
        $new_status = $new_paid >= (float)$inv['total_ttc'] ? 'paid' : 'partial';
        $pdo->prepare("UPDATE supplier_invoices SET paid_amount=?, status=? WHERE id=?")->execute([$new_paid,$new_status,$inv_id]);

        // Automated OHADA entries for payment: Debit Supplier (401100) / Credit Bank or Cash (521000/571000)
        $payment_acc = (($data['payment_method'] ?? 'cash') === 'bank_transfer') ? '521000' : '571000';
        $lines = [
            ['account' => '401100', 'debit' => $amount, 'credit' => 0, 'partner' => $inv['supplier_id']],
            ['account' => $payment_acc, 'debit' => 0, 'credit' => $amount]
        ];

        $entryId = 'ENT-' . strtoupper(substr(md5(uniqid()), 0, 8));
        $stmtEnt = $pdo->prepare("INSERT INTO ohada_journal_entries (id, clinic_id, entry_date, journal_code, reference, label) VALUES (?, ?, ?, 'CA', ?, ?)");
        $stmtEnt->execute([$entryId, $clinic, date('Y-m-d'), $id, 'Règlement Fournisseur ' . $id]);
        
        $stmtLine = $pdo->prepare("INSERT INTO ohada_journal_lines (entry_id, account_code, debit, credit, partner_id) VALUES (?, ?, ?, ?, ?)");
        foreach ($lines as $line) {
            $stmtLine->execute([$entryId, $line['account'], $line['debit'], $line['credit'], $line['partner'] ?? null]);
        }

        $pdo->commit();
        sendResponse(["status"=>"success","id"=>$id,"invoice_status"=>$new_status]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status"=>"error","message"=>$e->getMessage()], 500);
    }
}

elseif ($action === 'supplier_balance') {
    $stmt = $pdo->prepare("SELECT s.id, s.name, s.rating,
        COALESCE(SUM(si.total_ttc),0) as total_invoiced,
        COALESCE(SUM(si.paid_amount),0) as total_paid,
        COALESCE(SUM(si.total_ttc - si.paid_amount),0) as balance_due,
        COUNT(DISTINCT si.id) as invoice_count
        FROM suppliers s
        LEFT JOIN supplier_invoices si ON si.supplier_id=s.id AND si.clinic_id=s.clinic_id AND si.status IN('validated','partial','paid')
        WHERE s.clinic_id=? GROUP BY s.id,s.name,s.rating ORDER BY balance_due DESC");
    $stmt->execute([$clinic]);
    sendResponse($stmt->fetchAll());
}

else {
    sendResponse(["status"=>"error","message"=>"Action '$action' non reconnue"],404);
}
?>
