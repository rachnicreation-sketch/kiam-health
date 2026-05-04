<?php
require_once 'config.php';
try {
    $pdo->exec("ALTER TABLE kiam_tenants ADD COLUMN IF NOT EXISTS last_notifications_read_at DATETIME NULL");
    echo "Colonne last_notifications_read_at ajoutée à kiam_tenants.\n";
} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage() . "\n";
}
?>
