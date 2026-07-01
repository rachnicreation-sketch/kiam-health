<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = ensureClinicForTenant($pdo, $auth['tenant_id'] ?? null);

// ──────────────────────────────────────────────────────────────────────────────
// CAMEROON PAYROLL ENGINE — Taux officiels 2024
// ──────────────────────────────────────────────────────────────────────────────
// CNSS Part salariale : 2.8% du salaire brut plafonné à 750 000 CFA
// CNSS Part patronale : 14.7% (dont CR 4.2%, AT 1.75%, PF 7%, Logement 1.5% + taxe emploi 0.25%)
// IRPP : barème progressif sur revenu imposable = Brut - CNSS_emp - 500*enfants
// CAC (Centimes Additionnels Communaux) = 10% de l'IRPP

function calculateIRPP(float $revenuImposable, int $childrenCount = 0): float {
    // Déduction pour charges de famille : 500 CFA/part (Cameroun simplifié)
    $parts = 1 + ($childrenCount * 0.5);
    $qi = $revenuImposable / $parts; // quotient individuel annualisé (mensuel x12)
    $annuel = $revenuImposable * 12;

    // Barème IRPP annuel Cameroun (simplifié)
    // Tranche 1 : 0–2 000 000 → 10%
    // Tranche 2 : 2 000 001–3 000 000 → 15%
    // Tranche 3 : 3 000 001–5 000 000 → 25%
    // Tranche 4 : > 5 000 000 → 35%
    $irppAnnuel = 0;
    if ($annuel <= 0) return 0;
    if ($annuel <= 2000000) {
        $irppAnnuel = $annuel * 0.10;
    } elseif ($annuel <= 3000000) {
        $irppAnnuel = 200000 + ($annuel - 2000000) * 0.15;
    } elseif ($annuel <= 5000000) {
        $irppAnnuel = 350000 + ($annuel - 3000000) * 0.25;
    } else {
        $irppAnnuel = 850000 + ($annuel - 5000000) * 0.35;
    }

    return round($irppAnnuel / 12, 0); // mensuel
}

