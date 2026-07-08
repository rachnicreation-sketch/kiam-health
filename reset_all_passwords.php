<?php
$pdo = new PDO('mysql:host=127.0.0.1', 'root', '');
$newPassword = password_hash('KiamAdmin@2026!', PASSWORD_BCRYPT, ['cost' => 12]);

// === 1. Reset kiam_global_users ===
echo "=== Réinitialisation de kiam_global_users ===\n";
$users = $pdo->query("SELECT id, username, email, global_role FROM kiam_saas.kiam_global_users")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    $pdo->prepare("UPDATE kiam_saas.kiam_global_users SET password_hash = ? WHERE id = ?")->execute([$newPassword, $u['id']]);
    echo "  ✓ [{$u['global_role']}] username={$u['username']} | email={$u['email']} → KiamAdmin@2026!\n";
}

// === 2. Reset all tenant users tables ===
$tenantDbs = ['kiam_health', 'kiam_hopital', 'kiam_ecole', 'kiam_erp', 'kiam_ges', 'kiam_hotel', 'kiam_caisse', 'kiam_saas'];
echo "\n=== Réinitialisation des utilisateurs locataires ===\n";
foreach ($tenantDbs as $db) {
    try {
        $users = $pdo->query("SELECT id, username, name, email FROM {$db}.users")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($users as $u) {
            $pdo->prepare("UPDATE {$db}.users SET password = ? WHERE id = ?")->execute([$newPassword, $u['id']]);
            echo "  ✓ [{$db}] username={$u['username']} | name={$u['name']} | email={$u['email']} → KiamAdmin@2026!\n";
        }
    } catch (Exception $e) {
        echo "  ✗ [{$db}] Erreur: " . $e->getMessage() . "\n";
    }
}

echo "\n============================================\n";
echo "Tous les comptes ont été réinitialisés !\n";
echo "Mot de passe universel : KiamAdmin@2026!\n";
echo "============================================\n";
