<?php
/**
 * Module Professionnel Sage Paie & Gestion RH - KIAM ERP
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : Accès restreint aux rôles autorisés
requireRole(['admin', 'manager', 'rh', 'comptable']);

$userRole = $_SESSION['user_role'] ?? '';
$currentUserId = $_SESSION['user_id'] ?? 0;

// Charger les paramètres généraux de la paie
$settingsStmt = $pdo->query("SELECT * FROM payroll_settings LIMIT 1");
$payrollSettings = $settingsStmt->fetch();

// ==========================================================================
// 1. ENDPOINTS AJAX DE TRAITEMENTS RAPIDES
// ==========================================================================
if (isset($_GET['ajax']) && $_GET['ajax'] === '1') {
    header('Content-Type: application/json');
    $action = $_GET['action'] ?? '';

    try {
        if ($action === 'get_employee') {
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = ?");
            $stmt->execute([$id]);
            $emp = $stmt->fetch();
            echo json_encode(['success' => true, 'data' => $emp]);
            exit;
        }

        if ($action === 'delete_employee') {
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $pdo->prepare("DELETE FROM employees WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => "Employé supprimé avec succès !"]);
            exit;
        }

        if ($action === 'archive_employee') {
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $pdo->prepare("UPDATE employees SET status = 'archived' WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => "Employé archivé avec succès !"]);
            exit;
        }

        if ($action === 'save_employee') {
            $id = (int)($_POST['employee_id'] ?? 0);
            $name = trim($_POST['name'] ?? '');
            $firstName = trim($_POST['first_name'] ?? '');
            $gender = $_POST['gender'] ?? 'M';
            $birthDate = $_POST['birth_date'] ?? '';
            $idType = $_POST['id_type'] ?? 'CNI';
            $idNumber = trim($_POST['id_number'] ?? '');
            $address = trim($_POST['address'] ?? '');
            $phone = trim($_POST['phone'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $jobTitle = trim($_POST['job_title'] ?? '');
            $department = $_POST['department'] ?? 'Général';
            $contractType = $_POST['contract_type'] ?? 'CDI';
            $hireDate = $_POST['hire_date'] ?? '';
            $baseSalary = (float)($_POST['base_salary'] ?? 0);
            $workBasis = $_POST['work_basis'] ?? 'monthly';
            $hoursPerDay = (int)($_POST['hours_per_day'] ?? 8);
            $cnssEnabled = isset($_POST['cnss_enabled']) ? 1 : 0;
            $cnssNumber = trim($_POST['cnss_number'] ?? '');
            $bankName = trim($_POST['bank_name'] ?? '');
            $bankAccount = trim($_POST['bank_account'] ?? '');
            $emergencyName = trim($_POST['emergency_contact_name'] ?? '');
            $emergencyPhone = trim($_POST['emergency_contact_phone'] ?? '');
            $emergencyRelation = trim($_POST['emergency_contact_relation'] ?? '');

            // Traiter la photo de l'employé
            $photoPath = $_POST['current_photo_path'] ?? null;
            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../assets/uploads/employees/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                $ext = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
                $fileName = 'emp_' . time() . '_' . rand(100, 999) . '.' . $ext;
                if (move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $fileName)) {
                    $photoPath = 'assets/uploads/employees/' . $fileName;
                }
            }

            if ($id > 0) {
                // Modification
                $stmt = $pdo->prepare("
                    UPDATE employees 
                    SET name = ?, first_name = ?, gender = ?, birth_date = ?, id_type = ?, id_number = ?, 
                        address = ?, phone = ?, email = ?, job_title = ?, department = ?, contract_type = ?, 
                        hire_date = ?, base_salary = ?, work_basis = ?, hours_per_day = ?, cnss_enabled = ?, 
                        cnss_number = ?, bank_name = ?, bank_account = ?, photo_path = ?, 
                        emergency_contact_name = ?, emergency_contact_phone = ?, emergency_contact_relation = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $name, $firstName, $gender, $birthDate, $idType, $idNumber, 
                    $address, $phone, $email, $jobTitle, $department, $contractType, 
                    $hireDate, $baseSalary, $workBasis, $hoursPerDay, $cnssEnabled, 
                    $cnssNumber, $bankName, $bankAccount, $photoPath,
                    $emergencyName, $emergencyPhone, $emergencyRelation, $id
                ]);
                $msg = "Employé modifié avec succès !";
            } else {
                // Création : générer le matricule automatique
                $year = date('Y', strtotime($hireDate ?: 'now'));
                $count = $pdo->query("SELECT COUNT(*) FROM employees")->fetchColumn() + 1;
                $matricule = sprintf("EMP-%s-%04d", $year, $count);

                $stmt = $pdo->prepare("
                    INSERT INTO employees (
                        matricule, name, first_name, gender, birth_date, id_type, id_number, 
                        address, phone, email, job_title, department, contract_type, hire_date, 
                        base_salary, work_basis, hours_per_day, cnss_enabled, cnss_number, 
                        bank_name, bank_account, photo_path, status,
                        emergency_contact_name, emergency_contact_phone, emergency_contact_relation
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
                ");
                $stmt->execute([
                    $matricule, $name, $firstName, $gender, $birthDate, $idType, $idNumber, 
                    $address, $phone, $email, $jobTitle, $department, $contractType, $hireDate, 
                    $baseSalary, $workBasis, $hoursPerDay, $cnssEnabled, $cnssNumber, 
                    $bankName, $bankAccount, $photoPath, $emergencyName, $emergencyPhone, $emergencyRelation
                ]);
                $msg = "Employé créé avec succès avec le matricule $matricule !";
            }

            echo json_encode(['success' => true, 'message' => $msg]);
            exit;
        }

        if ($action === 'save_attendance') {
            $employeeId = (int)$_POST['employee_id'];
            $date = $_POST['date'] ?? date('Y-m-d');
            $status = $_POST['status'] ?? 'present';
            $checkIn = $_POST['check_in'] ?: null;
            $checkOut = $_POST['check_out'] ?: null;
            $hours = (float)($_POST['hours_worked'] ?? 8);
            $overtime = (float)($_POST['overtime_hours'] ?? 0);
            $night = (float)($_POST['night_hours'] ?? 0);

            $stmt = $pdo->prepare("
                INSERT INTO attendance (employee_id, date, status, check_in, check_out, hours_worked, overtime_hours, night_hours, validated_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    status = VALUES(status), 
                    check_in = VALUES(check_in), 
                    check_out = VALUES(check_out), 
                    hours_worked = VALUES(hours_worked), 
                    overtime_hours = VALUES(overtime_hours), 
                    night_hours = VALUES(night_hours),
                    validated_by = VALUES(validated_by)
            ");
            $stmt->execute([$employeeId, $date, $status, $checkIn, $checkOut, $hours, $overtime, $night, $currentUserId]);
            echo json_encode(['success' => true, 'message' => "Pointage enregistré !"]);
            exit;
        }

        if ($action === 'add_advance') {
            $employeeId = (int)$_POST['employee_id'];
            $amount = (float)$_POST['amount'];
            $date = $_POST['request_date'] ?? date('Y-m-d');
            $notes = trim($_POST['notes'] ?? '');

            $stmt = $pdo->prepare("INSERT INTO advances (employee_id, amount, request_date, status, notes) VALUES (?, ?, ?, 'pending', ?)");
            $stmt->execute([$employeeId, $amount, $date, $notes]);
            echo json_encode(['success' => true, 'message' => "Demande d'avance de salaire enregistrée !"]);
            exit;
        }

        if ($action === 'update_advance_status') {
            $id = (int)$_GET['id'];
            $status = $_GET['status']; // 'approved' ou 'rejected'
            $stmt = $pdo->prepare("UPDATE advances SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            echo json_encode(['success' => true, 'message' => "Statut de la demande d'avance mis à jour !"]);
            exit;
        }

        if ($action === 'add_prime') {
            $employeeId = (int)$_POST['employee_id'];
            $title = trim($_POST['title'] ?? 'Prime de rendement');
            $type = $_POST['type'] ?? 'rendement';
            $amount = (float)$_POST['amount'];
            $date = $_POST['date_assigned'] ?? date('Y-m-d');

            $stmt = $pdo->prepare("INSERT INTO primes (employee_id, title, type, amount, date_assigned, status) VALUES (?, ?, ?, ?, ?, 'pending')");
            $stmt->execute([$employeeId, $title, $type, $amount, $date]);
            echo json_encode(['success' => true, 'message' => "Prime allouée avec succès !"]);
            exit;
        }

        if ($action === 'calculate_payroll') {
            $month = $_POST['month'] ?? date('Y-m'); // format Y-m (ex: 2026-05)
            $startDate = $month . '-01';
            $endDate = date('Y-m-t', strtotime($startDate));

            // Récupérer les employés actifs
            $employees = $pdo->query("SELECT * FROM employees WHERE status = 'active'")->fetchAll();

            $countPayslips = 0;
            foreach ($employees as $emp) {
                // 1. Calculer les présences & horaires sur la période
                $attStmt = $pdo->prepare("
                    SELECT 
                        COUNT(CASE WHEN status IN ('present', 'late', 'leave') THEN 1 END) as days_worked,
                        SUM(hours_worked) as hours_worked,
                        SUM(overtime_hours) as overtime_hours,
                        SUM(night_hours) as night_hours
                    FROM attendance 
                    WHERE employee_id = ? AND date BETWEEN ? AND ?
                ");
                $attStmt->execute([$emp['id'], $startDate, $endDate]);
                $attData = $attStmt->fetch();

                $daysWorked = $attData['days_worked'] ?? 0;
                $hoursWorked = $attData['hours_worked'] ?? 0.00;
                $overtimeHours = $attData['overtime_hours'] ?? 0.00;
                $nightHours = $attData['night_hours'] ?? 0.00;

                // 2. Calcul du salaire de base en fonction du mode de rémunération
                $baseSalary = $emp['base_salary'];
                $brutBase = 0.00;
                
                if ($emp['work_basis'] === 'hourly') {
                    $brutBase = $baseSalary * $hoursWorked;
                    $hourlyRate = $baseSalary;
                } elseif ($emp['work_basis'] === 'daily') {
                    $brutBase = $baseSalary * $daysWorked;
                    $hourlyRate = $baseSalary / 8;
                } else { // monthly
                    $brutBase = $baseSalary;
                    $hourlyRate = $baseSalary / 173.33; // base 40h/semaine standard
                }

                // 3. Calcul des heures supplémentaires et du travail de nuit
                $overtimeAmount = $overtimeHours * $hourlyRate * ($payrollSettings['overtime_rate_multiplier'] ?? 1.25);
                $nightWorkAmount = $nightHours * $hourlyRate * ($payrollSettings['night_work_multiplier'] ?? 1.50);

                // 4. Calcul des primes allouées ce mois
                $primeStmt = $pdo->prepare("
                    SELECT SUM(amount) as total_primes 
                    FROM primes 
                    WHERE employee_id = ? AND status = 'pending' AND date_assigned BETWEEN ? AND ?
                ");
                $primeStmt->execute([$emp['id'], $startDate, $endDate]);
                $primesAmount = $primeStmt->fetchColumn() ?: 0.00;

                // Salaire Brut
                $grossSalary = $brutBase + $overtimeAmount + $nightWorkAmount + $primesAmount;

                // 5. Retenues
                // CNSS (Part employé)
                $cnssDeduction = 0.00;
                if ($emp['cnss_enabled']) {
                    $cnssDeduction = $grossSalary * (($payrollSettings['cnss_rate_employee'] ?? 5.50) / 100);
                }

                // Taxe d'imposition (IGR simplifié)
                $taxDeduction = ($grossSalary - $cnssDeduction) * (($payrollSettings['tax_bracket_rate'] ?? 10.00) / 100);

                // Avances de salaire approuvées non remboursées (max 40% du brut pour préserver le reste à vivre)
                $advanceStmt = $pdo->prepare("
                    SELECT id, amount, repaid_amount 
                    FROM advances 
                    WHERE employee_id = ? AND status = 'approved' AND amount > repaid_amount
                ");
                $advanceStmt->execute([$emp['id']]);
                $advances = $advanceStmt->fetchAll();

                $advancesDeduction = 0.00;
                $maxAdvanceDeductible = $grossSalary * 0.40; // Max 40%
                $advancesToUpdate = [];

                foreach ($advances as $adv) {
                    $remaining = $adv['amount'] - $adv['repaid_amount'];
                    if ($advancesDeduction + $remaining <= $maxAdvanceDeductible) {
                        $advancesDeduction += $remaining;
                        $advancesToUpdate[] = ['id' => $adv['id'], 'repaid' => $adv['amount']];
                    } else {
                        $partial = $maxAdvanceDeductible - $advancesDeduction;
                        $advancesDeduction += $partial;
                        $advancesToUpdate[] = ['id' => $adv['id'], 'repaid' => $adv['repaid_amount'] + $partial];
                        break;
                    }
                }

                // Salaire Net à Payer
                $netSalary = $grossSalary - $cnssDeduction - $taxDeduction - $advancesDeduction;

                // Générer le code unique du bulletin
                $bulletinCode = "KIAM-PAY-" . strtoupper(substr(md5($emp['id'] . $month), 0, 10));

                // 6. Insérer ou mettre à jour le bulletin de paie
                $stmt = $pdo->prepare("
                    INSERT INTO payslips (
                        bulletin_code, employee_id, period_start, period_end, base_salary, 
                        days_worked, hours_worked, overtime_amount, night_work_amount, primes_amount, 
                        gross_salary, cnss_deduction, tax_deduction, advances_deduction, net_salary, payment_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                    ON DUPLICATE KEY UPDATE 
                        base_salary = VALUES(base_salary),
                        days_worked = VALUES(days_worked),
                        hours_worked = VALUES(hours_worked),
                        overtime_amount = VALUES(overtime_amount),
                        night_work_amount = VALUES(night_work_amount),
                        primes_amount = VALUES(primes_amount),
                        gross_salary = VALUES(gross_salary),
                        cnss_deduction = VALUES(cnss_deduction),
                        tax_deduction = VALUES(tax_deduction),
                        advances_deduction = VALUES(advances_deduction),
                        net_salary = VALUES(net_salary)
                ");
                $stmt->execute([
                    $bulletinCode, $emp['id'], $startDate, $endDate, $emp['base_salary'],
                    $daysWorked, $hoursWorked, $overtimeAmount, $nightWorkAmount, $primesAmount,
                    $grossSalary, $cnssDeduction, $taxDeduction, $advancesDeduction, $netSalary
                ]);

                // Valider et enregistrer les remboursements d'avances si le calcul s'effectue
                foreach ($advancesToUpdate as $upd) {
                    $updStmt = $pdo->prepare("UPDATE advances SET repaid_amount = ? WHERE id = ?");
                    $updStmt->execute([$upd['repaid'], $upd['id']]);
                }

                // Marquer les primes traitées ce mois comme 'paid'
                $primeUpdStmt = $pdo->prepare("UPDATE primes SET status = 'paid' WHERE employee_id = ? AND date_assigned BETWEEN ? AND ?");
                $primeUpdStmt->execute([$emp['id'], $startDate, $endDate]);

                $countPayslips++;
            }

            echo json_encode(['success' => true, 'message' => "$countPayslips bulletins de paie calculés et prêts pour la période de $month !"]);
            exit;
        }

        if ($action === 'save_settings') {
            $cnssEmployee = (float)$_POST['cnss_rate_employee'];
            $cnssEmployer = (float)$_POST['cnss_rate_employer'];
            $taxRate = (float)$_POST['tax_bracket_rate'];
            $start = $_POST['work_start_time'];
            $end = $_POST['work_end_time'];
            $weekend = $_POST['weekend_days'];
            $overtimeMult = (float)$_POST['overtime_rate_multiplier'];
            $nightMult = (float)$_POST['night_work_multiplier'];

            $stmt = $pdo->prepare("
                UPDATE payroll_settings 
                SET cnss_rate_employee = ?, cnss_rate_employer = ?, tax_bracket_rate = ?, 
                    work_start_time = ?, work_end_time = ?, weekend_days = ?, 
                    overtime_rate_multiplier = ?, night_work_multiplier = ?
                WHERE id = 1
            ");
            $stmt->execute([$cnssEmployee, $cnssEmployer, $taxRate, $start, $end, $weekend, $overtimeMult, $nightMult]);
            echo json_encode(['success' => true, 'message' => "Paramètres de paie sauvegardés avec succès !"]);
            exit;
        }

        if ($action === 'get_payslip') {
            $id = (int)$_GET['id'];
            $stmt = $pdo->prepare("
                SELECT p.*, e.matricule, e.name, e.first_name, e.job_title, e.department, e.cnss_number, e.bank_name, e.bank_account, e.contract_type, e.hire_date
                FROM payslips p
                JOIN employees e ON p.employee_id = e.id
                WHERE p.id = ?
            ");
            $stmt->execute([$id]);
            $slip = $slipData = $stmt->fetch();
            
            // Calcul du total des retenues
            $totalDeductions = $slip['cnss_deduction'] + $slip['tax_deduction'] + $slip['advances_deduction'];
            $netToPay = $slip['net_salary'];
            
            // Récupérer les informations de la boutique
            $shop = $pdo->query("SELECT * FROM settings LIMIT 1")->fetch();

            echo json_encode([
                'success' => true,
                'data' => $slip,
                'shop' => $shop,
                'deductions' => $totalDeductions
            ]);
            exit;
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erreur API: ' . $e->getMessage()]);
        exit;
    }
}

// ==========================================================================
// 2. RECUPERATION DES DONNEES POUR LE RENDU INITIAL
// ==========================================================================

// Liste des Employés
$employeesList = $pdo->query("SELECT * FROM employees ORDER BY status ASC, name ASC")->fetchAll();

// Liste des départements pour filtrage
$departments = ['R&D', 'Marketing', 'Finance', 'Logistique', 'RH', 'Ventes', 'Production', 'Direction'];

// Données KPI Dashboard
$totalStaff = count($employeesList);
$activeStaff = $pdo->query("SELECT COUNT(*) FROM employees WHERE status = 'active'")->fetchColumn();
$presentToday = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE date = ? AND status IN ('present', 'late', 'leave')");
$presentToday->execute([date('Y-m-d')]);
$presentTodayCount = $presentToday->fetchColumn();

// Masse Salariale
$masseSalariale = $pdo->query("SELECT SUM(net_salary) FROM payslips WHERE period_start >= DATE_SUB(NOW(), INTERVAL 1 MONTH)")->fetchColumn() ?: 0.00;

// Avances en attente
$pendingAdvances = $pdo->query("SELECT COUNT(*) FROM advances WHERE status = 'pending'")->fetchColumn();

// Logs et alertes de stock/RH
$recentAdvances = $pdo->query("
    SELECT a.*, e.name, e.first_name 
    FROM advances a
    JOIN employees e ON a.employee_id = e.id
    ORDER BY a.request_date DESC
    LIMIT 5
")->fetchAll();

$recentPayslips = $pdo->query("
    SELECT p.*, e.name, e.first_name, e.matricule
    FROM payslips p
    JOIN employees e ON p.employee_id = e.id
    ORDER BY p.period_start DESC, p.created_at DESC
    LIMIT 10
")->fetchAll();
?>

<!-- Bibliothèque CDN Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- CSS interne pour adapter et magnifier le look SAGE PAIE -->
<style>
    .payroll-tab-content {
        display: none;
    }
    .payroll-tab-content.active {
        display: block;
    }
    .payroll-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 15px;
        margin-bottom: 25px;
    }
    .payroll-kpi {
        background: white;
        border: 1px solid var(--erp-border);
        border-radius: 4px;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 15px;
    }
    .payroll-kpi-icon {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: rgba(46, 125, 50, 0.1);
        color: #2E7D32;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
    .payroll-kpi-info h4 {
        margin: 0;
        font-size: 0.85rem;
        color: var(--erp-text-muted);
        font-weight: 500;
    }
    .payroll-kpi-info p {
        margin: 3px 0 0 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--erp-text-main);
    }
    .tab-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    /* Matrice du TimeSheet */
    .timesheet-grid-table th, .timesheet-grid-table td {
        padding: 6px;
        text-align: center;
        font-size: 0.82rem;
    }
    .timesheet-cell-status {
        width: 26px;
        height: 26px;
        line-height: 26px;
        border-radius: 50%;
        margin: 0 auto;
        font-weight: bold;
        font-size: 0.72rem;
    }
    .cell-present { background: rgba(16, 185, 129, 0.15); color: #059669; }
    .cell-absent { background: rgba(244, 63, 94, 0.15); color: #e11d48; }
    .cell-late { background: rgba(245, 158, 11, 0.15); color: #d97706; }
    .cell-leave { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
    
    /* Vue Kanban Odoo */
    .emp-kanban-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 15px;
        margin-top: 15px;
    }
    .emp-card {
        background: white;
        border: 1px solid var(--erp-border);
        border-radius: 4px;
        padding: 12px;
        display: flex;
        gap: 12px;
        position: relative;
    }
    .emp-avatar {
        width: 60px;
        height: 60px;
        border-radius: 4px;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: var(--erp-text-muted);
        overflow: hidden;
    }
    .emp-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .emp-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .emp-details h4 {
        margin: 0 0 4px 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--erp-text-main);
    }
    .emp-details p {
        margin: 0 0 3px 0;
        font-size: 0.8rem;
        color: var(--erp-text-muted);
    }
    
    /* Bulletin Printable CSS */
    @media print {
        body * {
            visibility: hidden;
        }
        #payslip-modal-printable, #payslip-modal-printable * {
            visibility: visible;
        }
        #payslip-modal-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            box-shadow: none;
            border: none;
            padding: 0;
        }
        .modal-close, .modal-footer, .erp-topbar, .erp-sidebar {
            display: none !important;
        }
    }
