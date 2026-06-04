<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

// ──────────────────────────────────────────────────────────────────────────────
// Helper: map DB row → frontend JSON (camelCase)
// ──────────────────────────────────────────────────────────────────────────────
function mapEmployee(array $e): array {
    return [
        "id"                 => $e['id'],
        "clinicId"           => $e['clinic_id'],
        // Identity
        "name"               => $e['name'],
        "firstName"          => $e['first_name'],
        "gender"             => $e['gender'] ?? 'M',
        "birthDate"          => $e['birth_date'],
        "birthPlace"         => $e['birth_place'],
        "nationality"        => $e['nationality'] ?? 'Camerounaise',
        "maritalStatus"      => $e['marital_status'] ?? 'Célibataire',
        "childrenCount"      => (int)($e['children_count'] ?? 0),
        "address"            => $e['address'],
        "phone"              => $e['phone'],
        "email"              => $e['email'],
        // Official numbers
        "niu"                => $e['niu'],
        "cnssNumber"         => $e['cnss_number'],
        "idCardType"         => $e['id_card_type'] ?? 'CNI',
        "idCardNumber"       => $e['id_card_number'],
        "idCardExpiry"       => $e['id_card_expiry'],
        // Banking
        "rib"                => $e['rib'],
        "bankName"           => $e['bank_name'],
        "bankAccount"        => $e['bank_account'],
        // Emergency contact
        "emergencyName"      => $e['emergency_name'],
        "emergencyPhone"     => $e['emergency_phone'],
        "emergencyRelation"  => $e['emergency_relation'],
        // Position & contract
        "department"         => $e['department'],
        "position"           => $e['position'],
        "echelon"            => $e['echelon'],
        "contractType"       => $e['contract_type'] ?? 'CDI',
        "contractEndDate"    => $e['contract_end_date'],
        "hireDate"           => $e['hire_date'],
        "status"             => $e['status'],
        "taxRegime"          => $e['tax_regime'] ?? 'salarie_prive',
        // Salary
        "baseSalary"         => (float)($e['base_salary'] ?? 0),
        "transportAllowance" => (float)($e['transport_allowance'] ?? 0),
        "housingAllowance"   => (float)($e['housing_allowance'] ?? 0),
        "mealAllowance"      => (float)($e['meal_allowance'] ?? 0),
        // Meta
        "notes"              => $e['notes'],
        "photoUrl"           => $e['photo_url'],
        "createdAt"          => $e['created_at'],
    ];
}

// ──────────────────────────────────────────────────────────────────────────────
// GET
// ──────────────────────────────────────────────────────────────────────────────
if ($method === 'GET') {

    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM employees WHERE clinic_id = ? ORDER BY name, first_name");
        $stmt->execute([$clinicId]);
        $rows = $stmt->fetchAll();
        sendResponse(array_map('mapEmployee', $rows));

    } elseif ($action === 'get' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = ? AND clinic_id = ?");
        $stmt->execute([$_GET['id'], $clinicId]);
        $row = $stmt->fetch();
        if (!$row) sendResponse(['status' => 'error', 'message' => 'Employé introuvable'], 404);
        sendResponse(mapEmployee($row));

    } elseif ($action === 'list_documents') {
        $empId = $_GET['employee_id'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM user_docs WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$clinicId, $empId]);
        sendResponse($stmt->fetchAll());
    }

// ──────────────────────────────────────────────────────────────────────────────
// POST
// ──────────────────────────────────────────────────────────────────────────────
} elseif ($method === 'POST') {
    $data = getRequestData();

    if ($action === 'add_document') {
        $id = "DOC-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO user_docs (id, tenant_id, user_id, type, name, file_url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['employee_id'], $data['type'], $data['name'], $data['file_url']]);
        sendResponse(["status" => "success", "id" => $id]);

    } else {
        // Add employee
        if (empty($data['name']) || empty($data['clinicId'])) {
            sendResponse(["status" => "error", "message" => "Données manquantes (nom, clinicId)"], 400);
        }

        $id = "EMP-" . time() . rand(100,999);
        $sql = "INSERT INTO employees (
            id, clinic_id, name, first_name, gender, birth_date, birth_place, nationality,
            marital_status, children_count, address, phone, email,
            niu, cnss_number, id_card_type, id_card_number, id_card_expiry,
            rib, bank_name, bank_account,
            emergency_name, emergency_phone, emergency_relation,
            department, position, echelon, contract_type, contract_end_date,
            hire_date, status, tax_regime,
            base_salary, transport_allowance, housing_allowance, meal_allowance,
            notes
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?
        )";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $id,
            $data['clinicId'],
            strtoupper($data['name']),
            $data['firstName'] ?? '',
            $data['gender'] ?? 'M',
            $data['birthDate'] ?? null,
            $data['birthPlace'] ?? null,
            $data['nationality'] ?? 'Camerounaise',
            $data['maritalStatus'] ?? 'Célibataire',
            (int)($data['childrenCount'] ?? 0),
            $data['address'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['niu'] ?? null,
            $data['cnssNumber'] ?? null,
            $data['idCardType'] ?? 'CNI',
            $data['idCardNumber'] ?? null,
            $data['idCardExpiry'] ?? null,
            $data['rib'] ?? null,
            $data['bankName'] ?? null,
            $data['bankAccount'] ?? null,
            $data['emergencyName'] ?? null,
            $data['emergencyPhone'] ?? null,
            $data['emergencyRelation'] ?? null,
            $data['department'] ?? 'Général',
            $data['position'] ?? '',
            $data['echelon'] ?? null,
            $data['contractType'] ?? 'CDI',
            $data['contractEndDate'] ?? null,
            $data['hireDate'] ?? date('Y-m-d'),
            $data['status'] ?? 'active',
            $data['taxRegime'] ?? 'salarie_prive',
            (float)($data['baseSalary'] ?? 0),
            (float)($data['transportAllowance'] ?? 0),
            (float)($data['housingAllowance'] ?? 0),
            (float)($data['mealAllowance'] ?? 0),
            $data['notes'] ?? null,
        ]);

        sendResponse(["status" => "success", "id" => $id]);
    }

