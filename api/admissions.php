<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM admissions WHERE clinic_id = ? ORDER BY date_in DESC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'transfers' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM bed_transfers WHERE clinic_id = ? ORDER BY transfer_date DESC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if ($action === 'transfer') {
        if (!$data['admissionId'] || !$data['newBedId'] || !$data['oldBedInfo'] || !$data['newBedInfo']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }

        $pdo->beginTransaction();
        try {
            // 1. Mettre à jour l'admission
            $stmt = $pdo->prepare("UPDATE admissions SET bed_id = ? WHERE id = ?");
            $stmt->execute([$data['newBedId'], $data['admissionId']]);

            // 2. Loguer le transfert
            $id = "TRF-" . time();
            $stmt = $pdo->prepare("INSERT INTO bed_transfers (id, clinic_id, admission_id, patient_id, old_bed_info, new_bed_info) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $data['clinicId'],
                $data['admissionId'],
                $data['patientId'],
                $data['oldBedInfo'],
                $data['newBedInfo']
            ]);

            // 3. Mettre à jour les statuts des lits
            $stmt = $pdo->prepare("UPDATE beds SET status = 'available' WHERE id = ?");
            $stmt->execute([$data['oldBedId']]);
            $stmt = $pdo->prepare("UPDATE beds SET status = 'occupied' WHERE id = ?");
            $stmt->execute([$data['newBedId']]);

            $pdo->commit();
            sendResponse(["status" => "success", "id" => $id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
        }
    } else {
        if (!$data['patientId'] || !$data['bedId'] || !$data['clinicId']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }

        $pdo->beginTransaction();
        try {
            $id = "ADM-" . time();
            $stmt = $pdo->prepare("INSERT INTO admissions (id, clinic_id, patient_id, bed_id, date_in, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $data['clinicId'],
                $data['patientId'],
                $data['bedId'],
                $data['dateIn'] ?? date("Y-m-d H:i:s"),
                $data['reason'] ?? '',
                'active'
            ]);

            // Mettre à jour le statut du lit
            $stmt = $pdo->prepare("UPDATE beds SET status = 'occupied' WHERE id = ?");
            $stmt->execute([$data['bedId']]);

            $pdo->commit();
            sendResponse(["status" => "success", "id" => $id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
        }
    }
} elseif ($method === 'PUT') {
    // Discharge
    $data = getRequestData();
    if (!$data['id'] || !$data['bedId']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("UPDATE admissions SET status = 'discharged', date_out = ? WHERE id = ?");
        $stmt->execute([date("Y-m-d H:i:s"), $data['id']]);

        $stmt = $pdo->prepare("UPDATE beds SET status = 'available' WHERE id = ?");
        $stmt->execute([$data['bedId']]);

        $pdo->commit();
        sendResponse(["status" => "success"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
    }
}
?>