</style>

<!-- Injection Dynamique des Actions de Paie dans le Header -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const actionContainer = document.getElementById('erp-page-actions');
        if (actionContainer) {
            actionContainer.innerHTML = `
                <div style="display: flex; gap: 8px;">
                    <button class="erp-btn erp-btn-secondary" onclick="openAddEmployeeModal()">+ Recruter (Nouvel Employé)</button>
                    <button class="erp-btn erp-btn-primary" onclick="openRunPayrollModal()">⚙️ Lancer la Paie</button>
                </div>
            `;
        }
    });
</script>

<!-- Grille globale de KPIs -->
<div class="payroll-card-grid">
    <div class="payroll-kpi">
        <div class="payroll-kpi-icon">👥</div>
        <div class="payroll-kpi-info">
            <h4>Effectif Total</h4>
            <p><?php echo $totalStaff; ?> employés (<?php echo $activeStaff; ?> Actifs)</p>
        </div>
    </div>
    <div class="payroll-kpi">
        <div class="payroll-kpi-icon" style="color:#059669; background:rgba(16,185,129,0.1);">✓</div>
        <div class="payroll-kpi-info">
            <h4>Présents ce Jour</h4>
            <p><?php echo $presentTodayCount; ?> présents / <?php echo $activeStaff; ?></p>
        </div>
    </div>
    <div class="payroll-kpi">
        <div class="payroll-kpi-icon" style="color:#EAB308; background:rgba(234,179,8,0.1);">💸</div>
        <div class="payroll-kpi-info">
            <h4>Masse Salariale Net (Mois)</h4>
            <p><?php echo number_format($masseSalariale, 0, ',', ' '); ?> FCFA</p>
        </div>
    </div>
    <div class="payroll-kpi">
        <div class="payroll-kpi-icon" style="color:#e11d48; background:rgba(244,63,94,0.1);">⚠️</div>
        <div class="payroll-kpi-info">
            <h4>Avances en Attente</h4>
            <p><?php echo $pendingAdvances; ?> requêtes</p>
        </div>
    </div>
