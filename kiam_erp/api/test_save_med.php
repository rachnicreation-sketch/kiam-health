<?php
require_once 'config.php';
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
try {
    $id = "MED-TEST-" . time();
    $clinicId = "health-demo"; // or whatever clinic id exists
    $barcode = '200' . str_pad(rand(0, 999999999), 9, '0', STR_PAD_LEFT);
    $stmt = $pdo->prepare("INSERT INTO medications (id, clinic_id, name, category, stock, threshold, price, unit, code_product, barcode, dci, form, dosage, presentation, brand, supplier, price_buy, price_wholesale, stock_max, storage_location, description, image) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id, $clinicId, "Test Med", "Médicaments", 5, 1000.0, "boîte",
        "CODE", $barcode, "DCI", "form", "dosage", "presentation", "brand", "supplier", 500.0,
        450.0, 100, "shelf 1", "description", ""
    ]);
    echo "SUCCESS INSERT\n";
    
    // Test update
    $stmt = $pdo->prepare("UPDATE medications SET name=?, category=?, threshold=?, price=?, unit=?, code_product=?, barcode=?, dci=?, form=?, dosage=?, presentation=?, brand=?, supplier=?, price_buy=?, price_wholesale=?, stock_max=?, storage_location=?, description=?, image=? WHERE id=? AND clinic_id=?");
    $stmt->execute([
        "Test Med Updated", "Médicaments", 5, 1000.0, "boîte",
        "CODE", $barcode, "DCI", "form", "dosage", "presentation", "brand", "supplier", 500.0,
        450.0, 100, "shelf 1", "description", "", $id, $clinicId
    ]);
    echo "SUCCESS UPDATE\n";
    
    // Clean up
    $pdo->exec("DELETE FROM medications WHERE id = '$id'");
    echo "SUCCESS CLEANUP\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
