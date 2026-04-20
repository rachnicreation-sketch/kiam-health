<?php
require_once 'api/config.php';

$tables = ['users', 'patients', 'consultations', 'hotel_rooms', 'school_students', 'inventory_items'];
$data = [];

foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SELECT * FROM $table");
        $data[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $data[$table] = "Error: " . $e->getMessage();
    }
}

echo json_encode($data, JSON_PRETTY_PRINT);
?>
