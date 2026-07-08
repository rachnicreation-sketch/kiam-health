<?php
/**
 * Test de santé unifié des endpoints critiques de Kiam API
 */

require_once 'config.php';
require_once 'functions.php';

header('Content-Type: text/plain; charset=utf-8');

echo "=== KIAM API DIAGNOSTIC HEALTH CHECK ===\n\n";

// 1. Database Connection Check
try {
    $pdo->query("SELECT 1");
    echo "[PASS] Connexion à la base de données OK\n";
} catch (Exception $e) {
    echo "[FAIL] Échec connexion base de données : " . $e->getMessage() . "\n";
    exit(1);
}

// 2. Main Tables Check
$tables = [
    'kiam_tenants',
    'kiam_global_users',
    'kiam_plans',
    'kiam_audit_logs',
    'kiam_subscriptions'
];

foreach ($tables as $table) {
    try {
        $pdo->query("SELECT 1 FROM $table LIMIT 1");
        echo "[PASS] Table '$table' existante et accessible\n";
    } catch (Exception $e) {
        echo "[FAIL] Table '$table' manquante ou corrompue\n";
    }
}

echo "\nDiagnostic complété avec succès.\n";
