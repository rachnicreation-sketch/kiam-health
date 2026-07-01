<?php
/**
 * Configuration de la base de données pour Kiam Health
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'kiam_ges');
define('DB_USER', 'root');
define('DB_PASS', ''); // Par défaut vide sur WampServer

// Activation du rapport d'erreurs pour le développement
error_reporting(E_ALL);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    // Auto-initialize schema from database/schema.sql if clinics table is missing
    try {
        $pdo->query("SELECT 1 FROM clinics LIMIT 1");
    } catch (Exception $e) {
        $schemaFile = dirname(__DIR__) . '/database/schema.sql';
        if (file_exists($schemaFile)) {
            $sql = file_get_contents($schemaFile);
            $sql = preg_replace('/--.*\n/', '', $sql);
            $queries = explode(';', $sql);
            foreach ($queries as $q) {
                $q = trim($q);
                if (!empty($q)) {
                    try {
                        $pdo->exec($q);
                    } catch (Exception $ex) {}
                }
            }
        }
    }

    // Auto-run additional table setups
    try {
        $pdo->query("SELECT 1 FROM inventory_items LIMIT 1");
    } catch (Exception $e) {
        @include_once __DIR__ . '/init_tables_phase4.php';
    }

    try {
        $pdo->query("SELECT 1 FROM erp_suppliers LIMIT 1");
    } catch (Exception $e) {
        @include_once __DIR__ . '/init_erp_pro.php';
    }

    try {
        $pdo->query("SELECT 1 FROM activity_logs LIMIT 1");
    } catch (Exception $e) {
        @include_once __DIR__ . '/migrate_missing_tables.php';
    }

    // Auto-init procurement module tables
    try {
        $pdo->query("SELECT 1 FROM suppliers LIMIT 1");
    } catch (Exception $e) {
        @include_once __DIR__ . '/init_procurement.php';
    }

    // Auto-init advanced ERP Pro v2 tables
    try {
        $pdo->query("SELECT 1 FROM erp_product_units LIMIT 1");
    } catch (Exception $e) {
        @include_once __DIR__ . '/init_erp_pro_v2.php';
    }

    // Auto-init pharmacy tables
    try {
        $pdo->query("SELECT 1 FROM medication_batches LIMIT 1");
    } catch (Exception $e) {
        @include_once __DIR__ . '/init_pharmacy.php';
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $e->getMessage()]);
    exit;
}
?>
