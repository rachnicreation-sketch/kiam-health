<?php
require_once 'config.php';
require_once 'functions.php';

$data = getRequestData();
$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (!$email || !$password) {
        sendResponse(["status" => "error", "message" => "Email et mot de passe requis"], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && $password === $user['password_hash']) {
        unset($user['password_hash']);
        
        $clinic = null;
        if ($user['clinic_id']) {
            $stmt = $pdo->prepare("SELECT * FROM clinics WHERE id = ?");
            $stmt->execute([$user['clinic_id']]);
            $clinic = $stmt->fetch();
        }
        
        sendResponse([
            "status" => "success", 
            "user" => [
                "id" => $user['id'],
                "email" => $user['email'],
                "name" => $user['name'],
                "role" => $user['role'],
                "clinicId" => $user['clinic_id']
            ],
            "clinic" => $clinic
        ]);
    } else {
        sendResponse(["status" => "error", "message" => "Identifiants invalides"], 401);
    }
} else {
    sendResponse(["status" => "error", "message" => "Action non reconnue"], 404);
}
?>