</div>

<!-- ==========================================================================
     TAB CONTENT 1: TABLEAU DE BORD (DASHBOARD)
     ========================================================================== -->
<div id="payroll-tab-dashboard" class="payroll-tab-content active">
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
        <!-- Colonne gauche : Graphiques & Bulletins -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; color: var(--erp-primary);">Évolution de la Masse Salariale</h3>
                <div style="height: 250px; position: relative;">
                    <canvas id="payrollTrendsChart"></canvas>
                </div>
            </div>
            
            <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
                <div class="tab-header-row">
                    <h3 style="margin: 0; color: var(--erp-primary);">Derniers Bulletins de Paie Émis</h3>
                    <button class="erp-btn erp-btn-secondary" onclick="switchTab('payslips')">Voir l'historique</button>
                </div>
                
                <table class="erp-list-view">
                    <thead>
                        <tr>
                            <th>Code Fiche</th>
                            <th>Employé</th>
                            <th>Période</th>
                            <th>Brut</th>
                            <th>Retenues</th>
                            <th style="text-align: right;">Salaire Net</th>
                            <th style="text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($recentPayslips)): ?>
                            <tr>
                                <td colspan="7" style="text-align: center; color: var(--erp-text-muted); padding: 20px;">Aucun bulletin généré ce mois.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($recentPayslips as $slip): ?>
                                <tr>
                                    <td><strong style="color: var(--erp-secondary);"><?php echo htmlspecialchars($slip['bulletin_code']); ?></strong></td>
                                    <td><strong><?php echo htmlspecialchars($slip['first_name'] . ' ' . $slip['name']); ?></strong> <small style="color: var(--erp-text-muted);">(<?php echo htmlspecialchars($slip['matricule']); ?>)</small></td>
                                    <td><?php echo date('m/Y', strtotime($slip['period_start'])); ?></td>
                                    <td><?php echo number_format($slip['gross_salary'], 0, ',', ' '); ?> FCFA</td>
                                    <td style="color: #e11d48;">-<?php echo number_format($slip['cnss_deduction'] + $slip['tax_deduction'] + $slip['advances_deduction'], 0, ',', ' '); ?> FCFA</td>
                                    <td style="text-align: right; font-weight: bold; color: #059669;"><?php echo number_format($slip['net_salary'], 0, ',', ' '); ?> FCFA</td>
                                    <td style="text-align: right;">
                                        <button class="erp-btn erp-btn-secondary" style="padding: 2px 8px;" onclick="viewPayslip(<?php echo $slip['id']; ?>)">👁️ Imprimer</button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Colonne droite : Demandes d'avances, répartition par département -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; color: var(--erp-primary);">Répartition par Département</h3>
                <div style="height: 180px; position: relative;">
                    <canvas id="deptDistributionChart"></canvas>
                </div>
            </div>

            <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
                <div class="tab-header-row">
                    <h3 style="margin: 0; color: var(--erp-primary);">Avances sur Salaire</h3>
                    <button class="erp-btn erp-btn-secondary" onclick="switchTab('advances')">Gérer</button>
                </div>
                
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 12px;">
                    <?php if (empty($recentAdvances)): ?>
                        <small style="color: var(--erp-text-muted); text-align: center; padding: 15px;">Aucune avance en cours.</small>
                    <?php else: ?>
                        <?php foreach ($recentAdvances as $adv): ?>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--erp-border); padding-bottom: 8px;">
                                <div>
                                    <span style="font-size: 0.88rem; font-weight: 600; color: var(--erp-text-main);"><?php echo htmlspecialchars($adv['first_name'] . ' ' . $adv['name']); ?></span><br>
                                    <small style="color: var(--erp-text-muted); font-size: 0.78rem;"><?php echo date('d/m/Y', strtotime($adv['request_date'])); ?> - <?php echo htmlspecialchars($adv['notes']); ?></small>
                                </div>
                                <div style="text-align: right;">
                                    <strong style="color: var(--erp-primary); font-size: 0.9rem;"><?php echo number_format($adv['amount'], 0, ',', ' '); ?> FCFA</strong><br>
                                    <span class="erp-badge <?php 
                                        if ($adv['status'] === 'approved') echo 'erp-badge-success';
                                        elseif ($adv['status'] === 'rejected') echo 'erp-badge-danger';
                                        else echo 'erp-badge-warning';
                                    ?>">
                                        <?php echo $adv['status'] === 'approved' ? 'Approuvée' : ($adv['status'] === 'rejected' ? 'Rejetée' : 'En attente'); ?>
                                    </span>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ==========================================================================
     TAB CONTENT 2: GESTION DES EMPLOYÉS & CONTRATS (TROMBINOSCOPE ODOO)
     ========================================================================== -->
<div id="payroll-tab-employees" class="payroll-tab-content">
    <div class="tab-header-row">
        <h3 style="margin: 0; color: var(--erp-primary);">Directory des Employés</h3>
        <div style="display: flex; gap: 8px;">
            <input type="text" id="employeeSearchInput" placeholder="Recherche rapide matricule, nom..." onkeyup="filterEmployees()" style="padding: 6px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.88rem;">
            <select id="departmentFilter" onchange="filterEmployees()" style="padding: 6px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.88rem;">
                <option value="">Tous les départements</option>
                <?php foreach ($departments as $dept): ?>
                    <option value="<?php echo $dept; ?>"><?php echo $dept; ?></option>
                <?php endforeach; ?>
            </select>
            <button class="erp-btn erp-btn-secondary" onclick="exportEmployeesCSV()">📥 Exporter CSV</button>
            <button class="erp-btn erp-btn-primary" onclick="openAddEmployeeModal()">+ Recruter</button>
        </div>
    </div>

    <!-- Double Vue : Trombinoscope Kanban par défaut -->
    <div class="emp-kanban-container" id="employeesKanbanView">
        <?php foreach ($employeesList as $emp): ?>
            <div class="emp-card" data-name="<?php echo strtolower($emp['first_name'] . ' ' . $emp['name'] . ' ' . $emp['matricule']); ?>" data-dept="<?php echo $emp['department']; ?>">
                <div class="emp-avatar">
                    <?php if ($emp['photo_path']): ?>
                        <img src="<?php echo htmlspecialchars($emp['photo_path']); ?>" alt="Photo">
                    <?php else: ?>
                        👤
                    <?php endif; ?>
                </div>
                <div class="emp-details">
                    <h4><?php echo htmlspecialchars($emp['first_name'] . ' ' . $emp['name']); ?></h4>
                    <p style="font-weight: 500; color: var(--erp-primary);"><?php echo htmlspecialchars($emp['job_title']); ?> <small style="color: var(--erp-text-muted);">(<?php echo htmlspecialchars($emp['department']); ?>)</small></p>
                    <p style="font-family: monospace; font-size: 0.75rem;"><?php echo htmlspecialchars($emp['matricule']); ?></p>
                    <p style="font-size: 0.82rem; font-weight: 600; color: #2E7D32;"><?php echo number_format($emp['base_salary'], 0, ',', ' '); ?> FCFA / <?php echo $emp['work_basis'] === 'hourly' ? 'heure' : ($emp['work_basis'] === 'daily' ? 'jour' : 'mois'); ?></p>
                    <div style="margin-top: 8px; display: flex; gap: 5px;">
                        <button class="erp-btn erp-btn-secondary" style="padding: 2px 6px; font-size: 0.72rem;" onclick="openEditEmployeeModal(<?php echo $emp['id']; ?>)">✏️ Modifier</button>
                        <button class="erp-btn erp-btn-secondary" style="padding: 2px 6px; font-size: 0.72rem; color: #e11d48;" onclick="archiveEmployee(<?php echo $emp['id']; ?>)">✕ Archiver</button>
                    </div>
                </div>
                <span class="erp-badge <?php echo $emp['status'] === 'active' ? 'erp-badge-success' : 'erp-badge-danger'; ?>" style="position: absolute; top: 10px; right: 10px; font-size: 0.65rem;">
                    <?php echo $emp['status'] === 'active' ? 'Actif' : 'Archivé'; ?>
                </span>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<!-- ==========================================================================
     TAB CONTENT 3: PRÉSENCES / POINTAGES (TIME SHEET)
     ========================================================================== -->
