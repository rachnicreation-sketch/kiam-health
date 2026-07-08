<?php
require_once 'config.php';

echo "=== RESET ADMIN PASSWORD ===\n";
$email = 'saas.admin@kiam.local';
$password = 'KiamSaas@2026!';
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("UPDATE kiam_global_users SET password_hash = ? WHERE email = ?");
if ($stmt->execute([$hash, $email])) {
    echo "Password reset successful for $email\n";
} else {
    echo "FAILED to reset password\n";
}
?>
