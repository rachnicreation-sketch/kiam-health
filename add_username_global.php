<?php
$pdo = new PDO('mysql:host=127.0.0.1', 'root', '');

// Add username column to kiam_global_users
try {
    $pdo->exec("ALTER TABLE kiam_saas.kiam_global_users ADD COLUMN username VARCHAR(100) UNIQUE AFTER email");
    echo "Added username column to kiam_global_users\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "username column already exists\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

// Set username from email prefix for existing global users
$stmt = $pdo->query("SELECT id, email FROM kiam_saas.kiam_global_users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $user) {
    $username = explode('@', $user['email'])[0];
    $upd = $pdo->prepare("UPDATE kiam_saas.kiam_global_users SET username = ? WHERE id = ?");
    $upd->execute([$username, $user['id']]);
    echo "Set username '{$username}' for user {$user['email']}\n";
}

echo "\nAll done!\n";

// List result
$stmt = $pdo->query("SELECT id, username, email, global_role FROM kiam_saas.kiam_global_users");
echo "\nUpdated global users:\n";
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $u) {
    echo "  ID={$u['id']} | username={$u['username']} | email={$u['email']} | role={$u['global_role']}\n";
}