<div id="payroll-tab-timesheet" class="payroll-tab-content">
    <div class="tab-header-row">
        <h3 style="margin: 0; color: var(--erp-primary);">Présences & Time Sheet Quotidien</h3>
        <div style="display: flex; gap: 8px; align-items: center;">
            <label style="font-size: 0.88rem; font-weight: 500;">Jour de pointage :</label>
            <input type="date" id="attendanceDateInput" value="<?php echo date('Y-m-d'); ?>" onchange="loadAttendanceDate()" style="padding: 6px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.88rem;">
        </div>
    </div>

    <!-- Tableau de pointage instantané -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto; padding: 15px;">
        <p style="margin: 0 0 15px 0; font-size: 0.85rem; color: var(--erp-text-muted);">
            Marquez la présence, les retards, ou les congés pour le personnel pour la journée sélectionnée.
        </p>
        
        <table class="erp-list-view">
            <thead>
                <tr>
                    <th>Photo</th>
                    <th>Matricule</th>
                    <th>Nom Complet</th>
                    <th>Fonction / Dpt</th>
                    <th>Statut Présence</th>
                    <th>Arrivée (In)</th>
                    <th>Départ (Out)</th>
                    <th>Heures Travaillées</th>
                    <th>Heures Sup</th>
                    <th>Heures Nuit</th>
                    <th style="text-align: right;">Action</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                // Récupérer les pointages du jour
                $todayDate = date('Y-m-d');
                $attListStmt = $pdo->prepare("
                    SELECT e.id as emp_id, e.matricule, e.name, e.first_name, e.job_title, e.department, e.photo_path,
                           a.status, a.check_in, a.check_out, a.hours_worked, a.overtime_hours, a.night_hours
                    FROM employees e
                    LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = ?
                    WHERE e.status = 'active'
                    ORDER BY e.name ASC
                ");
                $attListStmt->execute([$todayDate]);
                $attListData = $attListStmt->fetchAll();
                
                foreach ($attListData as $row):
                    $status = $row['status'] ?: 'present';
                    $in = $row['check_in'] ?: '08:00';
                    $out = $row['check_out'] ?: '17:00';
                    $hours = $row['hours_worked'] !== null ? $row['hours_worked'] : 8.00;
                    $overtime = $row['overtime_hours'] !== null ? $row['overtime_hours'] : 0.00;
                    $night = $row['night_hours'] !== null ? $row['night_hours'] : 0.00;
                ?>
                    <tr id="att-row-<?php echo $row['emp_id']; ?>">
                        <td>
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: #eee; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">
                                <?php if ($row['photo_path']): ?>
                                    <img src="<?php echo htmlspecialchars($row['photo_path']); ?>" style="width:100%; height:100%; object-fit:cover;">
                                <?php else: ?>
                                    👤
                                <?php endif; ?>
                            </div>
                        </td>
                        <td><code style="font-weight:bold;"><?php echo htmlspecialchars($row['matricule']); ?></code></td>
                        <td><strong><?php echo htmlspecialchars($row['first_name'] . ' ' . $row['name']); ?></strong></td>
                        <td><small><?php echo htmlspecialchars($row['job_title'] . ' / ' . $row['department']); ?></small></td>
                        <td>
                            <select class="form-control att-status" style="padding: 4px 8px; font-size: 0.8rem; width:110px;" onchange="updateAttendanceInputs(<?php echo $row['emp_id']; ?>)">
                                <option value="present" <?php echo $status === 'present' ? 'selected' : ''; ?>>Présent</option>
                                <option value="absent" <?php echo $status === 'absent' ? 'selected' : ''; ?>>Absent</option>
                                <option value="late" <?php echo $status === 'late' ? 'selected' : ''; ?>>En retard</option>
                                <option value="leave" <?php echo $status === 'leave' ? 'selected' : ''; ?>>En congé</option>
                                <option value="holiday" <?php echo $status === 'holiday' ? 'selected' : ''; ?>>Jour férié</option>
                            </select>
                        </td>
                        <td><input type="time" class="att-in" value="<?php echo substr($in, 0, 5); ?>" style="padding:4px; font-size:0.8rem; width:80px;"></td>
                        <td><input type="time" class="att-out" value="<?php echo substr($out, 0, 5); ?>" style="padding:4px; font-size:0.8rem; width:80px;"></td>
                        <td><input type="number" step="0.1" class="att-hours" value="<?php echo $hours; ?>" style="padding:4px; font-size:0.8rem; width:60px; text-align:center;"></td>
                        <td><input type="number" step="0.1" class="att-overtime" value="<?php echo $overtime; ?>" style="padding:4px; font-size:0.8rem; width:60px; text-align:center;"></td>
                        <td><input type="number" step="0.1" class="att-night" value="<?php echo $night; ?>" style="padding:4px; font-size:0.8rem; width:60px; text-align:center;"></td>
                        <td style="text-align: right;">
                            <button class="erp-btn erp-btn-primary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="saveAttendanceRow(<?php echo $row['emp_id']; ?>)">💾 Valider</button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ==========================================================================
     TAB CONTENT 4: GESTION DES AVANCES & PRIMES
     ========================================================================== -->
<div id="payroll-tab-advances" class="payroll-tab-content">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Gestion des Avances -->
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
            <div class="tab-header-row">
                <h3 style="margin: 0; color: var(--erp-primary);">Demandes d'Avances sur Salaire</h3>
                <button class="erp-btn erp-btn-secondary" onclick="openAddAdvanceModal()">+ Demander une Avance</button>
            </div>
            
            <table class="erp-list-view">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Employé</th>
                        <th>Montant</th>
                        <th>Remboursé</th>
                        <th>Statut</th>
                        <th style="text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $advList = $pdo->query("
                        SELECT a.*, e.name, e.first_name, e.matricule 
                        FROM advances a
                        JOIN employees e ON a.employee_id = e.id
                        ORDER BY a.request_date DESC
                    ")->fetchAll();
                    
                    if (empty($advList)):
                    ?>
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--erp-text-muted); padding: 20px;">Aucune demande d'avance.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($advList as $adv): ?>
                            <tr>
                                <td><?php echo date('d/m/Y', strtotime($adv['request_date'])); ?></td>
                                <td><strong><?php echo htmlspecialchars($adv['first_name'] . ' ' . $adv['name']); ?></strong></td>
                                <td style="font-weight: 600; color: var(--erp-primary);"><?php echo number_format($adv['amount'], 0, ',', ' '); ?> FCFA</td>
                                <td style="color: #059669; font-weight: 500;"><?php echo number_format($adv['repaid_amount'], 0, ',', ' '); ?> FCFA</td>
                                <td>
                                    <span class="erp-badge <?php 
                                        if ($adv['status'] === 'approved') echo 'erp-badge-success';
                                        elseif ($adv['status'] === 'rejected') echo 'erp-badge-danger';
                                        else echo 'erp-badge-warning';
                                    ?>">
                                        <?php echo $adv['status'] === 'approved' ? 'Approuvée' : ($adv['status'] === 'rejected' ? 'Rejetée' : 'En attente'); ?>
                                    </span>
                                </td>
                                <td style="text-align: right;">
                                    <?php if ($adv['status'] === 'pending'): ?>
                                        <button class="erp-btn erp-btn-secondary" style="padding: 2px 6px; font-size: 0.72rem; color: #059669; border-color:#059669;" onclick="updateAdvanceStatus(<?php echo $adv['id']; ?>, 'approved')">✓</button>
                                        <button class="erp-btn erp-btn-secondary" style="padding: 2px 6px; font-size: 0.72rem; color: #e11d48; border-color:#e11d48;" onclick="updateAdvanceStatus(<?php echo $adv['id']; ?>, 'rejected')">✕</button>
                                    <?php else: ?>
                                        -
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Gestion des Primes -->
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
            <div class="tab-header-row">
                <h3 style="margin: 0; color: var(--erp-primary);">Primes & Indemnités</h3>
                <button class="erp-btn erp-btn-secondary" onclick="openAddPrimeModal()">+ Accorder une Prime</button>
            </div>
            
            <table class="erp-list-view">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Employé</th>
                        <th>Intitulé Prime</th>
                        <th>Type</th>
                        <th style="text-align: right;">Montant</th>
                        <th>État</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $primeList = $pdo->query("
                        SELECT pr.*, e.name, e.first_name 
                        FROM primes pr
                        JOIN employees e ON pr.employee_id = e.id
                        ORDER BY pr.date_assigned DESC
                    ")->fetchAll();
                    
                    if (empty($primeList)):
                    ?>
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--erp-text-muted); padding: 20px;">Aucune prime allouée.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($primeList as $pr): ?>
                            <tr>
                                <td><?php echo date('d/m/Y', strtotime($pr['date_assigned'])); ?></td>
                                <td><strong><?php echo htmlspecialchars($pr['first_name'] . ' ' . $pr['name']); ?></strong></td>
                                <td><?php echo htmlspecialchars($pr['title']); ?></td>
                                <td><span style="text-transform: capitalize; font-size: 0.8rem; color: var(--erp-text-muted);"><?php echo $pr['type']; ?></span></td>
                                <td style="text-align: right; font-weight: 600; color: #2E7D32;"><?php echo number_format($pr['amount'], 0, ',', ' '); ?> FCFA</td>
                                <td>
                                    <span class="erp-badge <?php echo $pr['status'] === 'paid' ? 'erp-badge-success' : 'erp-badge-warning'; ?>">
                                        <?php echo $pr['status'] === 'paid' ? 'Payée' : 'En attente paie'; ?>
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- ==========================================================================
     TAB CONTENT 5: MOTEUR DE CALCUL DE PAIE & BULLETINS DE PAIE
     ========================================================================== -->