function computePayroll(array $data, array $emp): array {
    $base        = (float)($data['baseSalary'] ?? $emp['base_salary'] ?? 0);
    $transport   = (float)($data['transportAllowance'] ?? $emp['transport_allowance'] ?? 0);
    $housing     = (float)($data['housingAllowance'] ?? $emp['housing_allowance'] ?? 0);
    $meal        = (float)($data['mealAllowance'] ?? $emp['meal_allowance'] ?? 0);
    $bonusesTotal= (float)($data['bonusesTotal'] ?? 0);
    $advance     = (float)($data['advanceDeduction'] ?? 0);
    $otherDeduct = (float)($data['otherDeductions'] ?? 0);
    $childrenCount = (int)($emp['children_count'] ?? 0);
    $taxRegime   = $emp['tax_regime'] ?? 'salarie_prive';

    // Salaire brut = base + primes + indemnités
    $gross = $base + $transport + $housing + $meal + $bonusesTotal;

    // ─── CNSS Salariale : 2.8% plafonné à 750 000 ────────────────────────────
    $cnssBase     = min($gross, 750000);
    $cnssEmployee = ($taxRegime !== 'exonere') ? round($cnssBase * 0.028, 0) : 0;

    // ─── Revenu imposable pour IRPP ───────────────────────────────────────────
    // Note: allocations de transport (jusqu'à 26 250/mois) et logement partiellement exonérées
    $exonerationTransport = min($transport, 26250);
    $revenuImposable = max(0, $gross - $cnssEmployee - $exonerationTransport);

    // ─── IRPP ─────────────────────────────────────────────────────────────────
    $irpp = ($taxRegime === 'salarie_prive') ? calculateIRPP($revenuImposable, $childrenCount) : 0;

    // ─── CAC = 10% IRPP ───────────────────────────────────────────────────────
    $cac = round($irpp * 0.10, 0);

    // ─── Total retenues salariales ────────────────────────────────────────────
    $totalDeductions = $cnssEmployee + $irpp + $cac + $advance + $otherDeduct;

    // ─── Net à Payer ──────────────────────────────────────────────────────────
    $netSalary = max(0, $gross - $totalDeductions);

    // ─── CNSS Patronale (sur salaire brut plafonné à 750 000) ────────────────
    $cnssEmployer  = round($cnssBase * 0.0175, 0); // AT accidents travail 1.75%
    $crEmployer    = round($cnssBase * 0.042,  0);  // Crédit retraite 4.2%
    $pfEmployer    = round($cnssBase * 0.070,  0);  // Prestations familiales 7%
    $logEmployer   = round($cnssBase * 0.015,  0);  // Logement patronal 1.5%
    $taxeEmploi    = round($cnssBase * 0.0025, 0);  // Taxe emploi 0.25%
    $totalCnssEmp  = $cnssEmployer + $crEmployer + $pfEmployer + $logEmployer + $taxeEmploi;

    // ─── Coût Total Employeur (CTE / TOL) ────────────────────────────────────
    $totalLaborCost = $gross + $totalCnssEmp;

    return [
        'grossSalary'       => round($gross, 0),
        'transportAllowance'=> $transport,
        'housingAllowance'  => $housing,
        'mealAllowance'     => $meal,
        'bonusesTotal'      => $bonusesTotal,
        'cnssEmployee'      => $cnssEmployee,
        'irpp'              => $irpp,
        'cac'               => $cac,
        'advanceDeduction'  => $advance,
        'deductionsTotal'   => round($totalDeductions, 0),
        'netSalary'         => round($netSalary, 0),
        // Employer side
        'cnssEmployer'      => round($totalCnssEmp, 0),
        'crEmployer'        => $crEmployer,
        'atEmployer'        => $cnssEmployer,
        'pfEmployer'        => $pfEmployer,
        'totalLaborCost'    => round($totalLaborCost, 0),
        // Detail items for payroll_items table
        'items' => [
            // Gains
            ['type' => 'bonus',        'name' => 'Salaire de Base',           'amount' => $base],
            ['type' => 'allowance',    'name' => 'Indemnité de Transport',     'amount' => $transport],
            ['type' => 'allowance',    'name' => 'Indemnité de Logement',      'amount' => $housing],
            ['type' => 'allowance',    'name' => 'Panier Repas',               'amount' => $meal],
            ['type' => 'bonus',        'name' => 'Primes Diverses',            'amount' => $bonusesTotal],
            // Retenues
            ['type' => 'cnss_employee','name' => 'CNSS Part Salariale (2.8%)', 'amount' => $cnssEmployee],
            ['type' => 'irpp',         'name' => 'IRPP (Retenu à la source)',   'amount' => $irpp],
            ['type' => 'tax',          'name' => 'CAC (10% IRPP)',              'amount' => $cac],
            ['type' => 'deduction',    'name' => 'Avance sur Salaire',          'amount' => $advance],
            // Patronal (info)
            ['type' => 'cnss_employer','name' => 'CNSS Part Patronale',         'amount' => $totalCnssEmp],
        ]
    ];
}

// ──────────────────────────────────────────────────────────────────────────────
// GET
// ──────────────────────────────────────────────────────────────────────────────
if ($method === 'GET') {

    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM payrolls WHERE clinic_id = ? ORDER BY month DESC, created_at DESC");
        $stmt->execute([$clinicId]);
        $payrolls = $stmt->fetchAll();

        $full = [];
        foreach ($payrolls as $p) {
            $stmt_items = $pdo->prepare("SELECT * FROM payroll_items WHERE payroll_id = ?");
            $stmt_items->execute([$p['id']]);
            $items = $stmt_items->fetchAll();

            $bonuses = $deductions = [];
            foreach ($items as $item) {
                if (in_array($item['type'], ['bonus', 'allowance'])) {
                    $bonuses[] = ['name' => $item['name'], 'amount' => (float)$item['amount'], 'type' => $item['type']];
                } else {
                    $deductions[] = ['name' => $item['name'], 'amount' => (float)$item['amount'], 'type' => $item['type']];
                }
            }

            $full[] = [
                "id"               => $p['id'],
                "clinicId"         => $p['clinic_id'],
                "employeeId"       => $p['employee_id'],
                "month"            => $p['month'],
                "baseSalary"       => (float)$p['base_salary'],
                "grossSalary"      => (float)($p['gross_salary'] ?? $p['base_salary']),
                "transportAllowance"=> (float)($p['transport_allowance'] ?? 0),
                "housingAllowance" => (float)($p['housing_allowance'] ?? 0),
                "mealAllowance"    => (float)($p['meal_allowance'] ?? 0),
                "bonusesTotal"     => (float)($p['bonuses_total'] ?? 0),
                "cnssEmployee"     => (float)($p['cnss_employee'] ?? 0),
                "irpp"             => (float)($p['irpp'] ?? 0),
                "cac"              => (float)($p['cac'] ?? 0),
                "advanceDeduction" => (float)($p['advance_deduction'] ?? 0),
                "deductionsTotal"  => (float)($p['deductions_total'] ?? 0),
                "netSalary"        => (float)$p['net_salary'],
                "cnssEmployer"     => (float)($p['cnss_employer'] ?? 0),
                "crEmployer"       => (float)($p['cr_employer'] ?? 0),
                "atEmployer"       => (float)($p['at_employer'] ?? 0),
                "pfEmployer"       => (float)($p['pf_employer'] ?? 0),
                "totalLaborCost"   => (float)($p['total_labor_cost'] ?? 0),
                "status"           => $p['status'],
                "paymentDate"      => $p['payment_date'],
                "notes"            => $p['notes'],
                "bonuses"          => $bonuses,
                "deductions"       => $deductions,
            ];
        }
        sendResponse($full);

    } elseif ($action === 'simulate') {
        // Dry-run calculation without saving
        $data = $_GET;
        $empId = $data['employeeId'] ?? null;
        if (!$empId) sendResponse(['status' => 'error', 'message' => 'employeeId requis'], 400);
        $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = ? AND clinic_id = ?");
        $stmt->execute([$empId, $clinicId]);
        $emp = $stmt->fetch();
        if (!$emp) sendResponse(['status' => 'error', 'message' => 'Employé introuvable'], 404);
        sendResponse(computePayroll($data, $emp));
    }

