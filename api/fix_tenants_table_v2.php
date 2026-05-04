<?php
require_once 'config.php';
try {
    $pdo->exec("ALTER TABLE kiam_tenants ADD COLUMN last_notifications_read_at DATETIME NULL");
    echo "Colonne last_notifications_read_at ajoutée.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "La colonne existe déjà.\n";
    } else {
        echo "Erreur : " . $e->getMessage() . "\n";
    }
}
?>