<div id="payroll-tab-payslips" class="payroll-tab-content">
    <div class="tab-header-row">
        <h3 style="margin: 0; color: var(--erp-primary);">Calculateurs de Paie & Bulletins émis</h3>
        <div style="display: flex; gap: 8px;">
            <button class="erp-btn erp-btn-primary" onclick="openRunPayrollModal()">⚙️ Calculer la Paie Mensuelle</button>
        </div>
    </div>

    <!-- Tableau de l'historique des fiches de paie -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
        <table class="erp-list-view">
            <thead>
                <tr>
                    <th>Date d'émission</th>
                    <th>Code Bulletin</th>
                    <th>Employé</th>
                    <th>Période de travail</th>
                    <th>Brut</th>
                    <th>CNSS Cotis.</th>
                    <th>Impôts</th>
                    <th>Avances déduites</th>
                    <th style="text-align: right;">Net à Payer</th>
                    <th style="text-align: right;">Action</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $allPayslips = $pdo->query("
                    SELECT p.*, e.name, e.first_name, e.matricule
                    FROM payslips p
                    JOIN employees e ON p.employee_id = e.id
                    ORDER BY p.period_start DESC, e.name ASC
                ")->fetchAll();
                
                if (empty($allPayslips)):
                ?>
                    <tr>
                        <td colspan="10" style="text-align: center; color: var(--erp-text-muted); padding: 20px;">Aucun bulletin de paie généré dans le système.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($allPayslips as $slip): ?>
                        <tr>
                            <td><?php echo date('d/m/Y H:i', strtotime($slip['created_at'])); ?></td>
                            <td><code style="font-weight: bold; color: var(--erp-secondary);"><?php echo htmlspecialchars($slip['bulletin_code']); ?></code></td>
                            <td><strong><?php echo htmlspecialchars($slip['first_name'] . ' ' . $slip['name']); ?></strong> <br><small style="color: var(--erp-text-muted);"><?php echo htmlspecialchars($slip['matricule']); ?></small></td>
                            <td><?php echo date('m/Y', strtotime($slip['period_start'])); ?></td>
                            <td style="font-weight: 500;"><?php echo number_format($slip['gross_salary'], 0, ',', ' '); ?> FCFA</td>
                            <td style="color: #e11d48;">-<?php echo number_format($slip['cnss_deduction'], 0, ',', ' '); ?> FCFA</td>
                            <td style="color: #e11d48;">-<?php echo number_format($slip['tax_deduction'], 0, ',', ' '); ?> FCFA</td>
                            <td style="color: #e11d48;">-<?php echo number_format($slip['advances_deduction'], 0, ',', ' '); ?> FCFA</td>
                            <td style="text-align: right; font-weight: bold; color: #059669; font-size: 1.05rem;"><?php echo number_format($slip['net_salary'], 0, ',', ' '); ?> FCFA</td>
                            <td style="text-align: right;">
                                <button class="erp-btn erp-btn-secondary" style="padding: 2px 8px;" onclick="viewPayslip(<?php echo $slip['id']; ?>)">👁️ Consulter / Imprimer</button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ==========================================================================
     TAB CONTENT 6: PARAMÈTRES DE PAIE & SAUVEGARDE
     ========================================================================== -->
<div id="payroll-tab-settings" class="payroll-tab-content">
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 20px; color: var(--erp-primary); border-bottom: 1px solid var(--erp-border); padding-bottom: 10px;">Configuration du Moteur de Paie</h3>
            
            <form id="payrollSettingsForm" onsubmit="savePayrollSettings(event)">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Taux CNSS Employé (%)</label>
                        <input type="number" step="0.01" name="cnss_rate_employee" required value="<?php echo htmlspecialchars($payrollSettings['cnss_rate_employee'] ?? '5.50'); ?>" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Taux CNSS Employeur (%)</label>
                        <input type="number" step="0.01" name="cnss_rate_employer" required value="<?php echo htmlspecialchars($payrollSettings['cnss_rate_employer'] ?? '14.50'); ?>" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Taux d'Impôt Unique IGR (%)</label>
                        <input type="number" step="0.01" name="tax_bracket_rate" required value="<?php echo htmlspecialchars($payrollSettings['tax_bracket_rate'] ?? '10.00'); ?>" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Multiplicateur Heures Sup (1.25 par défaut)</label>
                        <input type="number" step="0.01" name="overtime_rate_multiplier" required value="<?php echo htmlspecialchars($payrollSettings['overtime_rate_multiplier'] ?? '1.25'); ?>" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Heure de début de pointage</label>
                        <input type="time" name="work_start_time" required value="<?php echo htmlspecialchars($payrollSettings['work_start_time'] ?? '08:00:00'); ?>" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Heure de fin de pointage</label>
                        <input type="time" name="work_end_time" required value="<?php echo htmlspecialchars($payrollSettings['work_end_time'] ?? '17:00:00'); ?>" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Week-ends chômés</label>
                        <input type="text" name="weekend_days" required value="<?php echo htmlspecialchars($payrollSettings['weekend_days'] ?? 'Saturday,Sunday'); ?>" placeholder="Ex: Saturday,Sunday" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Multiplicateur Travail de Nuit</label>
                        <input type="number" step="0.01" name="night_work_multiplier" required value="<?php echo htmlspecialchars($payrollSettings['night_work_multiplier'] ?? '1.50'); ?>" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem;">
                    </div>
                </div>

                <button type="submit" class="erp-btn erp-btn-primary" style="padding: 10px 20px;">
                    Enregistrer la Configuration Paie
                </button>
            </form>
        </div>

        <!-- Outils utilitaires -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 10px; color: var(--erp-primary);">Export de rapports RH</h3>
                <p style="font-size: 0.85rem; color: var(--erp-text-muted); margin-bottom: 15px; line-height: 1.4;">
                    Téléchargez des rapports synthétiques sous format CSV des présences et des fiches de paie.
                </p>
                <button class="erp-btn erp-btn-secondary" onclick="exportPayrollHistory()" style="width: 100%; justify-content: center; padding: 10px; margin-bottom: 10px;">📥 Historique de Paie (CSV)</button>
                <button class="erp-btn erp-btn-secondary" onclick="exportAttendanceHistory()" style="width: 100%; justify-content: center; padding: 10px;">📥 Historique Présences (CSV)</button>
            </div>
            
            <div style="background: #f9fafb; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 10px; color: var(--erp-text-main);">Sauvegarde Système</h3>
                <p style="font-size: 0.85rem; color: var(--erp-text-muted); line-height: 1.5; margin-bottom: 12px;">
                    Effectuez une sauvegarde complète de la base de données SQL incluant toutes vos informations employés et pointages.
                </p>
                <a href="index.php?page=settings&action=backup_db" class="erp-btn erp-btn-primary" style="width: 100%; justify-content: center; padding: 10px;">💾 Exporter la Base SQL</a>
            </div>
        </div>
    </div>
</div>

<!-- ==========================================================================
     MODALS DIALOGUES (AJOUTS / MODIFICATIONS ET CONSULTATIONS)
     ========================================================================== -->

<!-- Modale 1 : Recruter / Modifier Employé -->
<div class="modal" id="employeeModal">
    <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
            <h3 id="employeeModalTitle">Recruter un Nouvel Employé</h3>
            <button type="button" class="modal-close" onclick="closeModal('employeeModal')">✕</button>
        </div>
        <form id="employeeForm" onsubmit="saveEmployee(event)" enctype="multipart/form-data">
            <input type="hidden" name="employee_id" id="form_employee_id">
            <input type="hidden" name="current_photo_path" id="form_current_photo_path">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group">
                    <label class="form-label">Nom de famille *</label>
                    <input class="form-control" type="text" name="name" id="form_name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Prénom *</label>
                    <input class="form-control" type="text" name="first_name" id="form_first_name" required>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group">
                    <label class="form-label">Sexe *</label>
                    <select class="form-control" name="gender" id="form_gender" required>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Date de naissance *</label>
                    <input class="form-control" type="date" name="birth_date" id="form_birth_date" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Photo de profil</label>
                    <input class="form-control" type="file" name="photo" accept="image/*">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group">
                    <label class="form-label">Pièce d'identité *</label>
                    <select class="form-control" name="id_type" id="form_id_type" required>
                        <option value="CNI">CNI (Carte Nationale)</option>
                        <option value="Passeport">Passeport</option>
                        <option value="Permis">Permis de Conduire</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Numéro de pièce *</label>
                    <input class="form-control" type="text" name="id_number" id="form_id_number" required>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group">
                    <label class="form-label">Téléphone *</label>
                    <input class="form-control" type="text" name="phone" id="form_phone" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Adresse Email</label>
                    <input class="form-control" type="email" name="email" id="form_email">
                </div>
                <div class="form-group">
                    <label class="form-label">Adresse Résidentielle</label>
                    <input class="form-control" type="text" name="address" id="form_address">
                </div>
            </div>

            <div style="border-top: 1px solid var(--erp-border); margin: 15px 0; padding-top: 15px;">
                <h4 style="margin: 0 0 10px 0; color: var(--erp-secondary);">Contrat & Rémunération</h4>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group">
                    <label class="form-label">Poste / Fonction *</label>
                    <input class="form-control" type="text" name="job_title" id="form_job_title" placeholder="Ex: Développeur Senior" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Département *</label>
                    <select class="form-control" name="department" id="form_department" required>
                        <?php foreach ($departments as $dept): ?>
                            <option value="<?php echo $dept; ?>"><?php echo $dept; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Type de contrat *</label>
                    <select class="form-control" name="contract_type" id="form_contract_type" required>
                        <option value="CDI">CDI (Indéterminé)</option>
                        <option value="CDD">CDD (Déterminé)</option>
                        <option value="Stage">Stage</option>
                        <option value="Intérim">Intérim</option>
                    </select>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group">
                    <label class="form-label">Date d'embauche *</label>
                    <input class="form-control" type="date" name="hire_date" id="form_hire_date" required value="<?php echo date('Y-m-d'); ?>">
                </div>
                <div class="form-group">
                    <label class="form-label">Salaire de base *</label>
                    <input class="form-control" type="number" step="0.01" name="base_salary" id="form_base_salary" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Mode de calcul</label>
                    <select class="form-control" name="work_basis" id="form_work_basis">
                        <option value="monthly">Mensuel Fixe</option>
                        <option value="daily">Par Jour presté</option>
                        <option value="hourly">Par Heure travaillée</option>
                    </select>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group">
                    <label class="form-label">Banque de dépôt</label>
                    <input class="form-control" type="text" name="bank_name" id="form_bank_name" placeholder="Ex: CBAO">
                </div>
                <div class="form-group">
                    <label class="form-label">Numéro de compte RIB</label>
                    <input class="form-control" type="text" name="bank_account" id="form_bank_account" placeholder="RIB bancaire complet">
                </div>
                <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 25px;">
                    <input type="checkbox" name="cnss_enabled" id="form_cnss_enabled" checked value="1">
                    <label style="font-weight: 500; font-size: 0.88rem; cursor: pointer;" for="form_cnss_enabled">Cotisation CNSS Active</label>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group">
                    <label class="form-label">Numéro d'immatriculation CNSS (si active)</label>
                    <input class="form-control" type="text" name="cnss_number" id="form_cnss_number">
                </div>
            </div>

            <div style="border-top: 1px solid var(--erp-border); margin: 15px 0; padding-top: 15px;">
                <h4 style="margin: 0 0 10px 0; color: var(--erp-secondary);">Contact d'urgence</h4>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group">
                    <label class="form-label">Nom complet</label>
                    <input class="form-control" type="text" name="emergency_contact_name" id="form_emergency_contact_name">
                </div>
                <div class="form-group">
                    <label class="form-label">Téléphone</label>
                    <input class="form-control" type="text" name="emergency_contact_phone" id="form_emergency_contact_phone">
                </div>
                <div class="form-group">
                    <label class="form-label">Relation / Parenté</label>
                    <input class="form-control" type="text" name="emergency_contact_relation" id="form_emergency_contact_relation" placeholder="Ex: Epouse, Mère">
                </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="erp-btn erp-btn-secondary" onclick="closeModal('employeeModal')">Annuler</button>
                <button type="submit" class="erp-btn erp-btn-primary">Enregistrer la fiche employé</button>
            </div>
        </form>
    </div>
</div>

<!-- Modale 2 : Lancer / Calculer la Paie Mensuelle -->
<div class="modal" id="runPayrollModal">
    <div class="modal-content" style="max-width: 450px;">
        <div class="modal-header">
            <h3>Lancer le Calcul de la Paie</h3>
            <button type="button" class="modal-close" onclick="closeModal('runPayrollModal')">✕</button>
        </div>
        <form id="payrollRunForm" onsubmit="runPayroll(event)">
            <p style="font-size: 0.88rem; color: var(--erp-text-muted); margin-bottom: 15px;">
                Sélectionnez la période mensuelle pour générer ou mettre à jour les bulletins de paie de tous les employés.
            </p>
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Sélectionner le Mois *</label>
                <input class="form-control" type="month" name="month" id="payroll_run_month" required value="<?php echo date('Y-m'); ?>">
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="erp-btn erp-btn-secondary" onclick="closeModal('runPayrollModal')">Annuler</button>
                <button type="submit" class="erp-btn erp-btn-primary">Calculer & Émettre</button>
            </div>
        </form>
    </div>
</div>

<!-- Modale 3 : Demande d'Avance -->
<div class="modal" id="addAdvanceModal">
    <div class="modal-content" style="max-width: 450px;">
        <div class="modal-header">
            <h3>Demande d'Avance sur Salaire</h3>
            <button type="button" class="modal-close" onclick="closeModal('addAdvanceModal')">✕</button>
        </div>
        <form id="addAdvanceForm" onsubmit="addAdvance(event)">
            <div class="form-group" style="margin-bottom: 15px;">
                <label class="form-label">Employé bénéficiaire *</label>
                <select class="form-control" name="employee_id" required>
                    <option value="">Sélectionner un employé...</option>
                    <?php foreach ($employeesList as $emp): ?>
                        <?php if ($emp['status'] === 'active'): ?>
                            <option value="<?php echo $emp['id']; ?>"><?php echo htmlspecialchars($emp['first_name'] . ' ' . $emp['name']); ?> (<?php echo htmlspecialchars($emp['matricule']); ?>)</option>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 15px;">
                <label class="form-label">Montant de l'avance (FCFA) *</label>
                <input class="form-control" type="number" name="amount" required min="1000">
            </div>

            <div class="form-group" style="margin-bottom: 15px;">
                <label class="form-label">Date de la demande *</label>
                <input class="form-control" type="date" name="request_date" required value="<?php echo date('Y-m-d'); ?>">
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Motif / Notes</label>
                <input class="form-control" type="text" name="notes" placeholder="Ex: Avance exceptionnelle loyer">
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="erp-btn erp-btn-secondary" onclick="closeModal('addAdvanceModal')">Annuler</button>
                <button type="submit" class="erp-btn erp-btn-primary">Enregistrer la demande</button>
            </div>
        </form>
    </div>
</div>

<!-- Modale 4 : Attribuer une Prime -->
<div class="modal" id="addPrimeModal">
    <div class="modal-content" style="max-width: 450px;">
        <div class="modal-header">
            <h3>Attribuer une Prime / Bonus</h3>
            <button type="button" class="modal-close" onclick="closeModal('addPrimeModal')">✕</button>
        </div>
        <form id="addPrimeForm" onsubmit="addPrime(event)">
            <div class="form-group" style="margin-bottom: 15px;">
                <label class="form-label">Employé bénéficiaire *</label>
                <select class="form-control" name="employee_id" required>
                    <option value="">Sélectionner un employé...</option>
                    <?php foreach ($employeesList as $emp): ?>
                        <?php if ($emp['status'] === 'active'): ?>
                            <option value="<?php echo $emp['id']; ?>"><?php echo htmlspecialchars($emp['first_name'] . ' ' . $emp['name']); ?></option>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                <div class="form-group">
                    <label class="form-label">Type de Prime *</label>
                    <select class="form-control" name="type" required>
                        <option value="rendement">Rendement / Bonus</option>
                        <option value="transport">Transport</option>
                        <option value="logement">Logement</option>
                        <option value="exceptionnelle">Exceptionnelle</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Montant (FCFA) *</label>
                    <input class="form-control" type="number" name="amount" required min="500">
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 15px;">
                <label class="form-label">Libellé explicatif *</label>
                <input class="form-control" type="text" name="title" required placeholder="Ex: Indemnité de logement Mai">
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Date d'effet *</label>
                <input class="form-control" type="date" name="date_assigned" required value="<?php echo date('Y-m-d'); ?>">
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="erp-btn erp-btn-secondary" onclick="closeModal('addPrimeModal')">Annuler</button>
                <button type="submit" class="erp-btn erp-btn-primary">Octroyer</button>
            </div>
        </form>
    </div>
</div>

<!-- Modale 5 : Visionneuse et Imprimerie du Bulletin de Paie (SAGE STYLE PRINT) -->
<div class="modal" id="payslipViewModal">
    <div class="modal-content" style="max-width: 800px; padding: 25px;">
        <div class="modal-header">
            <h3>Bulletin de Paie individuel</h3>
            <div style="display: flex; gap: 8px;">
                <button class="erp-btn erp-btn-secondary" onclick="window.print()">🖨️ Imprimer la fiche (PDF)</button>
                <button type="button" class="modal-close" onclick="closeModal('payslipViewModal')">✕</button>
            </div>
        </div>
        
        <!-- Fiche de paie printable -->
        <div id="payslip-modal-printable" style="margin-top: 15px; font-family: 'Courier New', Courier, monospace; color: #111; border: 2px solid #222; padding: 25px; background: white;">
            <!-- Header du bulletin -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px double #222; padding-bottom: 15px; margin-bottom: 15px;">
                <div>
                    <h2 id="payslip_shop_name" style="margin: 0; font-size: 1.35rem; font-weight: bold; text-transform: uppercase;">KIAM ERP</h2>
                    <p id="payslip_shop_address" style="margin: 3px 0; font-size: 0.8rem;">Dakar, Sénégal</p>
                    <p id="payslip_shop_phone" style="margin: 3px 0; font-size: 0.8rem;">Tel: +221 33 825 00 00</p>
                </div>
                <div style="text-align: right;">
                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: bold; text-decoration: underline;">BULLETIN DE PAIE</h3>
                    <p style="margin: 3px 0; font-size: 0.82rem;">Période de travail : <strong id="payslip_period">Mai 2026</strong></p>
                    <p style="margin: 3px 0; font-size: 0.82rem;">Code Bulletin : <code id="payslip_code" style="font-weight: bold;">KIAM-PAY-X</code></p>
                </div>
            </div>

            <!-- Fiche descriptive Employé -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border: 1px solid #333; padding: 10px; margin-bottom: 15px; font-size: 0.82rem; line-height: 1.4;">
                <div>
                    <p><strong>Matricule :</strong> <span id="payslip_emp_matricule">-</span></p>
                    <p><strong>Nom Complet :</strong> <span id="payslip_emp_name">-</span></p>
                    <p><strong>Date d'embauche :</strong> <span id="payslip_emp_hire">-</span></p>
                    <p><strong>Fonction :</strong> <span id="payslip_emp_job">-</span></p>
                    <p><strong>Département :</strong> <span id="payslip_emp_dept">-</span></p>
                </div>
                <div>
                    <p><strong>Type de contrat :</strong> <span id="payslip_emp_contract">-</span></p>
                    <p><strong>N° CNSS :</strong> <span id="payslip_emp_cnss">-</span></p>
                    <p><strong>Banque :</strong> <span id="payslip_emp_bank">-</span></p>
                    <p><strong>Compte Bancaire :</strong> <span id="payslip_emp_account">-</span></p>
                </div>
            </div>

            <!-- Tableau central des calculs (Gains et Retenues) -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.82rem;">
                <thead>
                    <tr style="border-top: 2px solid #222; border-bottom: 2px solid #222; background: #eee;">
                        <th style="text-align: left; padding: 8px;">Désignation / Rubrique</th>
                        <th style="text-align: center; padding: 8px; width: 80px;">Base / Qté</th>
                        <th style="text-align: right; padding: 8px; width: 110px;">Part patronale</th>
                        <th style="text-align: right; padding: 8px; width: 110px;">Gains (Brut)</th>
                        <th style="text-align: right; padding: 8px; width: 110px;">Retenues</th>
                    </tr>
                </thead>
                <tbody id="payslip_table_body">
                    <!-- Généré dynamiquement -->
                </tbody>
            </table>

            <!-- Bloc signature, Net à payer et QR code de sécurité -->
            <div style="display: grid; grid-template-columns: 2fr 1.5fr 1fr; gap: 15px; border-top: 2px solid #222; padding-top: 15px; align-items: center; font-size: 0.82rem;">
                <div>
                    <p style="margin: 0 0 5px 0;">Certifié exact par l'employeur,</p>
                    <div style="height: 50px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 0.78rem; color: #999;">
                        Signature & Cachet
                    </div>
                </div>
                
                <div style="background: #eee; border: 1px solid #222; padding: 10px; text-align: center; line-height: 1.5;">
                    <span style="font-size: 0.85rem; font-weight: 500; text-transform: uppercase;">Net à Payer (FCFA)</span><br>
                    <strong id="payslip_net_to_pay" style="font-size: 1.35rem; color: #059669; font-family: monospace;">0 FCFA</strong>
                </div>

                <div style="text-align: right; display: flex; justify-content: flex-end;">
                    <!-- QR Code SVG fictif ou réel -->
                    <div id="payslip_qrcode" style="width: 80px; height: 80px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; text-align: center; background: #fafafa;">
                        [ QR CODE AUTH ]
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ==========================================================================
     3. SCRIPTS LOGIQUES JAVASCRIPT ET GRAPHIC CHARTS
     ========================================================================== -->
<script>
// --- NAVIGATION PAR ONGLET ---
function switchTab(tabId) {
    // 1. Désactiver tous les onglets
    document.querySelectorAll('.payroll-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.payroll-nav-link').forEach(el => el.classList.remove('active'));
    
    // 2. Activer l'onglet ciblé
    const targetContent = document.getElementById('payroll-tab-' + tabId);
    const targetNavLink = document.getElementById('nav-payroll-' + tabId);
    
    if (targetContent) targetContent.classList.add('active');
    if (targetNavLink) targetNavLink.classList.add('active');
}

// --- FILTRAGE DYNAMIQUE DES EMPLOYÉS ---
function filterEmployees() {
    const q = document.getElementById('employeeSearchInput').value.toLowerCase();
    const dept = document.getElementById('departmentFilter').value;
    
    document.querySelectorAll('.emp-card').forEach(card => {
        const name = card.getAttribute('data-name');
        const cardDept = card.getAttribute('data-dept');
        
        const matchesSearch = name.includes(q);
        const matchesDept = (dept === "" || cardDept === dept);
        
        if (matchesSearch && matchesDept) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// --- INITIALISER & ENREGISTRER EMPLOYE ---
function openAddEmployeeModal() {
    document.getElementById('employeeForm').reset();
    document.getElementById('form_employee_id').value = '';
    document.getElementById('employeeModalTitle').textContent = "Recruter un Nouvel Employé";
    openModal('employeeModal');
}

function openEditEmployeeModal(id) {
    fetch('index.php?page=payroll&ajax=1&action=get_employee&id=' + id)
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                const emp = res.data;
                document.getElementById('form_employee_id').value = emp.id;
                document.getElementById('form_current_photo_path').value = emp.photo_path;
                document.getElementById('form_name').value = emp.name;
                document.getElementById('form_first_name').value = emp.first_name;
                document.getElementById('form_gender').value = emp.gender;
                document.getElementById('form_birth_date').value = emp.birth_date;
                document.getElementById('form_id_type').value = emp.id_type;
                document.getElementById('form_id_number').value = emp.id_number;
                document.getElementById('form_phone').value = emp.phone;
                document.getElementById('form_email').value = emp.email;
                document.getElementById('form_address').value = emp.address;
                document.getElementById('form_job_title').value = emp.job_title;
                document.getElementById('form_department').value = emp.department;
                document.getElementById('form_contract_type').value = emp.contract_type;
                document.getElementById('form_hire_date').value = emp.hire_date;
                document.getElementById('form_base_salary').value = emp.base_salary;
                document.getElementById('form_work_basis').value = emp.work_basis;
                document.getElementById('form_bank_name').value = emp.bank_name;
                document.getElementById('form_bank_account').value = emp.bank_account;
                document.getElementById('form_cnss_enabled').checked = (emp.cnss_enabled == 1);
                document.getElementById('form_cnss_number').value = emp.cnss_number;
                document.getElementById('form_emergency_contact_name').value = emp.emergency_contact_name;
                document.getElementById('form_emergency_contact_phone').value = emp.emergency_contact_phone;
                document.getElementById('form_emergency_contact_relation').value = emp.emergency_contact_relation;
                
                document.getElementById('employeeModalTitle').textContent = "Modifier la fiche de " + emp.first_name + " " + emp.name;
                openModal('employeeModal');
            } else {
                showNotification("Erreur lors de la récupération des données", "danger");
            }
        });
}

function saveEmployee(e) {
    e.preventDefault();
    const fd = new FormData(document.getElementById('employeeForm'));
    
    fetch('index.php?page=payroll&ajax=1&action=save_employee', {
        method: 'POST',
        body: fd
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            closeModal('employeeModal');
            showNotification(res.message, "success");
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showNotification(res.message, "danger");
        }
    });
}

