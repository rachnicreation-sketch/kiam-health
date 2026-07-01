<?php
/**
 * Suivi Analytique des Dépenses de Caisse - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : réservé aux Admins et Gestionnaires
requireRole(['admin', 'manager']);

$message = '';
$error = '';

// ==========================================
// 1. TRAITEMENT DU CRUD DES DÉPENSES
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_expense'])) {
    $expId = isset($_POST['expense_id']) ? (int)$_POST['expense_id'] : 0;
    $title = trim($_POST['title'] ?? '');
    $category = $_POST['category']; // 'rent', 'utilities', 'salaries', 'transport', 'other'
    $amount = (float)$_POST['amount'];
    $expDate = $_POST['expense_date'];
    $notes = trim($_POST['notes'] ?? '');

    if (!empty($title) && $amount > 0 && !empty($expDate)) {
        try {
            if ($expId > 0) {
                // Modification
                $stmt = $pdo->prepare("
                    UPDATE expenses 
                    SET title = ?, category = ?, amount = ?, expense_date = ?, notes = ?
                    WHERE id = ?
                ");
                $stmt->execute([$title, $category, $amount, $expDate, $notes, $expId]);
                logAction($pdo, $_SESSION['user_id'], "Modification de la dépense : $title (Montant: $amount FCFA)");
                $message = "Dépense modifiée avec succès !";
            } else {
                // Création
                $stmt = $pdo->prepare("
                    INSERT INTO expenses (title, category, amount, expense_date, notes, user_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$title, $category, $amount, $expDate, $notes, $_SESSION['user_id']]);
                logAction($pdo, $_SESSION['user_id'], "Enregistrement de la dépense : $title (Montant: $amount FCFA)");
                $message = "Dépense enregistrée avec succès !";
            }
        } catch (PDOException $e) {
            $error = "Erreur de base de données : " . $e->getMessage();
        }
    } else {
        $error = "Veuillez remplir tous les champs obligatoires.";
    }
}

if (isset($_GET['delete_expense'])) {
    $expId = (int)$_GET['delete_expense'];
    try {
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
        $stmt->execute([$expId]);
        logAction($pdo, $_SESSION['user_id'], "Suppression de la dépense ID : $expId");
        $message = "Dépense supprimée avec succès !";
    } catch (PDOException $e) {
        $error = "Erreur de suppression : " . $e->getMessage();
    }
}

// ==========================================
// 2. RÉCUPÉRATION DES AGGREGATS DÉPENSES
// ==========================================
$todayExpenses = (float)$pdo->query("SELECT SUM(amount) FROM expenses WHERE DATE(expense_date) = CURDATE()")->fetchColumn() ?: 0.00;
$monthExpenses = (float)$pdo->query("SELECT SUM(amount) FROM expenses WHERE MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE())")->fetchColumn() ?: 0.00;
$yearExpenses = (float)$pdo->query("SELECT SUM(amount) FROM expenses WHERE YEAR(expense_date) = YEAR(CURDATE())")->fetchColumn() ?: 0.00;

// ==========================================
// 3. RÉCUPÉRATION DE LA LISTE FILTRÉE
// ==========================================
$catFilter = $_GET['cat_filter'] ?? '';
$startDate = $_GET['start_date'] ?? '';
$endDate = $_GET['end_date'] ?? '';

$query = "SELECT sm.*, u.name as user_name
          FROM expenses sm
          LEFT JOIN users u ON sm.user_id = u.id
          WHERE 1=1";
$params = [];

if (!empty($catFilter)) {
    $query .= " AND sm.category = ?";
    $params[] = $catFilter;
}

if (!empty($startDate)) {
    $query .= " AND sm.expense_date >= ?";
    $params[] = $startDate;
}

if (!empty($endDate)) {
    $query .= " AND sm.expense_date <= ?";
    $params[] = $endDate;
}

$query .= " ORDER BY sm.expense_date DESC, sm.created_at DESC";
$stmtExp = $pdo->prepare($query);
$stmtExp->execute($params);
$expenses = $stmtExp->fetchAll();

// Libellés de catégories
function getExpenseCategoryLabel($cat) {
    switch ($cat) {
        case 'rent': return 'Loyer commercial';
        case 'utilities': return 'Factures (Senelec/Sde)';
        case 'salaries': return 'Salaires & Rémunérations';
        case 'transport': return 'Frais de transport';
        default: return 'Autres charges';
    }
}
?>

<!-- Bannières de Statut -->
<?php if (!empty($message)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo $message; ?>", 'success'));</script>
<?php endif; ?>
<?php if (!empty($error)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo $error; ?>", 'danger'));</script>
<?php endif; ?>

<!-- Injection de l'Action Nouveau dans l'En-tête ERP -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const actionContainer = document.getElementById('erp-page-actions');
        if (actionContainer) {
            actionContainer.innerHTML = `
                <button type="button" class="erp-btn erp-btn-primary" onclick="openAddExpenseModal()">Déclarer une Dépense</button>
            `;
        }
    });
</script>

<!-- Grille des statistiques dépenses épurée -->
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px;">
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 15px 20px; border-left: 4px solid var(--erp-primary);">
        <div style="color: var(--erp-text-muted); font-size: 0.85rem; font-weight: 500; text-transform: uppercase;">Dépenses Aujourd'hui</div>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--erp-text-main); margin-top: 5px;"><?php echo number_format($todayExpenses, 0, ',', ' '); ?> <span style="font-size: 0.9rem; font-weight: 500;">FCFA</span></div>
    </div>
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 15px 20px; border-left: 4px solid #eab308;">
        <div style="color: var(--erp-text-muted); font-size: 0.85rem; font-weight: 500; text-transform: uppercase;">Charges ce Mois</div>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--erp-text-main); margin-top: 5px;"><?php echo number_format($monthExpenses, 0, ',', ' '); ?> <span style="font-size: 0.9rem; font-weight: 500;">FCFA</span></div>
    </div>
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 15px 20px; border-left: 4px solid #e11d48;">
        <div style="color: var(--erp-text-muted); font-size: 0.85rem; font-weight: 500; text-transform: uppercase;">Total Annuel</div>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--erp-text-main); margin-top: 5px;"><?php echo number_format($yearExpenses, 0, ',', ' '); ?> <span style="font-size: 0.9rem; font-weight: 500;">FCFA</span></div>
    </div>
</div>

<!-- Filtres de Recherche Façon Odoo -->
<div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 15px; margin-bottom: 20px;">
    <form method="GET" action="index.php" style="display: grid; grid-template-columns: 2fr 1fr 1fr 120px; gap: 15px;">
        <input type="hidden" name="page" value="expenses">
        
        <select name="cat_filter" style="padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
            <option value="">Toutes Catégories de Dépense</option>
            <option value="rent" <?php echo $catFilter === 'rent' ? 'selected' : ''; ?>>Loyer commercial</option>
            <option value="utilities" <?php echo $catFilter === 'utilities' ? 'selected' : ''; ?>>Factures (Senelec/Sde)</option>
            <option value="salaries" <?php echo $catFilter === 'salaries' ? 'selected' : ''; ?>>Salaires & Rémunérations</option>
            <option value="transport" <?php echo $catFilter === 'transport' ? 'selected' : ''; ?>>Frais de transport</option>
            <option value="other" <?php echo $catFilter === 'other' ? 'selected' : ''; ?>>Autres charges</option>
        </select>
        
        <input type="date" name="start_date" value="<?php echo htmlspecialchars($startDate); ?>" style="padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
        <input type="date" name="end_date" value="<?php echo htmlspecialchars($endDate); ?>" style="padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
        
        <button type="submit" class="erp-btn erp-btn-primary" style="justify-content: center; width: 100%;">Rechercher</button>
    </form>
</div>

<!-- Liste des Dépenses -->
<div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto;">
    <table class="erp-list-view">
        <thead>
            <tr>
                <th style="width: 40px;"><input type="checkbox"></th>
                <th>Date d'effet</th>
                <th>Titre / Description</th>
                <th>Catégorie de Dépense</th>
                <th>Montant</th>
                <th>Notes explicatives</th>
                <th>Déclaré par</th>
                <th style="text-align: right;">Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($expenses)): ?>
                <tr>
                    <td colspan="8" style="text-align: center; color: var(--erp-text-muted); padding: 30px;">Aucune charge répertoriée sur cette plage de recherche.</td>
                </tr>
            <?php else: ?>
                <?php foreach ($expenses as $e): ?>
                    <tr ondblclick='openEditExpenseModal(<?php echo json_encode($e); ?>)'>
                        <td><input type="checkbox"></td>
                        <td><strong><?php echo date('d/m/Y', strtotime($e['expense_date'])); ?></strong></td>
                        <td><strong style="color: var(--erp-primary);"><?php echo htmlspecialchars($e['title']); ?></strong></td>
                        <td><span class="erp-badge erp-badge-primary"><?php echo getExpenseCategoryLabel($e['category']); ?></span></td>
                        <td><strong style="color: #e11d48;"><?php echo number_format($e['amount'], 0, ',', ' '); ?> FCFA</strong></td>
                        <td><span style="font-size: 0.85rem; color: var(--erp-text-muted);"><?php echo htmlspecialchars($e['notes'] ?: '-'); ?></span></td>
                        <td><span style="font-size: 0.85rem;"><?php echo htmlspecialchars($e['user_name'] ?: 'Système'); ?></span></td>
                        <td style="text-align: right;">
                            <div style="display: inline-flex; gap: 8px;">
                                <button type="button" class="erp-btn erp-btn-secondary" style="padding: 2px 8px;" onclick='openEditExpenseModal(<?php echo json_encode($e); ?>)' title="Modifier">✏️</button>
                                <a href="index.php?page=expenses&delete_expense=<?php echo $e['id']; ?>" class="erp-btn erp-btn-secondary" style="padding: 2px 8px; color: #e11d48;" onclick="return confirm('Supprimer définitivement cette dépense ?')" title="Supprimer">✕</a>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<!-- ==========================================================================
     MODAL ENREGISTRER DÉPENSE
     ========================================================================== -->
<div class="modal" id="expenseModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="expense-modal-title">Déclarer une Dépense</h3>
            <button type="button" class="modal-close"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        
        <div class="modal-body">
            <form method="POST" action="index.php?page=expenses">
                <input type="hidden" name="expense_id" id="form-expense-id" value="0">
                
                <div class="form-group">
                    <label class="form-label" for="form-expense-title">Intitulé / Justificatif *</label>
                    <input class="form-control" type="text" id="form-expense-title" name="title" required placeholder="Ex: Recharge Senelec Woyofal">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label" for="form-expense-category">Catégorie *</label>
                        <select name="category" id="form-expense-category" class="form-control" required>
                            <option value="utilities">Factures (Senelec/Sde)</option>
                            <option value="rent">Loyer commercial</option>
                            <option value="salaries">Salaires & Rémunérations</option>
                            <option value="transport">Frais de transport</option>
                            <option value="other">Autres charges</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="form-expense-date">Date de Facturation *</label>
                        <input class="form-control" type="date" id="form-expense-date" name="expense_date" required value="<?php echo date('Y-m-d'); ?>">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="form-expense-amount">Montant déboursé (FCFA) *</label>
                    <input class="form-control" type="number" id="form-expense-amount" name="amount" required min="1" placeholder="Ex: 15000">
                </div>

                <div class="form-group">
                    <label class="form-label" for="form-expense-notes">Détails de la charge</label>
                    <textarea class="form-control" id="form-expense-notes" name="notes" rows="3" placeholder="Informations complémentaires utiles à la comptabilité..."></textarea>
                </div>
                
                <button type="submit" name="save_expense" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px; margin-top: 10px;">Valider la Dépense</button>
            </form>
        </div>
    </div>
</div>

<script>
function openAddExpenseModal() {
    document.getElementById('expense-modal-title').textContent = "Déclarer une Dépense";
    document.getElementById('form-expense-id').value = "0";
    document.getElementById('form-expense-title').value = "";
    document.getElementById('form-expense-category').value = "utilities";
    document.getElementById('form-expense-date').value = "<?php echo date('Y-m-d'); ?>";
    document.getElementById('form-expense-amount').value = "";
    document.getElementById('form-expense-notes').value = "";
    
    openModal('expenseModal');
}

function openEditExpenseModal(e) {
    document.getElementById('expense-modal-title').textContent = "Modifier Dépense : " + e.title;
    document.getElementById('form-expense-id').value = e.id;
    document.getElementById('form-expense-title').value = e.title;
    document.getElementById('form-expense-category').value = e.category;
    document.getElementById('form-expense-date').value = e.expense_date;
    document.getElementById('form-expense-amount').value = e.amount;
    document.getElementById('form-expense-notes').value = e.notes || "";
    
    openModal('expenseModal');
}
</script>
