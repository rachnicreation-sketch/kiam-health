<?php
/**
 * API Gestion Code-Barres & Génération automatique - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');
requireLogin();

$action = $_GET['action'] ?? '';
$userRole = $_SESSION['user_role'] ?? '';
$isAdminOrManager = in_array($userRole, ['admin', 'manager']);

try {
    if ($action === 'generate_barcode') {
        // Générer un code-barres EAN-13 unique
        $barcode = generateUniqueBarcode($pdo);
        echo json_encode(['success' => true, 'barcode' => $barcode]);
        exit;
    }
    
    if ($action === 'scan_barcode') {
        // Traiter le scan de code-barres (pour la vente)
        $barcode = trim($_GET['barcode'] ?? '');
        if (empty($barcode)) {
            throw new Exception('Code-barres vide');
        }
        
        $stmt = $pdo->prepare("SELECT * FROM products WHERE barcode = ?");
        $stmt->execute([$barcode]);
        $product = $stmt->fetch();
        
        if (!$product) {
            echo json_encode(['success' => false, 'message' => 'Produit introuvable']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'product' => $product
        ]);
        exit;
    }
    
    if ($action === 'import_products' && $isAdminOrManager) {
        // Importer des produits depuis Excel/CSV
        if (!isset($_FILES['import_file'])) {
            throw new Exception('Aucun fichier fourni');
        }
        
        $fileTmpPath = $_FILES['import_file']['tmp_name'];
        $fileType = $_FILES['import_file']['type'];
        
        $imported = 0;
        $errors = [];
        
        if (strpos($fileType, 'spreadsheet') !== false || strpos($fileType, 'csv') !== false) {
            $handle = fopen($fileTmpPath, 'r');
            $lineNum = 0;
            
            $pdo->beginTransaction();
            try {
                while (($data = fgetcsv($handle, 1000, ";")) !== false) {
                    $lineNum++;
                    if ($lineNum === 1) continue; // Skip header
                    
                    $barcode = trim($data[0] ?? '') ?: null;
                    $name = trim($data[1] ?? '');
                    $description = trim($data[2] ?? '');
                    $categoryName = trim($data[3] ?? '');
                    $purchasePrice = (float)($data[4] ?? 0);
                    $salePrice = (float)($data[5] ?? 0);
                    $stock = (int)($data[6] ?? 0);
                    $alert = (int)($data[7] ?? 5);
                    
                    if (empty($name)) {
                        $errors[] = "Ligne $lineNum: Nom du produit manquant";
                        continue;
                    }
                    
                    // Récupérer l'ID de la catégorie
                    $catId = null;
                    if (!empty($categoryName)) {
                        $catStmt = $pdo->prepare("SELECT id FROM categories WHERE name = ?");
                        $catStmt->execute([$categoryName]);
                        $catResult = $catStmt->fetch();
                        if ($catResult) {
                            $catId = $catResult['id'];
                        } else {
                            // Créer la catégorie si elle n'existe pas
                            $createCat = $pdo->prepare("INSERT INTO categories (name) VALUES (?)");
                            $createCat->execute([$categoryName]);
                            $catId = $pdo->lastInsertId();
                        }
                    }
                    
                    // Insérer le produit
                    $stmt = $pdo->prepare("INSERT INTO products (barcode, name, description, category_id, purchase_price, sale_price, stock_qty, min_stock_alert) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                    
                    try {
                        $stmt->execute([$barcode, $name, $description, $catId, $purchasePrice, $salePrice, $stock, $alert]);
                        $imported++;
                    } catch (PDOException $e) {
                        if ($e->getCode() == 23000) {
                            $errors[] = "Ligne $lineNum: Code-barres déjà existant ($barcode)";
                        } else {
                            $errors[] = "Ligne $lineNum: " . $e->getMessage();
                        }
                    }
                }
                
                fclose($handle);
                $pdo->commit();
            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                throw $e;
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => "$imported produits importés avec succès",
            'imported' => $imported,
            'errors' => $errors
        ]);
        exit;
    }
    
    if ($action === 'print_barcode') {
        // Générer un PDF avec le code-barres pour l'impression
        $productId = (int)($_GET['product_id'] ?? 0);
        if ($productId <= 0) {
            throw new Exception('ID produit invalide');
        }
        
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        $product = $stmt->fetch();
        
        if (!$product) {
            throw new Exception('Produit introuvable');
        }
        
        // Générer une URL de code-barres (utiliser un service comme code128.org ou générer avec GD)
        $barcodeData = generateBarcodeSvg($product['barcode'], $product['name']);
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'barcode_svg' => $barcodeData,
            'product' => $product
        ]);
        exit;
    }
    
    echo json_encode(['success' => false, 'message' => 'Action inconnue']);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// ========== FONCTIONS UTILITAIRES ==========

function generateUniqueBarcode($pdo) {
    // Générer un code EAN-13 unique
    for ($attempt = 0; $attempt < 100; $attempt++) {
        $barcode = generateEAN13();
        
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE barcode = ?");
        $stmt->execute([$barcode]);
        if ($stmt->fetchColumn() == 0) {
            return $barcode;
        }
    }
    
    throw new Exception('Impossible de générer un code-barres unique');
}

function generateEAN13() {
    // Générer un EAN-13 valide (12 chiffres + checksum)
    $code = '3' . str_pad(rand(0, 999999999), 11, '0', STR_PAD_LEFT);
    
    // Calculer le checksum
    $sum = 0;
    for ($i = 0; $i < 12; $i++) {
        $sum += (int)$code[$i] * (($i % 2 === 0) ? 1 : 3);
    }
    $checksum = (10 - ($sum % 10)) % 10;
    
    return $code . $checksum;
}

function generateBarcodeSvg($barcode, $productName) {
    // Générer un SVG simple du code-barres (Code128 basique)
    // Pour une solution robuste, utiliser une bibliothèque comme 'picqer/php-barcode-generator'
    
    // Conversion simplifiée en SVG (approximation)
    $width = strlen($barcode) * 40;
    $svg = '<svg width="' . $width . '" height="100" xmlns="http://www.w3.org/2000/svg">';
    $svg .= '<style>.barcode-digit{font-size:12px;}</style>';
    $svg .= '<rect width="100%" height="100%" fill="white"/>';
    
    // Dessiner les barres (simplifié)
    $x = 10;
    for ($i = 0; $i < strlen($barcode); $i++) {
        $digit = (int)$barcode[$i];
        $barWidth = 2 + ($digit * 0.1);
        $svg .= '<rect x="' . $x . '" y="10" width="' . $barWidth . '" height="60" fill="black"/>';
        $svg .= '<text x="' . ($x + 3) . '" y="80" class="barcode-digit">' . $barcode[$i] . '</text>';
        $x += $barWidth + 3;
    }
    
    $svg .= '<text x="10" y="95" style="font-size:10px;">' . htmlspecialchars($productName) . '</text>';
    $svg .= '</svg>';
    
    return $svg;
}
?>
