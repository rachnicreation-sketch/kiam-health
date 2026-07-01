<?php
require_once 'config.php';
$email = 'admin@kiam.com';
$password = 'admin123';
$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare("UPDATE kiam_global_users SET password_hash = ? WHERE email = ?");
$stmt->execute([$hash, $email]);
echo "Mot de passe réinitialisé pour $email : $password\n";
?>