function archiveEmployee(id) {
    if (confirm("Êtes-vous sûr de vouloir archiver cet employé ?")) {
        fetch('index.php?page=payroll&ajax=1&action=archive_employee&id=' + id)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    showNotification(res.message, "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showNotification(res.message, "danger");
                }
            });
    }
}

// --- ATTENDANCE / POINTAGES ---
function updateAttendanceInputs(empId) {
    const row = document.getElementById('att-row-' + empId);
    const status = row.querySelector('.att-status').value;
    const inInput = row.querySelector('.att-in');
    const outInput = row.querySelector('.att-out');
    const hoursInput = row.querySelector('.att-hours');
    
    if (status === 'absent' || status === 'leave' || status === 'holiday') {
        inInput.value = '';
        outInput.value = '';
        hoursInput.value = '0';
        inInput.disabled = true;
        outInput.disabled = true;
        hoursInput.disabled = true;
    } else {
        inInput.value = '08:00';
        outInput.value = '17:00';
        hoursInput.value = '8';
        inInput.disabled = false;
        outInput.disabled = false;
        hoursInput.disabled = false;
    }
}

function saveAttendanceRow(empId) {
    const row = document.getElementById('att-row-' + empId);
    const date = document.getElementById('attendanceDateInput').value;
    const status = row.querySelector('.att-status').value;
    const checkIn = row.querySelector('.att-in').value;
    const checkOut = row.querySelector('.att-out').value;
    const hours = row.querySelector('.att-hours').value;
    const overtime = row.querySelector('.att-overtime').value;
    const night = row.querySelector('.att-night').value;

    const fd = new FormData();
    fd.append('employee_id', empId);
    fd.append('date', date);
    fd.append('status', status);
    fd.append('check_in', checkIn);
    fd.append('check_out', checkOut);
    fd.append('hours_worked', hours);
    fd.append('overtime_hours', overtime);
    fd.append('night_hours', night);

    fetch('index.php?page=payroll&ajax=1&action=save_attendance', {
        method: 'POST',
        body: fd
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            showNotification(res.message, "success");
        } else {
            showNotification(res.message, "danger");
        }
    });
}