// ──────────────────────────────────────────────────────────────────────────────
// POST — Create payroll
// ──────────────────────────────────────────────────────────────────────────────
} elseif ($method === 'POST') {
    $data = getRequestData();

    if (empty($data['employeeId']) || empty($data['clinicId'])) {
        sendResponse(["status" => "error", "message" => "employeeId et clinicId requis"], 400);
    }

    // Load employee data
    $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = ? AND clinic_id = ?");
    $stmt->execute([$data['employeeId'], $data['clinicId']]);
    $emp = $stmt->fetch();
    if (!$emp) sendResponse(["status" => "error", "message" => "Employé introuvable"], 404);

    // Compute all payroll figures
    $calc = computePayroll($data, $emp);

    $pdo->beginTransaction();
    try {
        $id = "PAY-" . date('Ymd') . "-" . rand(1000, 9999);

        $stmt = $pdo->prepare("INSERT INTO payrolls (
            id, clinic_id, employee_id, month,
            base_salary, gross_salary,
            transport_allowance, housing_allowance, meal_allowance, bonuses_total,
            cnss_employee, irpp, cac, advance_deduction, deductions_total,
            net_salary,
            cnss_employer, cr_employer, at_employer, pf_employer, total_labor_cost,
            status, payment_date, notes
        ) VALUES (
            ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?
        )");

        $stmt->execute([
            $id, $data['clinicId'], $data['employeeId'], $data['month'],
            (float)($data['baseSalary'] ?? $emp['base_salary']),
            $calc['grossSalary'],
            $calc['transportAllowance'],
            $calc['housingAllowance'],
            $calc['mealAllowance'],
            $calc['bonusesTotal'],
            $calc['cnssEmployee'],
            $calc['irpp'],
            $calc['cac'],
            $calc['advanceDeduction'],
            $calc['deductionsTotal'],
            $calc['netSalary'],
            $calc['cnssEmployer'],
            $calc['crEmployer'],
            $calc['atEmployer'],
            $calc['pfEmployer'],
            $calc['totalLaborCost'],
            $data['status'] ?? 'paid',
            $data['paymentDate'] ?? date('Y-m-d'),
            $data['notes'] ?? null,
        ]);

        // Insert payroll line items
        $stmt_item = $pdo->prepare("INSERT INTO payroll_items (payroll_id, type, name, amount) VALUES (?, ?, ?, ?)");
        foreach ($calc['items'] as $item) {
            if ((float)$item['amount'] != 0) {
                $stmt_item->execute([$id, $item['type'], $item['name'], $item['amount']]);
            }
        }
        // Custom bonuses passed by frontend
        if (!empty($data['customBonuses'])) {
            foreach ($data['customBonuses'] as $b) {
                $stmt_item->execute([$id, 'bonus', $b['name'], $b['amount']]);
            }
        }
        // Custom deductions
        if (!empty($data['customDeductions'])) {
            foreach ($data['customDeductions'] as $d) {
                $stmt_item->execute([$id, 'deduction', $d['name'], $d['amount']]);
            }
        }

        $pdo->commit();
        sendResponse(["status" => "success", "id" => $id, "calc" => $calc]);

    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
    }
}
?>
