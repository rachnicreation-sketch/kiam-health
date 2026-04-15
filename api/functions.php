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
?>
