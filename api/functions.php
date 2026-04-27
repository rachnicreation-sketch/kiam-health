<?php
/**
 * Fonctions utilitaires pour l'API
 */

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function getRequestData() {
    return json_decode(file_get_contents("php://input"), true);
}

function generateId($prefix = '') {
    return $prefix . uniqid();
}

function requireAuth() {
    require_once 'jwt.php';
    $token = JWT::getBearerToken();
    if (!$token) {
        sendResponse(["status" => "error", "message" => "Accès non autorisé: Token manquant"], 401);
    }
    $decoded = JWT::decode($token);
    if (!$decoded) {
        sendResponse(["status" => "error", "message" => "Accès non autorisé: Token invalide ou expiré"], 401);
    }
    return $decoded;
}
function ensureClinicForTenant(PDO $pdo, ?string $tenantId): string {
    $tenantId = trim((string) $tenantId);
    if ($tenantId === '') {
        sendResponse(["status" => "error", "message" => "Contexte clinique introuvable"], 400);
    }

    $stmt = $pdo->prepare("SELECT id FROM clinics WHERE id = ?");
    $stmt->execute([$tenantId]);
    if ($stmt->fetchColumn()) {
        return $tenantId;
    }

    $tenantStmt = $pdo->prepare("SELECT name FROM kiam_tenants WHERE id = ?");
    $tenantStmt->execute([$tenantId]);
    $tenant = $tenantStmt->fetch();
    $clinicName = $tenant['name'] ?? ('Espace ' . $tenantId);

    $insertStmt = $pdo->prepare("
        INSERT INTO clinics (id, name, status)
        VALUES (?, ?, 'active')
        ON DUPLICATE KEY UPDATE name = COALESCE(NULLIF(name, ''), VALUES(name))
    ");
    $insertStmt->execute([$tenantId, $clinicName]);

    return $tenantId;
}
?>
