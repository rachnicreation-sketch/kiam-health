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
?>
