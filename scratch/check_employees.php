<?php
require_once __DIR__ . '/../api/config.php';

try {
    echo "--- EMPLOYEES ---\n";
    $stmt = $pdo->query("SELECT id, clinic_id, name, position, department FROM employees");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
