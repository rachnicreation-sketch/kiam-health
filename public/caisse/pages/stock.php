<?php
/**
 * Gestion du Stock (Entrées/Sorties) - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : réservé aux Admins et Gestionnaires
requireRole(['admin', 'manager']);

$message = '';
$error = '';

// ==========================================
// 1. ENREGISTRER UN AJUSTEMENT DE STOCK MANUEL
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['adjust_stock'])) {
    $productId = (int)$_POST['product_id'];
    $type = $_POST['type']; // 'in' ou 'out'
    $qty = (int)$_POST['quantity'];
    $notes = trim($_POST['notes'] ?? '');
    $userId = $_SESSION['user_id'];

    if ($productId > 0 && $qty > 0 && in_array($type, ['in', 'out'])) {
        try {
            $pdo->beginTransaction();

            // 1. Récupérer le produit pour vérification et log
            $prodStmt = $pdo->prepare("SELECT name, stock_qty FROM products WHERE id = ?");
            $prodStmt->execute([$productId]);
            $product = $prodStmt->fetch();

            if (!$product) {
                throw new Exception("Produit introuvable.");
            }

            // Si c'est une sortie, vérifier qu'on ne retire pas plus que le stock actuel
            if ($type === 'out' && $qty > $product['stock_qty']) {
                throw new Exception("Impossible de faire une sortie supérieure au stock actuel (" . $product['stock_qty'] . " art. max).");
            }

            // 2. Insérer le mouvement de stock
            $stmtInsert = $pdo->prepare("
                INSERT INTO stock_movements (product_id, type, quantity, notes, user_id)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmtInsert->execute([$productId, $type, $qty, $notes ?: 'Ajustement manuel', $userId]);

            // 3. Mettre à jour la quantité du produit
            $operator = ($type === 'in') ? '+' : '-';
            $stmtUpdate = $pdo->prepare("UPDATE products SET stock_qty = stock_qty $operator ? WHERE id = ?");
            $stmtUpdate->execute([$qty, $productId]);

            $pdo->commit();
            
            $actionLabel = ($type === 'in') ? "Entrée de stock" : "Sortie de stock";
            logAction($pdo, $userId, "$actionLabel de $qty unités pour le produit : " . $product['name']);
            $message = "Stock ajusté avec succès !";
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $error = $e->getMessage();
        }
    } else {
        $error = "Veuillez remplir tous les champs correctement.";
    }
}

// ==========================================
// 2. RÉCUPÉRER LES DONNÉES
// ==========================================
// Liste de tous les produits pour le formulaire
$allProducts = $pdo->query("SELECT id, name, barcode, stock_qty FROM products ORDER BY name ASC")->fetchAll();

// Liste des mouvements de stock récents
$movementsStmt = $pdo->query("
    SELECT sm.*, p.name as product_name, p.barcode as product_barcode, u.name as user_name
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    LEFT JOIN users u ON sm.user_id = u.id
    ORDER BY sm.created_at DESC
    LIMIT 100
");
$movements = $movementsStmt->fetchAll();
?>

<!-- Bannières de Statut -->
<?php if (!empty($message)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo $message; ?>", 'success'));</script>
<?php endif; ?>
<?php if (!empty($error)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo $error; ?>", 'danger'));</script>
<?php endif; ?>

<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
    <!-- Formulaire d'ajustement rapide (Gauche) -->
    <div style="background: white; padding: 20px; border: 1px solid var(--erp-border); border-radius: 4px; align-self: start;">
        <h3 style="margin-bottom: 15px; font-size: 1.1rem;">Ajustement de Stock</h3>
        
        <form method="POST" action="index.php?page=stock">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Sélectionner l'article *</label>
                <select name="product_id" id="product_id" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;" required>
                    <option value="">-- Choisir un produit --</option>
                    <?php foreach ($allProducts as $p): ?>
                        <option value="<?php echo $p['id']; ?>">
                            <?php echo htmlspecialchars($p['name']); ?> <?php echo $p['barcode'] ? '('.$p['barcode'].')' : ''; ?> [Stock: <?php echo $p['stock_qty']; ?>]
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Type d'Opération *</label>
                <div style="display: flex; gap: 15px; margin-top: 5px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="radio" name="type" value="in" checked style="accent-color: #059669; width: 16px; height: 16px;">
                        <span style="color: #059669; font-weight: 500;">Entrée (Réappro)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="radio" name="type" value="out" style="accent-color: #e11d48; width: 16px; height: 16px;">
                        <span style="color: #e11d48; font-weight: 500;">Sortie (Perte)</span>
                    </label>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Quantité d'articles *</label>
                <input type="number" name="quantity" id="quantity" min="1" required placeholder="Ex: 25" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Notes & Justification</label>
                <textarea name="notes" id="notes" rows="3" placeholder="Ex: Livraison fournisseur..." style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;"></textarea>
            </div>

            <button type="submit" name="adjust_stock" class="erp-btn erp-btn-primary" style="width: 100%;">Valider l'Opération</button>
        </form>
    </div>

    <!-- Journal d'historique d'audit (Droite) -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow: hidden; display: flex; flex-direction: column;">
        <div style="padding: 15px; border-bottom: 1px solid var(--erp-border); background-color: #f9fafb;">
            <h3 style="margin: 0; font-size: 1.1rem; color: var(--erp-text-main);">Journal des Mouvements</h3>
        </div>
        
        <div style="overflow-x: auto; max-height: 600px; overflow-y: auto;">
            <table class="erp-list-view">
                <thead>
                    <tr>
                        <th>Date & Heure</th>
                        <th>Article</th>
                        <th>Opération</th>
                        <th>Quantité</th>
                        <th>Notes</th>
                        <th>Opérateur</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($movements)): ?>
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 20px; color: var(--erp-text-muted);">Aucun mouvement enregistré.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($movements as $m): 
                            $isIn = $m['type'] === 'in';
                            $isOut = $m['type'] === 'out';
                        ?>
                            <tr>
                                <td style="color: var(--erp-text-muted);"><?php echo date('d/m/Y H:i', strtotime($m['created_at'])); ?></td>
                                <td>
                                    <div style="font-weight: 500; color: var(--erp-primary);"><?php echo htmlspecialchars($m['product_name']); ?></div>
                                </td>
                                <td>
                                    <span class="erp-badge <?php echo $isIn ? 'erp-badge-success' : 'erp-badge-danger'; ?>">
                                        <?php echo $isIn ? 'Entrée' : 'Sortie'; ?>
                                    </span>
                                </td>
                                <td style="font-weight: 600; color: <?php echo $isIn ? '#059669' : '#e11d48'; ?>;">
                                    <?php echo $isIn ? '+' : '-'; ?><?php echo $m['quantity']; ?>
                                </td>
                                <td><span style="font-size: 0.85rem; color: var(--erp-text-muted);"><?php echo htmlspecialchars($m['notes'] ?: '-'); ?></span></td>
                                <td><span style="font-size: 0.85rem;"><?php echo htmlspecialchars($m['user_name'] ?: 'Système'); ?></span></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
