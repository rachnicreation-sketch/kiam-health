<?php
require_once 'api/config.php';

$tenantId = 'T-820'; // Lycée des Talents
$password = password_hash('kiam2026', PASSWORD_DEFAULT);

$roles = [
    ['id' => 'u-enseignant', 'name' => 'Prof. Koua', 'email' => 'teacher@kiam.com', 'role' => 'enseignant'],
    ['id' => 'u-eleve', 'name' => 'Marie Ngouabi', 'email' => 'student@kiam.com', 'role' => 'eleve'],
    ['id' => 'u-parent', 'name' => 'M. Ngouabi', 'email' => 'parent@kiam.com', 'role' => 'parent'],
    ['id' => 'u-comptable', 'name' => 'Jean Accountant', 'email' => 'comptable@kiam.com', 'role' => 'comptable'],
    ['id' => 'u-secretariat', 'name' => 'Sara Accueil', 'email' => 'secretariat@kiam.com', 'role' => 'secretariat'],
];

try {
    foreach ($roles as $r) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO users (id, clinic_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$r['id'], $tenantId, $r['name'], $r['email'], $password, $r['role']]);
    }
    echo "School test accounts created successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
