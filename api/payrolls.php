<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM payrolls WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        $payrolls = $stmt->fetchAll();
        
        $full_payrolls = [];
        foreach($payrolls as $p) {
            $stmt_items = $pdo->prepare("SELECT * FROM payroll_items WHERE payroll_id = ?");
            $stmt_items->execute([$p['id']]);
            $items = $stmt_items->fetchAll();
            
            $bonuses = [];
            $deductions = [];
            foreach($items as $item) {
                if ($item['type'] === 'bonus') $bonuses[] = ["name" => $item['name'], "amount" => (float)$item['amount']];
                else $deductions[] = ["name" => $item['name'], "amount" => (float)$item['amount']];
            }
            
            $full_payrolls[] = [
                "id"          => $p['id'],
                "clinicId"    => $p['clinic_id'],
                "employeeId"  => $p['employee_id'],
                "month"       => $p['month'],
                "baseSalary"  => (float)$p['base_salary'],
                "netSalary"   => (float)$p['net_salary'],
                "status"      => $p['status'],
                "paymentDate" => $p['payment_date'],
                "bonuses"     => $bonuses,
                "deductions"  => $deductions,
            ];
        }
        sendResponse($full_payrolls);
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['employeeId'] || !$data['clinicId']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $pdo->beginTransaction();
    try {
        $id = "PAY-" . time();
        $stmt = $pdo->prepare("INSERT INTO payrolls (id, clinic_id, employee_id, month, base_salary, net_salary, status, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $data['clinicId'],
            $data['employeeId'],
            $data['month'],
            $data['baseSalary'],
            $data['netSalary'],
            $data['status'] ?? 'draft',
            $data['paymentDate'] ?? date('Y-m-d')
        ]);

        if (isset($data['bonuses'])) {
            $stmt_item = $pdo->prepare("INSERT INTO payroll_items (payroll_id, type, name, amount) VALUES (?, 'bonus', ?, ?)");
            foreach($data['bonuses'] as $b) {
                $stmt_item->execute([$id, $b['name'], $b['amount']]);
            }
        }

        if (isset($data['deductions'])) {
            $stmt_item = $pdo->prepare("INSERT INTO payroll_items (payroll_id, type, name, amount) VALUES (?, 'deduction', ?, ?)");
            foreach($data['deductions'] as $d) {
                $stmt_item->execute([$id, $d['name'], $d['amount']]);
            }
        }

        $pdo->commit();
        sendResponse(["status" => "success", "id" => $id]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
    }
}
?>

