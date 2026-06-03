<?php
/**
 * Gestion des Fournisseurs & Commandes d'achats - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : réservé aux Admins et Gestionnaires
requireRole(['admin', 'manager']);

$message = '';
$error = '';

// ==========================================
// 1. TRAITEMENT DU CRUD DES FOURNISSEURS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_supplier'])) {
    $supId = isset($_POST['supplier_id']) ? (int)$_POST['supplier_id'] : 0;
    $name = trim($_POST['name'] ?? '');
    $compName = trim($_POST['company_name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $debt = (float)($_POST['outstanding_debt'] ?? 0.00);

    if (!empty($name)) {
        try {
            if ($supId > 0) {
                // Modification
                $stmt = $pdo->prepare("
                    UPDATE suppliers 
                    SET name = ?, company_name = ?, phone = ?, email = ?, address = ?, outstanding_debt = ?
                    WHERE id = ?
                ");
                $stmt->execute([$name, $compName, $phone, $email, $address, $debt, $supId]);
                logAction($pdo, $_SESSION['user_id'], "Modification du fournisseur : $name (ID: $supId)");
                $message = "Fournisseur modifié avec succès !";
            } else {
                // Création
                $stmt = $pdo->prepare("
                    INSERT INTO suppliers (name, company_name, phone, email, address, outstanding_debt)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$name, $compName, $phone, $email, $address, $debt]);
                logAction($pdo, $_SESSION['user_id'], "Création du fournisseur : $name");
                $message = "Fournisseur créé avec succès !";
            }
        } catch (PDOException $e) {
            $error = "Erreur fournisseur : " . $e->getMessage();
        }
    }
}

if (isset($_GET['delete_supplier'])) {
    $supId = (int)$_GET['delete_supplier'];
    try {
        // Vérifier s'il a des commandes
        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM supplier_orders WHERE supplier_id = ?");
        $stmtCheck->execute([$supId]);
        
        if ($stmtCheck->fetchColumn() > 0) {
            $error = "Impossible de supprimer ce fournisseur car des commandes y sont rattachées.";
        } else {
            $stmt = $pdo->prepare("DELETE FROM suppliers WHERE id = ?");
            $stmt->execute([$supId]);
            logAction($pdo, $_SESSION['user_id'], "Suppression du fournisseur ID : $supId");
            $message = "Fournisseur supprimé avec succès !";
        }
    } catch (PDOException $e) {
        $error = "Erreur de suppression : " . $e->getMessage();
    }
}

// ==========================================
// 2. ENREGISTRER UNE COMMANDE FOURNISSEUR (ACHAT REAPPRO)
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_order'])) {
    $supplierId = (int)$_POST['order_supplier_id'];
    $orderDate = $_POST['order_date'];
    $totalAmount = (float)$_POST['total_amount'];
    $amountPaid = (float)$_POST['amount_paid'];
    $payStatus = $_POST['payment_status'];
    $status = $_POST['status'];

    if ($supplierId > 0 && $totalAmount > 0) {
        try {
            $pdo->beginTransaction();

            // 1. Insérer la commande
            $stmt = $pdo->prepare("
                INSERT INTO supplier_orders (supplier_id, order_date, total_amount, payment_status, amount_paid, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$supplierId, $orderDate, $totalAmount, $payStatus, $amountPaid, $status]);
            
            // 2. Si non totalement payé, rajouter la différence dans la dette fournisseur
            $unpaidBalance = $totalAmount - $amountPaid;
            if ($unpaidBalance > 0) {
                $stmtDebt = $pdo->prepare("UPDATE suppliers SET outstanding_debt = outstanding_debt + ? WHERE id = ?");
                $stmtDebt->execute([$unpaidBalance, $supplierId]);
            }

            $pdo->commit();
            logAction($pdo, $_SESSION['user_id'], "Enregistrement achat de réapprovisionnement fournisseur ID : $supplierId. Montant : $totalAmount FCFA");
            $message = "Commande d'achat enregistrée !";
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $error = "Erreur commande : " . $e->getMessage();
        }
    } else {
        $error = "Champs obligatoires manquants.";
    }
}

// ==========================================
// 3. RÉCUPÉRATION DES LISTES
// ==========================================
$suppliers = $pdo->query("SELECT * FROM suppliers ORDER BY company_name ASC")->fetchAll();

$ordersStmt = $pdo->query("
    SELECT so.*, s.company_name as supplier_company
    FROM supplier_orders so
    JOIN suppliers s ON so.supplier_id = s.id
    ORDER BY so.order_date DESC
    LIMIT 50
");
$orders = $ordersStmt->fetchAll();
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
                <button type="button" class="erp-btn erp-btn-secondary" onclick="openAddOrderModal()">Enregistrer un Achat</button>
                <button type="button" class="erp-btn erp-btn-primary" onclick="openAddSupplierModal()" style="margin-left: 10px;">Nouveau Fournisseur</button>
            `;
        }
    });
</script>

<!-- Onglets internes -->
<div style="margin-bottom: 20px; border-bottom: 1px solid var(--erp-border); padding-bottom: 10px;">
    <button class="erp-btn" id="tab-btn-suppliers" onclick="switchTab('suppliers')" style="background-color: transparent; font-weight: bold; color: var(--erp-primary); border-bottom: 2px solid var(--erp-primary); border-radius: 0;">Nos Fournisseurs</button>
    <button class="erp-btn" id="tab-btn-orders" onclick="switchTab('orders')" style="background-color: transparent; color: var(--erp-text-muted); border-radius: 0;">Bons d'Achats & Factures</button>
</div>

<!-- ==========================================================================
     TAB 1: NOS FOURNISSEURS
     ========================================================================== -->
<div id="tab-suppliers">
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto;">
        <table class="erp-list-view">
            <thead>
                <tr>
                    <th style="width: 40px;"><input type="checkbox"></th>
                    <th>Entreprise</th>
                    <th>Nom du contact</th>
                    <th>Téléphone</th>
                    <th>E-mail</th>
                    <th>Adresse physique</th>
                    <th>Dette due</th>
                    <th style="text-align: right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($suppliers)): ?>
                    <tr>
                        <td colspan="8" style="text-align: center; color: var(--erp-text-muted); padding: 30px;">Aucun fournisseur répertorié.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($suppliers as $s): ?>
                        <tr ondblclick='openEditSupplierModal(<?php echo json_encode($s); ?>)'>
                            <td><input type="checkbox"></td>
                            <td><strong style="color: var(--erp-primary);"><?php echo htmlspecialchars($s['company_name'] ?: '-'); ?></strong></td>
                            <td style="font-weight: 500;"><?php echo htmlspecialchars($s['name']); ?></td>
                            <td style="color: var(--erp-text-muted);"><?php echo htmlspecialchars($s['phone'] ?: '-'); ?></td>
                            <td><?php echo htmlspecialchars($s['email'] ?: '-'); ?></td>
                            <td><span style="font-size: 0.88rem; color: var(--erp-text-muted);"><?php echo htmlspecialchars($s['address'] ?: '-'); ?></span></td>
                            <td>
                                <span class="erp-badge <?php echo $s['outstanding_debt'] > 0 ? 'erp-badge-danger' : 'erp-badge-success'; ?>" style="font-weight: 600;">
                                    <?php echo number_format($s['outstanding_debt'], 0, ',', ' '); ?> FCFA
                                </span>
                            </td>
                            <td style="text-align: right;">
                                <div style="display: inline-flex; gap: 8px;">
                                    <button type="button" class="erp-btn erp-btn-secondary" style="padding: 2px 8px;" onclick='openEditSupplierModal(<?php echo json_encode($s); ?>)' title="Modifier">✏️</button>
                                    <a href="index.php?page=suppliers&delete_supplier=<?php echo $s['id']; ?>" class="erp-btn erp-btn-secondary" style="padding: 2px 8px; color: #e11d48;" onclick="return confirm('Supprimer ce fournisseur ?')" title="Supprimer">✕</a>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ==========================================================================
     TAB 2: BONS D'ACHATS & FACTURES
     ========================================================================== -->
<div id="tab-orders" style="display: none;">
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto;">
        <table class="erp-list-view">
            <thead>
                <tr>
                    <th style="width: 40px;"><input type="checkbox"></th>
                    <th>ID Achat</th>
                    <th>Fournisseur</th>
                    <th>Date Réception</th>
                    <th>Montant Total</th>
                    <th>Montant Réglé</th>
                    <th>Statut Paiement</th>
                    <th>Statut Commande</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($orders)): ?>
                    <tr>
                        <td colspan="8" style="text-align: center; color: var(--erp-text-muted); padding: 30px;">Aucun bon d'achat enregistré.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($orders as $ord): ?>
                        <tr>
                            <td><input type="checkbox"></td>
                            <td><strong style="color: var(--erp-primary);">#ACH-<?php echo str_pad($ord['id'], 5, '0', STR_PAD_LEFT); ?></strong></td>
                            <td style="font-weight: 500;"><?php echo htmlspecialchars($ord['supplier_company']); ?></td>
                            <td style="color: var(--erp-text-muted);"><?php echo date('d/m/Y', strtotime($ord['order_date'])); ?></td>
                            <td style="font-weight: 600;"><?php echo number_format($ord['total_amount'], 0, ',', ' '); ?> FCFA</td>
                            <td><?php echo number_format($ord['amount_paid'], 0, ',', ' '); ?> FCFA</td>
                            <td>
                                <span class="erp-badge <?php 
                                    if ($ord['payment_status'] === 'paid') echo 'erp-badge-success';
                                    elseif ($ord['payment_status'] === 'partially_paid') echo 'erp-badge-warning';
                                    else echo 'erp-badge-danger';
                                ?>">
                                    <?php 
                                        if ($ord['payment_status'] === 'paid') echo 'Payé';
                                        elseif ($ord['payment_status'] === 'partially_paid') echo 'Partiel';
                                        else echo 'Non payé';
                                    ?>
                                </span>
                            </td>
                            <td>
                                <span class="erp-badge <?php echo $ord['status'] === 'received' ? 'erp-badge-success' : ($ord['status'] === 'cancelled' ? 'erp-badge-danger' : 'erp-badge-primary'); ?>">
                                    <?php 
                                        if ($ord['status'] === 'received') echo 'Reçu';
                                        elseif ($ord['status'] === 'cancelled') echo 'Annulé';
                                        else echo 'Commandé';
                                    ?>
                                </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ==========================================================================
     MODALS
     ========================================================================== -->

<!-- 1. Modal CRUD Fournisseur -->
<div class="modal" id="supplierModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="supplier-modal-title">Ajouter un Fournisseur</h3>
            <button type="button" class="modal-close"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        
        <div class="modal-body">
            <form method="POST" action="index.php?page=suppliers">
                <input type="hidden" name="supplier_id" id="form-supplier-id" value="0">
                
                <div class="form-group">
                    <label class="form-label" for="form-company-name">Nom de l'entreprise *</label>
                    <input class="form-control" type="text" id="form-company-name" name="company_name" required placeholder="Ex: GAP S.A.">
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="form-supplier-name">Nom complet du contact *</label>
                    <input class="form-control" type="text" id="form-supplier-name" name="name" required placeholder="Ex: Mamadou Fall">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label" for="form-supplier-phone">Téléphone</label>
                        <input class="form-control" type="text" id="form-supplier-phone" name="phone" placeholder="Ex: +221 33 800 00 00">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="form-supplier-email">Adresse e-mail</label>
                        <input class="form-control" type="email" id="form-supplier-email" name="email" placeholder="Ex: sales@gap.com">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="form-supplier-address">Adresse physique</label>
                    <input class="form-control" type="text" id="form-supplier-address" name="address" placeholder="Ex: Zone Industrielle, Dakar">
                </div>

                <div class="form-group">
                    <label class="form-label" for="form-supplier-debt">Dette envers ce Fournisseur de départ (FCFA)</label>
                    <input class="form-control" type="number" id="form-supplier-debt" name="outstanding_debt" min="0" value="0">
                </div>
                
                <button type="submit" name="save_supplier" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px; margin-top: 10px;">Enregistrer le Fournisseur</button>
            </form>
        </div>
    </div>
</div>

<!-- 2. Modal Enregistrer un achat de réapprovisionnement -->
<div class="modal" id="orderModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Enregistrer un Achat Fournisseur</h3>
            <button class="modal-close"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        
        <div class="modal-body">
            <form method="POST" action="index.php?page=suppliers">
                <div class="form-group">
                    <label class="form-label" for="order_supplier_id">Fournisseur concerné *</label>
                    <select name="order_supplier_id" id="order_supplier_id" class="form-control" required>
                        <option value="">-- Choisir le fournisseur --</option>
                        <?php foreach ($suppliers as $s): ?>
                            <option value="<?php echo $s['id']; ?>">
                                <?php echo htmlspecialchars($s['company_name']); ?> (<?php echo htmlspecialchars($s['name']); ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label" for="order_date">Date de Réception *</label>
                        <input class="form-control" type="date" id="order_date" name="order_date" required value="<?php echo date('Y-m-d'); ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="status">Statut Commande *</label>
                        <select name="status" id="status" class="form-control">
                            <option value="received">Déjà Reçu (Met à jour les stocks)</option>
                            <option value="ordered">Commandé (En attente de réception)</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label" for="total_amount">Montant Total Facture (FCFA) *</label>
                        <input class="form-control" type="number" id="total_amount" name="total_amount" required min="1">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="amount_paid">Montant Déjà Réglé (FCFA)</label>
                        <input class="form-control" type="number" id="amount_paid" name="amount_paid" min="0" value="0">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="payment_status">Statut de Règlement *</label>
                    <select name="payment_status" id="payment_status" class="form-control">
                        <option value="paid">Payé en totalité</option>
                        <option value="partially_paid">Partiellement payé (Génère une dette)</option>
                        <option value="unpaid">Achat à crédit (Génère une dette)</option>
                    </select>
                </div>
                
                <button type="submit" name="save_order" class="btn btn-success" style="width: 100%; justify-content: center; padding: 12px; margin-top: 10px;">Valider l'Achat Fournisseur</button>
            </form>
        </div>
    </div>
</div>

<script>
function switchTab(tab) {
    const supTab = document.getElementById('tab-suppliers');
    const ordTab = document.getElementById('tab-orders');
    const supBtn = document.getElementById('tab-btn-suppliers');
    const ordBtn = document.getElementById('tab-btn-orders');
    
    if (tab === 'suppliers') {
        supTab.style.display = 'block';
        ordTab.style.display = 'none';
        
        supBtn.className = 'btn btn-primary';
        supBtn.style.backgroundColor = 'var(--accent)';
        ordBtn.className = 'btn btn-secondary';
        ordBtn.style.backgroundColor = '';
    } else {
        supTab.style.display = 'none';
        ordTab.style.display = 'block';
        
        supBtn.className = 'btn btn-secondary';
        supBtn.style.backgroundColor = '';
        ordBtn.className = 'btn btn-primary';
        ordBtn.style.backgroundColor = 'var(--accent)';
    }
}

function openAddSupplierModal() {
    document.getElementById('supplier-modal-title').textContent = "Ajouter un Fournisseur";
    document.getElementById('form-supplier-id').value = "0";
    document.getElementById('form-company-name').value = "";
    document.getElementById('form-supplier-name').value = "";
    document.getElementById('form-supplier-phone').value = "";
    document.getElementById('form-supplier-email').value = "";
    document.getElementById('form-supplier-address').value = "";
    document.getElementById('form-supplier-debt').value = "0";
    
    openModal('supplierModal');
}

function openEditSupplierModal(s) {
    document.getElementById('supplier-modal-title').textContent = "Modifier : " + s.company_name;
    document.getElementById('form-supplier-id').value = s.id;
    document.getElementById('form-company-name').value = s.company_name || "";
    document.getElementById('form-supplier-name').value = s.name;
    document.getElementById('form-supplier-phone').value = s.phone || "";
    document.getElementById('form-supplier-email').value = s.email || "";
    document.getElementById('form-supplier-address').value = s.address || "";
    document.getElementById('form-supplier-debt').value = s.outstanding_debt || "0";
    
    openModal('supplierModal');
}

function openAddOrderModal() {
    openModal('orderModal');
}
</script>
