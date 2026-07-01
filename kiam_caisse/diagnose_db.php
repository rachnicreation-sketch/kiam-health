<?php
$pdo = new PDO('mysql:host=localhost', 'root', '');
$pdo->exec('USE kiam_caisse');

echo "📊 DIAGNOSTIQUE BASE DE DONNÉES\n";
echo "═════════════════════════════════\n\n";

// Lister toutes les tables
$result = $pdo->query("SHOW TABLES");
$tables = $result->fetchAll(PDO::FETCH_COLUMN);

echo "Tables existantes (" . count($tables) . "):\n";
foreach ($tables as $table) {
    echo "  ✅ $table\n";
}

// Chercher spécifiquement les tables d'achat
echo "\n\nTables d'achat/fournisseurs:\n";
$procurement_tables = ['suppliers', 'supplier_orders', 'supplier_order_items', 'supplier_contacts', 'supplier_products'];
foreach ($procurement_tables as $table) {
    if (in_array($table, $tables)) {
        echo "  ✅ $table EXISTS\n";
    } else {
        echo "  ❌ $table MISSING\n";
    }
}

?>
