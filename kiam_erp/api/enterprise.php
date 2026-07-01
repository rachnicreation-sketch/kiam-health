<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$clinicId = $auth['clinic_id'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list_projects';

// Auto-table creation for Enterprise
try {
    $pdo->query("CREATE TABLE IF NOT EXISTS ent_projects (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        progress INT DEFAULT 0,
        deadline DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->query("CREATE TABLE IF NOT EXISTS ent_tasks (
        id VARCHAR(50) PRIMARY KEY,
        project_id VARCHAR(50),
        clinic_id VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        assigned_to VARCHAR(100),
        status VARCHAR(50) DEFAULT 'todo',
        deadline DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {}

if ($method === 'GET') {
    if ($action === 'list_projects') {
        $stmt = $pdo->prepare("SELECT * FROM ent_projects WHERE clinic_id = ? ORDER BY created_at DESC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_tasks') {
        $stmt = $pdo->prepare("SELECT * FROM ent_tasks WHERE clinic_id = ? ORDER BY created_at DESC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'stats') {
        $stats = [
            "active_projects" => $pdo->query("SELECT COUNT(*) FROM ent_projects WHERE clinic_id = '$clinicId' AND status = 'active'")->fetchColumn(),
            "pending_tasks" => $pdo->query("SELECT COUNT(*) FROM ent_tasks WHERE clinic_id = '$clinicId' AND status != 'done'")->fetchColumn(),
            "team_size" => $pdo->query("SELECT COUNT(*) FROM kiam_global_users WHERE clinic_id = '$clinicId'")->fetchColumn(),
        ];
        sendResponse($stats);
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if ($action === 'add_project') {
        $id = "PRJ-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO ent_projects (id, clinic_id, name, deadline) VALUES (?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['name'], $data['deadline']]);
        sendResponse(["status" => "success", "id" => $id]);
    } elseif ($action === 'add_task') {
        $id = "TSK-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO ent_tasks (id, clinic_id, title, assigned_to, deadline) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['title'], $data['assigned_to'], $data['deadline']]);
        sendResponse(["status" => "success", "id" => $id]);
    }
}
?>