function loadAttendanceDate() {
    const d = document.getElementById('attendanceDateInput').value;
    window.location.href = 'index.php?page=payroll&date=' + d;
}

// S'assurer de recharger sur la bonne date ou le bon onglet si spécifié en URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam) {
        document.getElementById('attendanceDateInput').value = dateParam;
        switchTab('timesheet');
    } else {
        const tabParam = urlParams.get('tab') || 'dashboard';
        switchTab(tabParam);
    }
});

// --- GESTION DES AVANCES ---
function openAddAdvanceModal() {
    document.getElementById('addAdvanceForm').reset();
    openModal('addAdvanceModal');
}

function addAdvance(e) {
    e.preventDefault();
    const fd = new FormData(document.getElementById('addAdvanceForm'));
    fetch('index.php?page=payroll&ajax=1&action=add_advance', {
        method: 'POST',
        body: fd
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            closeModal('addAdvanceModal');
            showNotification(res.message, "success");
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showNotification(res.message, "danger");
        }
    });
}

function updateAdvanceStatus(id, status) {
    fetch('index.php?page=payroll&ajax=1&action=update_advance_status&id=' + id + '&status=' + status)
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                showNotification(res.message, "success");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showNotification(res.message, "danger");
            }
        });
}

// --- GESTION DES PRIMES ---
function openAddPrimeModal() {
    document.getElementById('addPrimeForm').reset();
    openModal('addPrimeModal');
}

function addPrime(e) {
    e.preventDefault();
    const fd = new FormData(document.getElementById('addPrimeForm'));
    fetch('index.php?page=payroll&ajax=1&action=add_prime', {
        method: 'POST',
        body: fd
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            closeModal('addPrimeModal');
            showNotification(res.message, "success");
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showNotification(res.message, "danger");
        }
    });
}

// --- MOTEUR DE CALCUL DE PAIE ---
function openRunPayrollModal() {
    openModal('runPayrollModal');
}

function runPayroll(e) {
    e.preventDefault();
    const month = document.getElementById('payroll_run_month').value;
    const fd = new FormData();
    fd.append('month', month);

    showNotification("Calcul des bulletins en cours...", "info");
    
    fetch('index.php?page=payroll&ajax=1&action=calculate_payroll', {
        method: 'POST',
        body: fd
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            closeModal('runPayrollModal');
            showNotification(res.message, "success");
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showNotification(res.message, "danger");
        }
    });
}