// ──────────────────────────────────────────────────────────────────────────────
// PUT — Update employee
// ──────────────────────────────────────────────────────────────────────────────
} elseif ($method === 'PUT') {
    $data = getRequestData();
    $empId = $_GET['id'] ?? $data['id'] ?? null;
    if (!$empId) sendResponse(["status" => "error", "message" => "ID manquant"], 400);

    $sql = "UPDATE employees SET
        name = ?, first_name = ?, gender = ?, birth_date = ?, birth_place = ?, nationality = ?,
        marital_status = ?, children_count = ?, address = ?, phone = ?, email = ?,
        niu = ?, cnss_number = ?, id_card_type = ?, id_card_number = ?, id_card_expiry = ?,
        rib = ?, bank_name = ?, bank_account = ?,
        emergency_name = ?, emergency_phone = ?, emergency_relation = ?,
        department = ?, position = ?, echelon = ?, contract_type = ?, contract_end_date = ?,
        hire_date = ?, status = ?, tax_regime = ?,
        base_salary = ?, transport_allowance = ?, housing_allowance = ?, meal_allowance = ?,
        notes = ?
        WHERE id = ? AND clinic_id = ?";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        strtoupper($data['name'] ?? ''),
        $data['firstName'] ?? '',
        $data['gender'] ?? 'M',
        $data['birthDate'] ?? null,
        $data['birthPlace'] ?? null,
        $data['nationality'] ?? 'Camerounaise',
        $data['maritalStatus'] ?? 'Célibataire',
        (int)($data['childrenCount'] ?? 0),
        $data['address'] ?? null,
        $data['phone'] ?? null,
        $data['email'] ?? null,
        $data['niu'] ?? null,
        $data['cnssNumber'] ?? null,
        $data['idCardType'] ?? 'CNI',
        $data['idCardNumber'] ?? null,
        $data['idCardExpiry'] ?? null,
        $data['rib'] ?? null,
        $data['bankName'] ?? null,
        $data['bankAccount'] ?? null,
        $data['emergencyName'] ?? null,
        $data['emergencyPhone'] ?? null,
        $data['emergencyRelation'] ?? null,
        $data['department'] ?? 'Général',
        $data['position'] ?? '',
        $data['echelon'] ?? null,
        $data['contractType'] ?? 'CDI',
        $data['contractEndDate'] ?? null,
        $data['hireDate'] ?? date('Y-m-d'),
        $data['status'] ?? 'active',
        $data['taxRegime'] ?? 'salarie_prive',
        (float)($data['baseSalary'] ?? 0),
        (float)($data['transportAllowance'] ?? 0),
        (float)($data['housingAllowance'] ?? 0),
        (float)($data['mealAllowance'] ?? 0),
        $data['notes'] ?? null,
        $empId,
        $clinicId,
    ]);

    sendResponse(["status" => "success"]);

// ──────────────────────────────────────────────────────────────────────────────
// DELETE
// ──────────────────────────────────────────────────────────────────────────────
} elseif ($method === 'DELETE') {
    $empId = $_GET['id'] ?? null;
    if (!$empId) sendResponse(["status" => "error", "message" => "ID manquant"], 400);
    $stmt = $pdo->prepare("UPDATE employees SET status = 'terminated' WHERE id = ? AND clinic_id = ?");
    $stmt->execute([$empId, $clinicId]);
    sendResponse(["status" => "success"]);
}
?>
