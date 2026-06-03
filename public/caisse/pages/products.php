<?php
/**
 * Gestion du Catalogue Produits - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

$userRole = $_SESSION['user_role'] ?? '';
$isAdminOrManager = in_array($userRole, ['admin', 'manager']);
$message = '';
$error = '';

// ==========================================
// 1. TRAITEMENT DU CRUD DES CATÉGORIES (ADMIN/MANAGER UNIQUEMENT)
// ==========================================
if ($isAdminOrManager && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_category'])) {
    $catName = trim($_POST['category_name'] ?? '');
    $catDesc = trim($_POST['category_description'] ?? '');

    if (!empty($catName)) {
        try {
            $stmt = $pdo->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
            $stmt->execute([$catName, $catDesc]);
            logAction($pdo, $_SESSION['user_id'], "Création de la catégorie : $catName");
            $message = "Catégorie créée avec succès !";
        } catch (PDOException $e) {
            $error = "Erreur : " . ($e->getCode() == 23000 ? "Cette catégorie existe déjà." : $e->getMessage());
        }
    }
}

if ($isAdminOrManager && isset($_GET['delete_category'])) {
    $catId = (int)$_GET['delete_category'];
    try {
        // Vérifier si des produits sont dans cette catégorie
        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM products WHERE category_id = ?");
        $stmtCheck->execute([$catId]);
        
        if ($stmtCheck->fetchColumn() > 0) {
            $error = "Impossible de supprimer cette catégorie car elle contient des produits.";
        } else {
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$catId]);
            logAction($pdo, $_SESSION['user_id'], "Suppression de la catégorie ID : $catId");
            $message = "Catégorie supprimée avec succès !";
        }
    } catch (PDOException $e) {
        $error = "Erreur de suppression : " . $e->getMessage();
    }
}

// ==========================================
// 2. TRAITEMENT DU CRUD DES PRODUITS (ADMIN/MANAGER UNIQUEMENT)
// ==========================================
if ($isAdminOrManager && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_product'])) {
    $prodId = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
    $barcode = trim($_POST['barcode'] ?? '') ?: null;
    $name = trim($_POST['name'] ?? '');
    $desc = trim($_POST['description'] ?? '');
    $catId = (int)$_POST['category_id'] ?: null;
    $purchasePrice = (float)($_POST['purchase_price'] ?? 0);
    $salePrice = (float)($_POST['sale_price'] ?? 0);
    $stockQty = (int)($_POST['stock_qty'] ?? 0);
    $minAlert = (int)($_POST['min_stock_alert'] ?? 5);

    if (!empty($name)) {
        try {
            if ($prodId > 0) {
                // Modification
                $stmt = $pdo->prepare("
                    UPDATE products 
                    SET barcode = ?, name = ?, description = ?, category_id = ?, purchase_price = ?, sale_price = ?, stock_qty = ?, min_stock_alert = ?
                    WHERE id = ?
                ");
                $stmt->execute([$barcode, $name, $desc, $catId, $purchasePrice, $salePrice, $stockQty, $minAlert, $prodId]);
                logAction($pdo, $_SESSION['user_id'], "Modification du produit : $name (ID: $prodId)");
                $message = "Produit modifié avec succès !";
            } else {
                // Création
                $stmt = $pdo->prepare("
                    INSERT INTO products (barcode, name, description, category_id, purchase_price, sale_price, stock_qty, min_stock_alert)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$barcode, $name, $desc, $catId, $purchasePrice, $salePrice, $stockQty, $minAlert]);
                
                // Enregistrer également une entrée de stock initiale
                $newProdId = $pdo->lastInsertId();
                if ($stockQty > 0) {
                    $stmtMove = $pdo->prepare("INSERT INTO stock_movements (product_id, type, quantity, notes, user_id) VALUES (?, 'in', ?, 'Stock initial', ?)");
                    $stmtMove->execute([$newProdId, $stockQty, $_SESSION['user_id']]);
                }
                
                logAction($pdo, $_SESSION['user_id'], "Création du produit : $name");
                $message = "Produit ajouté avec succès !";
            }
        } catch (PDOException $e) {
            $error = "Erreur produit : " . ($e->getCode() == 23000 ? "Ce code-barres est déjà attribué à un autre article." : $e->getMessage());
        }
    }
}

if ($isAdminOrManager && isset($_GET['delete_product'])) {
    $prodId = (int)$_GET['delete_product'];
    try {
        // Vérifier si des ventes référencent ce produit
        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM sale_items WHERE product_id = ?");
        $stmtCheck->execute([$prodId]);
        
        if ($stmtCheck->fetchColumn() > 0) {
            $error = "Impossible de supprimer ce produit car il existe dans l'historique des ventes.";
        } else {
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$prodId]);
            logAction($pdo, $_SESSION['user_id'], "Suppression du produit ID : $prodId");
            $message = "Produit supprimé avec succès !";
        }
    } catch (PDOException $e) {
        $error = "Erreur de suppression : " . $e->getMessage();
    }
}

// ==========================================
// 3. IMPORTATION CATALOGUE CSV / EXCEL
// ==========================================
if ($isAdminOrManager && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['import_csv'])) {
    if (isset($_FILES['csv_file']) && $_FILES['csv_file']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['csv_file']['tmp_name'];
        $handle = fopen($fileTmpPath, 'r');
        
        if ($handle !== FALSE) {
            $inserted = 0;
            $updated = 0;
            $lineCount = 0;
            
            // Démarrer une transaction
            $pdo->beginTransaction();
            try {
                // Lire ligne par ligne
                while (($data = fgetcsv($handle, 1000, ";")) !== FALSE) {
                    $lineCount++;
                    // Sauter l'en-tête
                    if ($lineCount === 1) continue;
                    
                    // Format attendu: CodeBarre;Nom;Description;CategorieID;PrixAchat;PrixVente;StockInitial;SeuilAlerte
                    $barcode = trim($data[0] ?? '') ?: null;
                    $name = trim($data[1] ?? '');
                    $desc = trim($data[2] ?? '');
                    $catId = (int)($data[3] ?? 0) ?: null;
                    $purchasePrice = (float)($data[4] ?? 0.00);
                    $salePrice = (float)($data[5] ?? 0.00);
                    $stockQty = (int)($data[6] ?? 0);
                    $minAlert = (int)($data[7] ?? 5);
                    
                    if (empty($name)) continue;
                    
                    // Vérifier si le code-barres existe déjà
                    $checkStmt = $pdo->prepare("SELECT id FROM products WHERE barcode = ? AND barcode IS NOT NULL");
                    $checkStmt->execute([$barcode]);
                    $existingId = $checkStmt->fetchColumn();
                    
                    if ($existingId) {
                        // Mettre à jour
                        $upStmt = $pdo->prepare("
                            UPDATE products 
                            SET name = ?, description = ?, category_id = ?, purchase_price = ?, sale_price = ?, stock_qty = stock_qty + ?, min_stock_alert = ?
                            WHERE id = ?
                        ");
                        $upStmt->execute([$name, $desc, $catId, $purchasePrice, $salePrice, $stockQty, $minAlert, $existingId]);
                        
                        if ($stockQty > 0) {
                            $stmtMove = $pdo->prepare("INSERT INTO stock_movements (product_id, type, quantity, notes, user_id) VALUES (?, 'in', ?, 'Réapprovisionnement CSV', ?)");
                            $stmtMove->execute([$existingId, $stockQty, $_SESSION['user_id']]);
                        }
                        $updated++;
                    } else {
                        // Insérer
                        $inStmt = $pdo->prepare("
                            INSERT INTO products (barcode, name, description, category_id, purchase_price, sale_price, stock_qty, min_stock_alert)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ");
                        $inStmt->execute([$barcode, $name, $desc, $catId, $purchasePrice, $salePrice, $stockQty, $minAlert]);
                        $newId = $pdo->lastInsertId();
                        
                        if ($stockQty > 0) {
                            $stmtMove = $pdo->prepare("INSERT INTO stock_movements (product_id, type, quantity, notes, user_id) VALUES (?, 'in', ?, 'Stock initial CSV', ?)");
                            $stmtMove->execute([$newId, $stockQty, $_SESSION['user_id']]);
                        }
                        $inserted++;
                    }
                }
                
                fclose($handle);
                $pdo->commit();
                logAction($pdo, $_SESSION['user_id'], "Importation catalogue CSV. $inserted insérés, $updated mis à jour");
                $message = "Importation réussie ! $inserted produits créés, $updated produits mis à jour.";
            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                fclose($handle);
                $error = "Erreur lors du traitement du fichier CSV : " . $e->getMessage();
            }
        } else {
            $error = "Impossible d'ouvrir le fichier téléversé.";
        }
    } else {
        $error = "Erreur de téléversement du fichier.";
    }
}

// ==========================================
// 4. RÉCUPÉRATION DES DONNÉES DE FLUX
// ==========================================
// Liste des catégories
$categories = $pdo->query("SELECT * FROM categories ORDER BY name ASC")->fetchAll();

// Liste filtrée des produits
$search = trim($_GET['search_term'] ?? '');
$catFilter = isset($_GET['cat_id']) ? (int)$_GET['cat_id'] : 0;

$prodQuery = "SELECT p.*, c.name as category_name 
              FROM products p 
              LEFT JOIN categories c ON p.category_id = c.id 
              WHERE 1=1";
$params = [];

if ($catFilter > 0) {
    $prodQuery .= " AND p.category_id = ?";
    $params[] = $catFilter;
}

if (!empty($search)) {
    $prodQuery .= " AND (p.name LIKE ? OR p.barcode LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$prodQuery .= " ORDER BY p.stock_qty <= p.min_stock_alert DESC, p.name ASC";
$stmtProd = $pdo->prepare($prodQuery);
$stmtProd->execute($params);
$products = $stmtProd->fetchAll();
?>

<!-- Bannières de Statut -->
<?php if (!empty($message)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo addslashes($message); ?>", 'success'));</script>
<?php endif; ?>
<?php if (!empty($error)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo addslashes($error); ?>", 'danger'));</script>
<?php endif; ?>

<!-- Injection des Actions dans l'En-tête ERP -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const actionContainer = document.getElementById('erp-page-actions');
        if (actionContainer) {
            actionContainer.innerHTML = `
                <?php if ($isAdminOrManager): ?>
                <button type="button" class="erp-btn erp-btn-primary" onclick="openAddProductModal()">Nouveau Produit</button>
                <button type="button" class="erp-btn erp-btn-secondary" onclick="openModal('importModal')">Importer CSV</button>
                <?php endif; ?>
                
                <div class="erp-view-switcher" style="margin-left: 15px; padding-left: 15px; border-left: 1px solid var(--erp-border);">
                    <button class="erp-view-btn active" onclick="switchErpView('kanban')" id="btn-view-kanban" title="Vue Kanban">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </button>
                    <button class="erp-view-btn" onclick="switchErpView('list')" id="btn-view-list" title="Vue Liste">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    </button>
                </div>
            `;
        }
    });
</script>

<!-- Onglets internes (Produits vs Catégories) -->
<div style="margin-bottom: 20px; border-bottom: 1px solid var(--erp-border); padding-bottom: 10px;">
    <button class="erp-btn" id="tab-btn-products" onclick="switchTab('products')" style="background-color: transparent; font-weight: bold; color: var(--erp-primary); border-bottom: 2px solid var(--erp-primary); border-radius: 0;">Catalogue des Produits</button>
    <button class="erp-btn" id="tab-btn-categories" onclick="switchTab('categories')" style="background-color: transparent; color: var(--erp-text-muted); border-radius: 0;">Gestion des Catégories</button>
</div>

<!-- ==========================================================================
     TAB 1: CATALOGUE DES PRODUITS
     ========================================================================== -->
<div id="tab-products">
    
    <!-- Barre de Recherche Façon Odoo -->
    <div style="background: white; padding: 10px 15px; border: 1px solid var(--erp-border); border-radius: 4px; margin-bottom: 20px; display: flex; gap: 15px;">
        <form method="GET" action="index.php" style="display: flex; width: 100%; gap: 15px; align-items: center;">
            <input type="hidden" name="page" value="products">
            <div style="flex: 1; position: relative;">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="position: absolute; left: 10px; top: 10px; color: #9ca3af;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" name="search_term" placeholder="Rechercher par nom ou code-barres..." value="<?php echo htmlspecialchars($search); ?>" style="width: 100%; padding: 8px 10px 8px 35px; border: 1px solid #e5e7eb; border-radius: 4px; outline: none;">
            </div>
            <select name="cat_id" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; min-width: 200px; outline: none;">
                <option value="0">Toutes Catégories</option>
                <?php foreach ($categories as $cat): ?>
                    <option value="<?php echo $cat['id']; ?>" <?php echo $catFilter === $cat['id'] ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($cat['name']); ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <button type="submit" class="erp-btn erp-btn-secondary">Filtrer</button>
        </form>
    </div>

    <!-- VUE KANBAN (Cartes) -->
    <div id="erp-view-kanban" class="erp-kanban-view">
        <?php if (empty($products)): ?>
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--erp-text-muted);">
                Aucun produit ne correspond à ces critères.
            </div>
        <?php else: ?>
            <?php foreach ($products as $p): 
                $isOut = $p['stock_qty'] <= 0;
                $isLow = $p['stock_qty'] > 0 && $p['stock_qty'] <= $p['min_stock_alert'];
            ?>
                <div class="erp-kanban-card" <?php if($isAdminOrManager) echo "onclick='openEditProductModal(".json_encode($p).")'"; ?>>
                    <div class="erp-kanban-image">
                        <?php echo strtoupper(substr($p['name'], 0, 2)); ?>
                    </div>
                    <div class="erp-kanban-details">
                        <div class="erp-kanban-title"><?php echo htmlspecialchars($p['name']); ?></div>
                        <div class="erp-kanban-subtitle"><?php echo number_format($p['sale_price'], 0, ',', ' '); ?> FCFA</div>
                        <div class="erp-kanban-bottom">
                            <span class="erp-badge <?php echo $isOut ? 'erp-badge-danger' : 'erp-badge-success'; ?>">
                                <?php echo $p['stock_qty']; ?> Unités
                            </span>
                            <?php if ($p['category_name']): ?>
                                <small style="color: var(--erp-text-muted); font-size: 0.75rem;"><?php echo htmlspecialchars($p['category_name']); ?></small>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <!-- VUE LISTE (Tableau dense) -->
    <div id="erp-view-list" style="display: none; background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto;">
        <table class="erp-list-view">
            <thead>
                <tr>
                    <th style="width: 40px;"><input type="checkbox"></th>
                    <th>Article</th>
                    <th>Code interne</th>
                    <th>Catégorie</th>
                    <th>Prix Vente</th>
                    <th>Quantité</th>
                    <th>Statut</th>
                    <?php if ($isAdminOrManager): ?><th style="text-align: right;">Actions</th><?php endif; ?>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($products)): ?>
                    <tr><td colspan="8" style="text-align: center; padding: 20px;">Aucun produit trouvé.</td></tr>
                <?php else: ?>
                    <?php foreach ($products as $p): 
                        $isOut = $p['stock_qty'] <= 0;
                        $isLow = $p['stock_qty'] > 0 && $p['stock_qty'] <= $p['min_stock_alert'];
                    ?>
                        <tr <?php if($isAdminOrManager) echo "ondblclick='openEditProductModal(".json_encode($p).")'"; ?>>
                            <td><input type="checkbox"></td>
                            <td style="font-weight: 500; color: var(--erp-primary);"><?php echo htmlspecialchars($p['name']); ?></td>
                            <td><?php echo htmlspecialchars($p['barcode'] ?: '-'); ?></td>
                            <td><?php echo htmlspecialchars($p['category_name'] ?: 'N/A'); ?></td>
                            <td><?php echo number_format($p['sale_price'], 0, ',', ' '); ?> FCFA</td>
                            <td style="font-weight: 600; <?php echo $isOut ? 'color: #e11d48;' : ''; ?>"><?php echo $p['stock_qty']; ?></td>
                            <td>
                                <span class="erp-badge <?php echo $isOut ? 'erp-badge-danger' : 'erp-badge-success'; ?>">
                                    <?php echo $isOut ? 'Rupture' : ($isLow ? 'À réapprovisionner' : 'En stock'); ?>
                                </span>
                            </td>
                            <?php if ($isAdminOrManager): ?>
                                <td style="text-align: right;">
                                    <a href="index.php?page=products&delete_product=<?php echo $p['id']; ?>" class="erp-btn erp-btn-secondary" style="padding: 2px 8px; color: #e11d48;" onclick="return confirm('Supprimer ce produit ?')">✕</a>
                                </td>
                            <?php endif; ?>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ==========================================================================
     TAB 2: CATÉGORIES
     ========================================================================== -->
<div id="tab-categories" style="display: none;">
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
        
        <!-- Formulaire de création -->
        <div style="background: white; padding: 20px; border: 1px solid var(--erp-border); border-radius: 4px; align-self: start;">
            <h3 style="margin-bottom: 15px; font-size: 1.1rem;">Créer une Catégorie</h3>
            <?php if ($isAdminOrManager): ?>
                <form method="POST" action="index.php?page=products">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Désignation *</label>
                        <input type="text" name="category_name" required placeholder="Ex: Informatique" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Description</label>
                        <textarea name="category_description" rows="3" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;"></textarea>
                    </div>
                    <button type="submit" name="add_category" class="erp-btn erp-btn-primary" style="width: 100%;">Enregistrer</button>
                </form>
            <?php endif; ?>
        </div>

        <!-- Liste des catégories -->
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow: hidden;">
            <table class="erp-list-view">
                <thead>
                    <tr>
                        <th>Catégorie</th>
                        <th>Description</th>
                        <?php if ($isAdminOrManager): ?><th style="text-align: right;">Actions</th><?php endif; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($categories)): ?>
                        <tr><td colspan="3" style="text-align: center; padding: 20px;">Aucune catégorie.</td></tr>
                    <?php else: ?>
                        <?php foreach ($categories as $cat): ?>
                            <tr>
                                <td style="font-weight: 500; color: var(--erp-primary);"><?php echo htmlspecialchars($cat['name']); ?></td>
                                <td style="color: var(--erp-text-muted);"><?php echo htmlspecialchars($cat['description'] ?: '-'); ?></td>
                                <?php if ($isAdminOrManager): ?>
                                    <td style="text-align: right;">
                                        <a href="index.php?page=products&delete_category=<?php echo $cat['id']; ?>" class="erp-btn erp-btn-secondary" style="padding: 2px 8px; color: #e11d48;" onclick="return confirm('Supprimer ?')">✕</a>
                                    </td>
                                <?php endif; ?>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- ==========================================================================
     MODALS PRODUITS
     ========================================================================== -->

<!-- 1. Modal CRUD Produit (Ajout/Modification) -->
<?php if ($isAdminOrManager): ?>
<div class="modal" id="productModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="product-modal-title">Ajouter un Produit</h3>
            <button type="button" class="modal-close"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        
        <div class="modal-body">
            <form method="POST" action="index.php?page=products">
                <input type="hidden" name="product_id" id="form-product-id" value="0">
                
                <div class="form-group">
                    <label class="form-label" for="form-barcode">Code-barres (EAN13 ou Interne)</label>
                    <input class="form-control" type="text" id="form-barcode" name="barcode" placeholder="Ex: 5449000000996">
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="form-name">Désignation de l'article *</label>
                    <input class="form-control" type="text" id="form-name" name="name" required placeholder="Ex: Sac de Riz Parfumé 5kg">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label" for="form-purchase-price">Prix Achat (FCFA) *</label>
                        <input class="form-control" type="number" id="form-purchase-price" name="purchase_price" required min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="form-sale-price">Prix Vente (FCFA) *</label>
                        <input class="form-control" type="number" id="form-sale-price" name="sale_price" required min="0">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group" id="stock-input-container">
                        <label class="form-label" for="form-stock-qty">Quantité Initiale *</label>
                        <input class="form-control" type="number" id="form-stock-qty" name="stock_qty" min="0" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="form-min-alert">Alerte Seuil Bas *</label>
                        <input class="form-control" type="number" id="form-min-alert" name="min_stock_alert" min="1" value="5">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="form-category-id">Catégorie</label>
                    <select name="category_id" id="form-category-id" class="form-control">
                        <option value="0">Aucune catégorie</option>
                        <?php foreach ($categories as $cat): ?>
                            <option value="<?php echo $cat['id']; ?>">
                                <?php echo htmlspecialchars($cat['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="form-description">Description produit</label>
                    <textarea class="form-control" id="form-description" name="description" rows="2" placeholder="Informations complémentaires sur le produit..."></textarea>
                </div>
                
                <button type="submit" name="save_product" class="btn btn-success" style="width: 100%; justify-content: center; padding: 12px; margin-top: 10px;">Enregistrer le Produit</button>
            </form>
        </div>
    </div>
</div>

<!-- 2. Modal Importation CSV -->
<div class="modal" id="importModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Importer un Catalogue CSV</h3>
            <button type="button" class="modal-close"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        
        <div class="modal-body">
            <form method="POST" action="index.php?page=products" enctype="multipart/form-data">
                <div class="form-group">
                    <label class="form-label">Sélectionner le fichier (.csv)</label>
                    <input type="file" name="csv_file" class="form-control" accept=".csv" required>
                </div>
                
                <div style="background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 15px; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">
                    <p style="font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">Format attendu pour le fichier CSV :</p>
                    <p>Le séparateur doit être un point-virgule (<code>;</code>).</p>
                    <p style="font-family: monospace; margin: 6px 0; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 4px; overflow-x: auto; white-space: nowrap;">
                        CodeBarre;Nom;Description;CategorieID;PrixAchat;PrixVente;StockInitial;SeuilAlerte
                    </p>
                    <p>Exemple :<br><code>5449000000996;Coca-Cola 330ml;Canette;2;250;400;150;10</code></p>
                </div>
                
                <button type="submit" name="import_csv" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px;">Démarrer l'importation</button>
            </form>
        </div>
    </div>
</div>
<?php endif; ?>

<!-- Script Onglets & Modals CRUD -->
<script>
function switchTab(tab) {
    const productsTab = document.getElementById('tab-products');
    const categoriesTab = document.getElementById('tab-categories');
    const productsBtn = document.getElementById('tab-btn-products');
    const categoriesBtn = document.getElementById('tab-btn-categories');
    
    if (tab === 'products') {
        productsTab.style.display = 'block';
        categoriesTab.style.display = 'none';
        
        productsBtn.className = 'btn btn-primary';
        productsBtn.style.backgroundColor = 'var(--accent)';
        categoriesBtn.className = 'btn btn-secondary';
        categoriesBtn.style.backgroundColor = '';
    } else {
        productsTab.style.display = 'none';
        categoriesTab.style.display = 'block';
        
        productsBtn.className = 'btn btn-secondary';
        productsBtn.style.backgroundColor = '';
        categoriesBtn.className = 'btn btn-primary';
        categoriesBtn.style.backgroundColor = 'var(--accent)';
    }
}

// Ouvrir modal ajout
function openAddProductModal() {
    document.getElementById('product-modal-title').textContent = "Ajouter un Produit";
    document.getElementById('form-product-id').value = "0";
    document.getElementById('form-barcode').value = "";
    document.getElementById('form-name').value = "";
    document.getElementById('form-purchase-price').value = "";
    document.getElementById('form-sale-price').value = "";
    document.getElementById('form-stock-qty').value = "0";
    document.getElementById('form-min-alert').value = "5";
    document.getElementById('form-category-id').value = "0";
    document.getElementById('form-description').value = "";
    
    // Rendre visible l'input stock au moment de la création
    document.getElementById('stock-input-container').style.display = 'block';
    
    openModal('productModal');
}

// Ouvrir modal modification
function openEditProductModal(p) {
    document.getElementById('product-modal-title').textContent = "Modifier : " + p.name;
    document.getElementById('form-product-id').value = p.id;
    document.getElementById('form-barcode').value = p.barcode || "";
    document.getElementById('form-name').value = p.name;
    document.getElementById('form-purchase-price').value = p.purchase_price;
    document.getElementById('form-sale-price').value = p.sale_price;
    document.getElementById('form-stock-qty').value = p.stock_qty;
    document.getElementById('form-min-alert').value = p.min_stock_alert;
    document.getElementById('form-category-id').value = p.category_id || "0";
    document.getElementById('form-description').value = p.description || "";
    
    // Cacher l'input stock au moment de l'édition pour éviter d'écraser sauvagement les stocks réels.
    // Les ajustements de stock se font proprement dans le module de stock dédié !
    document.getElementById('stock-input-container').style.display = 'none';
    
    openModal('productModal');
}
</script>