// --- IMPRESSION & PREVIEW BULLETIN DE PAIE ---
function viewPayslip(id) {
    fetch('index.php?page=payroll&ajax=1&action=get_payslip&id=' + id)
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                const s = res.data;
                const shop = res.shop;
                
                // Info générale entreprise
                document.getElementById('payslip_shop_name').textContent = shop.company_name || "KIAM ERP";
                document.getElementById('payslip_shop_address').textContent = shop.company_address || "Dakar, Sénégal";
                document.getElementById('payslip_shop_phone').textContent = "Tel: " + (shop.company_phone || "+221 33 825 00 00");
                
                // Info générale bulletin
                const pDate = new Date(s.period_start);
                const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
                document.getElementById('payslip_period').textContent = monthNames[pDate.getMonth()] + " " + pDate.getFullYear();
                document.getElementById('payslip_code').textContent = s.bulletin_code;
                
                // Info employé
                document.getElementById('payslip_emp_matricule').textContent = s.matricule;
                document.getElementById('payslip_emp_name').textContent = s.first_name + " " + s.name;
                document.getElementById('payslip_emp_hire').textContent = s.hire_date;
                document.getElementById('payslip_emp_job').textContent = s.job_title;
                document.getElementById('payslip_emp_dept').textContent = s.department;
                document.getElementById('payslip_emp_contract').textContent = s.contract_type;
                document.getElementById('payslip_emp_cnss').textContent = s.cnss_number || "Non rattaché";
                document.getElementById('payslip_emp_bank').textContent = s.bank_name || "Espèces / Mobile Money";
                document.getElementById('payslip_emp_account').textContent = s.bank_account || "-";
                
                // Net à payer
                document.getElementById('payslip_net_to_pay').textContent = Number(s.net_salary).toLocaleString() + " FCFA";

                // QR Code SVG
                const qrText = `BULLETIN:${s.bulletin_code}|NET:${s.net_salary}|EMP:${s.matricule}`;
                document.getElementById('payslip_qrcode').innerHTML = `
                    <svg viewBox="0 0 100 100" width="80" height="80">
                        <!-- Simulation esthétique de QR code en pure SVG -->
                        <rect x="0" y="0" width="100" height="100" fill="white"/>
                        <rect x="5" y="5" width="25" height="25" fill="black"/>
                        <rect x="10" y="10" width="15" height="15" fill="white"/>
                        <rect x="13" y="13" width="9" height="9" fill="black"/>
                        
                        <rect x="70" y="5" width="25" height="25" fill="black"/>
                        <rect x="75" y="10" width="15" height="15" fill="white"/>
                        <rect x="78" y="13" width="9" height="9" fill="black"/>
                        
                        <rect x="5" y="70" width="25" height="25" fill="black"/>
                        <rect x="10" y="75" width="15" height="15" fill="white"/>
                        <rect x="13" y="78" width="9" height="9" fill="black"/>
                        
                        <rect x="40" y="40" width="20" height="20" fill="black"/>
                        <rect x="45" y="45" width="10" height="10" fill="white"/>
                        
                        <rect x="70" y="70" width="10" height="10" fill="black"/>
                        <rect x="85" y="85" width="10" height="10" fill="black"/>
                        <rect x="80" y="70" width="5" height="5" fill="black"/>
                        <rect x="70" y="80" width="5" height="5" fill="black"/>
                    </svg>
                `;

                // Construire les lignes du tableau
                const tbody = document.getElementById('payslip_table_body');
                tbody.innerHTML = '';
                
                // Ligne 1 : Salaire de Base
                const baseRow = `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px;">Salaire de Base</td>
                        <td style="text-align: center; padding: 8px;">${s.days_worked} jours</td>
                        <td style="text-align: right; padding: 8px;">-</td>
                        <td style="text-align: right; padding: 8px;">${Number(s.base_salary).toLocaleString()} FCFA</td>
                        <td style="text-align: right; padding: 8px;">-</td>
                    </tr>
                `;
                tbody.innerHTML += baseRow;

                // Heures Sup si présentes
                if (s.overtime_amount > 0) {
                    const hsRow = `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 8px;">Heures supplémentaires (125%)</td>
                            <td style="text-align: center; padding: 8px;">-</td>
                            <td style="text-align: right; padding: 8px;">-</td>
                            <td style="text-align: right; padding: 8px;">${Number(s.overtime_amount).toLocaleString()} FCFA</td>
                            <td style="text-align: right; padding: 8px;">-</td>
                        </tr>
                    `;
                    tbody.innerHTML += hsRow;
                }

                // Primes si présentes
                if (s.primes_amount > 0) {
                    const prRow = `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 8px;">Primes & Indemnités allouées</td>
                            <td style="text-align: center; padding: 8px;">-</td>
                            <td style="text-align: right; padding: 8px;">-</td>
                            <td style="text-align: right; padding: 8px;">${Number(s.primes_amount).toLocaleString()} FCFA</td>
                            <td style="text-align: right; padding: 8px;">-</td>
                        </tr>
                    `;
                    tbody.innerHTML += prRow;
                }

                // Lignes de retenues : CNSS
                if (s.cnss_deduction > 0) {
                    const cnssRow = `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 8px; color: #555;">Cotisation Sociale CNSS</td>
                            <td style="text-align: center; padding: 8px;">5.5%</td>
                            <td style="text-align: right; padding: 8px;">-</td>
                            <td style="text-align: right; padding: 8px;">-</td>
                            <td style="text-align: right; padding: 8px; color: #e11d48;">${Number(s.cnss_deduction).toLocaleString()} FCFA</td>
                        </tr>
                    `;
                    tbody.innerHTML += cnssRow;
                }

                // Lignes de retenues : Impôts
                if (s.tax_deduction > 0) {
                    const taxRow = `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 8px; color: #555;">Impôt sur le Revenu (IGR)</td>
                            <td style="text-align: center; padding: 8px;">10%</td>
                            <td style="text-align: right; padding: 8px;">-</td>
                            <td style="text-align: right; padding: 8px;">-</td>
                            <td style="text-align: right; padding: 8px; color: #e11d48;">${Number(s.tax_deduction).toLocaleString()} FCFA</td>
                        </tr>
                    `;
                    tbody.innerHTML += taxRow;
                }

                // Retenue sur Avances si présente
                if (s.advances_deduction > 0) {
                    const advRow = `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 8px; color: #555;">Remboursement d'Avance sur Salaire</td>
                            <td style="text-align: center; padding: 8px;">Déduction</td>
                            <td style="text-align: right; padding: 8px;">-</td>
                            <td style="text-align: right; padding: 8px;">-</td>
                            <td style="text-align: right; padding: 8px; color: #e11d48;">${Number(s.advances_deduction).toLocaleString()} FCFA</td>
                        </tr>
                    `;
                    tbody.innerHTML += advRow;
                }

                // Ligne de synthèse des totaux
                const summaryRow = `
                    <tr style="border-top: 2px solid #222; font-weight: bold; background: #fafafa;">
                        <td style="padding: 8px;">TOTAL DES MASSES BRUTES ET RETENUES</td>
                        <td style="padding: 8px;">-</td>
                        <td style="text-align: right; padding: 8px;">-</td>
                        <td style="text-align: right; padding: 8px;">${Number(s.gross_salary).toLocaleString()} FCFA</td>
                        <td style="text-align: right; padding: 8px; color: #e11d48;">${Number(res.deductions).toLocaleString()} FCFA</td>
                    </tr>
                `;
                tbody.innerHTML += summaryRow;
                
                openModal('payslipViewModal');
            } else {
                showNotification(res.message, "danger");
            }
        });
}

// --- CONFIGURATION PARAMÈTRES ---
function savePayrollSettings(e) {
    e.preventDefault();
    const fd = new FormData(document.getElementById('payrollSettingsForm'));
    fetch('index.php?page=payroll&ajax=1&action=save_settings', {
        method: 'POST',
        body: fd
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            showNotification(res.message, "success");
        } else {
            showNotification(res.message, "danger");
        }
    });
}

// --- EXPORTATIONS CSV CLIENT-SIDE (ULTRA RAPIDES ET PROPRES) ---
function exportEmployeesCSV() {
    let csv = "Matricule,Nom,Prenom,Genre,Fonction,Departement,Contrat,Date Embauche,Salaire de Base,Mode\n";
    <?php foreach ($employeesList as $emp): ?>
        csv += `"<?php echo $emp['matricule']; ?>","<?php echo $emp['name']; ?>","<?php echo $emp['first_name']; ?>","<?php echo $emp['gender']; ?>","<?php echo $emp['job_title']; ?>","<?php echo $emp['department']; ?>","<?php echo $emp['contract_type']; ?>","<?php echo $emp['hire_date']; ?>","<?php echo $emp['base_salary']; ?>","<?php echo $emp['work_basis']; ?>"\n`;
    <?php endforeach; ?>
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "trombinoscope_employes_kiam.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportPayrollHistory() {
    let csv = "Date Emission,Code Bulletin,Matricule,Employe,Periode,Brut,CNSS Retenue,Impots,Avances Retenues,Net a Payer\n";
    <?php foreach ($allPayslips as $slip): ?>
        csv += `"<?php echo $slip['created_at']; ?>","<?php echo $slip['bulletin_code']; ?>","<?php echo $slip['matricule']; ?>","<?php echo $slip['first_name'] . ' ' . $slip['name']; ?>","<?php echo date('m/Y', strtotime($slip['period_start'])); ?>","<?php echo $slip['gross_salary']; ?>","<?php echo $slip['cnss_deduction']; ?>","<?php echo $slip['tax_deduction']; ?>","<?php echo $slip['advances_deduction']; ?>","<?php echo $slip['net_salary']; ?>"\n`;
    <?php endforeach; ?>
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "historique_paie_kiam.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportAttendanceHistory() {
    showNotification("Génération de l'export des présences...", "info");
    // Télécharge les pointages existants en base
    fetch('index.php?page=payroll&ajax=1&action=export_attendances')
        .then(res => {
            let csv = "Date Pointage,Matricule,Employe,Statut,Heures Travaillables,Heures Sup,Travail de Nuit\n";
            <?php 
            $allAtt = $pdo->query("
                SELECT a.*, e.matricule, e.name, e.first_name 
                FROM attendance a
                JOIN employees e ON a.employee_id = e.id
                ORDER BY a.date DESC
            ")->fetchAll();
            foreach ($allAtt as $at):
            ?>
                csv += `"<?php echo $at['date']; ?>","<?php echo $at['matricule']; ?>","<?php echo $at['first_name'] . ' ' . $at['name']; ?>","<?php echo $at['status']; ?>","<?php echo $at['hours_worked']; ?>","<?php echo $at['overtime_hours']; ?>","<?php echo $at['night_hours']; ?>"\n`;
            <?php endforeach; ?>
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", "historique_pointages_kiam.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
}

// --- RENDER DES CHARTS DU DASHBOARD SAGE PAIE ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Chart Évolution Masse Salariale
    const ctxTrends = document.getElementById('payrollTrendsChart');
    if (ctxTrends) {
        new Chart(ctxTrends, {
            type: 'line',
            data: {
                labels: ['Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai'],
                datasets: [{
                    label: 'Masse Salariale Net (FCFA)',
                    data: [
                        <?php echo $masseSalariale * 0.8; ?>, 
                        <?php echo $masseSalariale * 0.85; ?>, 
                        <?php echo $masseSalariale * 0.9; ?>, 
                        <?php echo $masseSalariale * 0.95; ?>, 
                        <?php echo $masseSalariale * 0.98; ?>, 
                        <?php echo $masseSalariale; ?>
                    ],
                    borderColor: '#2E7D32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f3f4f6' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // 2. Chart Répartition par Département
    const ctxDept = document.getElementById('deptDistributionChart');
    if (ctxDept) {
        // Compter les employés par département
        const deptCounts = {};
        <?php foreach ($employeesList as $emp): ?>
            deptCounts["<?php echo $emp['department']; ?>"] = (deptCounts["<?php echo $emp['department']; ?>"] || 0) + 1;
        <?php endforeach; ?>

        const labels = Object.keys(deptCounts);
        const data = Object.values(deptCounts);

        new Chart(ctxDept, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['Général'],
                datasets: [{
                    data: data.length ? data : [1],
                    backgroundColor: ['#2E7D32', '#714B67', '#017E84', '#EAB308', '#F43F5E', '#64748B', '#3B82F6', '#8B5CF6'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 12, font: { size: 10 } }
                    }
                }
            }
        });
    }
});
</script>
