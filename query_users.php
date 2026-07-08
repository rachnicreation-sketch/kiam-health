<?php
$pdo = new PDO('mysql:host=127.0.0.1', 'root', '');
$databases = $pdo->query('SHOW DATABASES')->fetchAll(PDO::FETCH_COLUMN);
echo "Databases:\n" . implode(", ", $databases) . "\n\n";

if (in_array('kiam_health', $databases)) {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=kiam_health', 'root', '');
    $stmt = $pdo->query('SELECT * FROM users');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as &$u) {
        if (isset($u['password'])) $u['password'] = substr($u['password'], 0, 10) . '...';
        if (isset($u['password_hash'])) $u['password_hash'] = substr($u['password_hash'], 0, 10) . '...';
    }
    echo "Users in kiam_health:\n";
    echo json_encode($users, JSON_PRETTY_PRINT);
}
