<?php
/**
 * Gestion de la Clientèle - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : tous connectés
requireLogin();

$userRole = $_SESSION['user_role'] ?? '';
$isAdminOrManager = in_array($userRole, ['admin', 'manager']);
$message = '';
$error = '';

// ==========================================
// 1. TRAITEMENT DU CRUD DES CLIENTS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_client'])) {
    $cliId = isset($_POST['client_id']) ? (int)$_POST['client_id'] : 0;
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $balance = (float)($_POST['balance'] ?? 0.00);

    if (!empty($name)) {
        try {
            if ($cliId > 0) {
                // Modification
                $stmt = $pdo->prepare("
                    UPDATE clients 
                    SET name = ?, phone = ?, email = ?, address = ?, balance = ?
                    WHERE id = ?
                ");
                $stmt->execute([$name, $phone, $email, $address, $balance, $cliId]);
                logAction($pdo, $_SESSION['user_id'], "Modification du client : $name (ID: $cliId)");
                $message = "Client modifié avec succès !";
            } else {
                // Création
                $stmt = $pdo->prepare("
                    INSERT INTO clients (name, phone, email, address, loyalty_points, balance)
                    VALUES (?, ?, ?, ?, 0, ?)
                ");
                $stmt->execute([$name, $phone, $email, $address, $balance]);
                logAction($pdo, $_SESSION['user_id'], "Création du client : $name");
                $message = "Client créé avec succès !";
            }
        } catch (PDOException $e) {
            $error = "Erreur client : " . $e->getMessage();
        }
    }
}

if ($isAdminOrManager && isset($_GET['delete_client'])) {
    $cliId = (int)$_GET['delete_client'];
    
    if ($cliId === 1) {
        $error = "Impossible de supprimer le compte Client de Passage Standard.";
    } else {
        try {
            // Vérifier s'il a des factures
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM sales WHERE client_id = ?");
            $stmtCheck->execute([$cliId]);
            
            if ($stmtCheck->fetchColumn() > 0) {
                $error = "Impossible de supprimer ce client car il dispose d'historique de ventes.";
            } else {
                $stmt = $pdo->prepare("DELETE FROM clients WHERE id = ?");
                $stmt->execute([$cliId]);
                logAction($pdo, $_SESSION['user_id'], "Suppression du client ID : $cliId");
                $message = "Client supprimé avec succès !";
            }
        } catch (PDOException $e) {
            $error = "Erreur de suppression : " . $e->getMessage();
        }
    }
}

// ==========================================
// 2. RÉCUPÉRATION DES LISTES
// ==========================================
$search = trim($_GET['search_term'] ?? '');
$activeClientId = isset($_GET['view_id']) ? (int)$_GET['view_id'] : 1;

$cliQuery = "SELECT * FROM clients WHERE 1=1";
$params = [];

if (!empty($search)) {
    $cliQuery .= " AND (name LIKE ? OR phone LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$cliQuery .= " ORDER BY id = 1 DESC, name ASC";
$stmtCli = $pdo->prepare($cliQuery);
$stmtCli->execute($params);
$clientsList = $stmtCli->fetchAll();

// Récupérer les ventes du client actif pour la colonne de droite
$salesStmt = $pdo->prepare("
    SELECT s.*, u.name as cashier_name
    FROM sales s
    JOIN users u ON s.user_id = u.id
    WHERE s.client_id = ?
    ORDER BY s.created_at DESC
");
$salesStmt->execute([$activeClientId]);
$clientSales = $salesStmt->fetchAll();

// Récupérer le nom du client sélectionné pour l'affichage de droite
$selectedCliStmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
$selectedCliStmt->execute([$activeClientId]);
$activeClient = $selectedCliStmt->fetch();
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
            actionContainer.innerHTML = `<button type="button" class="erp-btn erp-btn-primary" onclick="openAddClientModal()">Nouveau Client</button>`;
        }
    });
</script>

<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
    <!-- Liste des clients (Gauche) -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; display: flex; flex-direction: column; height: 100%;">
        
        <!-- Recherche rapide Façon Odoo -->
        <div style="padding: 10px 15px; border-bottom: 1px solid var(--erp-border); background-color: #f9fafb;">
            <form method="GET" action="index.php" style="position: relative;">
                <input type="hidden" name="page" value="clients">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="position: absolute; left: 10px; top: 9px; color: #9ca3af;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" name="search_term" placeholder="Rechercher (Nom, Téléphone)..." value="<?php echo htmlspecialchars($search); ?>" style="width: 100%; padding: 8px 10px 8px 35px; border: 1px solid #e5e7eb; border-radius: 4px; outline: none; font-size: 0.9rem;">
            </form>
        </div>

        <div style="overflow-y: auto; max-height: 600px;">
            <?php foreach ($clientsList as $cli): 
                $isActive = $cli['id'] === $activeClientId;
            ?>
                <div style="padding: 12px 15px; border-bottom: 1px solid var(--erp-border); background: <?php echo $isActive ? 'var(--erp-hover)' : 'white'; ?>; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;" onclick="window.location.href='index.php?page=clients&view_id=<?php echo $cli['id']; ?>&search_term=<?php echo urlencode($search); ?>'">
                    <div>
                        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: <?php echo $isActive ? 'var(--erp-primary)' : 'var(--erp-text-main)'; ?>;">
                            <?php echo htmlspecialchars($cli['name']); ?>
                        </h4>
                        <span style="font-size: 0.8rem; color: var(--erp-text-muted);"><?php echo htmlspecialchars($cli['phone'] ?: 'Sans numéro'); ?></span>
                        <div style="margin-top: 6px; display: flex; gap: 8px;">
                            <span class="erp-badge erp-badge-success"><?php echo $cli['loyalty_points']; ?> Pts</span>
                            <?php if ($cli['balance'] > 0): ?>
                                <span class="erp-badge erp-badge-danger">Dette: <?php echo number_format($cli['balance'], 0, ',', ' '); ?> FCFA</span>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 6px;">
                        <button type="button" class="erp-btn erp-btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="event.stopPropagation(); openEditClientModal(<?php echo htmlspecialchars(json_encode($cli), ENT_QUOTES, 'UTF-8'); ?>)" title="Modifier">✏️</button>
                        <?php if ($isAdminOrManager && $cli['id'] > 1): ?>
                            <a href="index.php?page=clients&delete_client=<?php echo $cli['id']; ?>" class="erp-btn erp-btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; color: #e11d48;" onclick="event.stopPropagation(); return confirm('Supprimer ce client ?')" title="Supprimer">✕</a>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Fiche Client & Historique d'Achats (Droite) -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow: hidden; display: flex; flex-direction: column;">
        <div style="padding: 15px 20px; border-bottom: 1px solid var(--erp-border); background-color: #f9fafb;">
            <h3 style="margin: 0; font-size: 1.1rem; color: var(--erp-text-main);">Dossier Client</h3>
        </div>

        <?php if ($activeClient): ?>
            <!-- Fiche Info Façon Odoo Form -->
            <div style="padding: 20px; border-bottom: 1px solid var(--erp-border); display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h2 style="margin: 0 0 15px 0; font-size: 1.5rem; color: var(--erp-text-main); font-weight: 600;"><?php echo htmlspecialchars($activeClient['name']); ?></h2>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <tr><td style="padding: 4px 0; color: var(--erp-text-muted); width: 100px;">Téléphone:</td><td style="font-weight: 500;"><?php echo htmlspecialchars($activeClient['phone'] ?: '-'); ?></td></tr>
                        <tr><td style="padding: 4px 0; color: var(--erp-text-muted);">E-mail:</td><td style="font-weight: 500; color: var(--erp-primary);"><?php echo htmlspecialchars($activeClient['email'] ?: '-'); ?></td></tr>
                        <tr><td style="padding: 4px 0; color: var(--erp-text-muted);">Adresse:</td><td style="font-weight: 500;"><?php echo htmlspecialchars($activeClient['address'] ?: '-'); ?></td></tr>
                    </table>
                </div>
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: flex-end; gap: 10px;">
                    <div style="text-align: right;">
                        <div style="color: var(--erp-text-muted); font-size: 0.85rem; margin-bottom: 2px;">Points Fidélité</div>
                        <div style="color: #059669; font-size: 1.25rem; font-weight: 700;"><?php echo $activeClient['loyalty_points']; ?> Pts</div>
                    </div>
                    <?php if ($activeClient['balance'] > 0): ?>
                    <div style="text-align: right;">
                        <div style="color: var(--erp-text-muted); font-size: 0.85rem; margin-bottom: 2px;">Solde Débiteur</div>
                        <div style="color: #e11d48; font-size: 1.25rem; font-weight: 700;"><?php echo number_format($activeClient['balance'], 0, ',', ' '); ?> FCFA</div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Invoices List -->
            <div style="padding: 15px 20px 10px;">
                <h4 style="margin: 0; font-size: 1rem; color: var(--erp-text-main);">Dernières factures réglées</h4>
            </div>
            
            <div style="overflow-x: auto; flex: 1;">
                <table class="erp-list-view">
                    <thead>
                        <tr>
                            <th>Facture N°</th>
                            <th>Date d'achat</th>
                            <th>Caissier</th>
                            <th>Paiement</th>
                            <th style="text-align: right;">Total Net</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($clientSales)): ?>
                            <tr>
                                <td colspan="5" style="text-align: center; padding: 30px; color: var(--erp-text-muted);">Aucun achat enregistré pour ce client.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($clientSales as $sale): ?>
                                <tr>
                                    <td><strong style="color: var(--erp-primary);"><?php echo htmlspecialchars($sale['invoice_no']); ?></strong></td>
                                    <td style="color: var(--erp-text-muted); font-size: 0.85rem;"><?php echo date('d/m/Y H:i', strtotime($sale['created_at'])); ?></td>
                                    <td><?php echo htmlspecialchars($sale['cashier_name']); ?></td>
                                    <td><span class="erp-badge erp-badge-success"><?php echo strtoupper($sale['payment_method']); ?></span></td>
                                    <td style="text-align: right; font-weight: 600;"><?php echo number_format($sale['net_amount'], 0, ',', ' '); ?> FCFA</td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        <?php else: ?>
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--erp-text-muted);">
                <p>Sélectionnez un client pour voir son dossier.</p>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- ==========================================================================
     MODAL AJOUT / MODIFICATION CLIENT
     ========================================================================== -->
<div class="modal" id="clientModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="client-modal-title">Ajouter un Client</h3>
            <button type="button" class="modal-close"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        
        <div class="modal-body">
            <form method="POST" action="index.php?page=clients">
                <input type="hidden" name="client_id" id="form-client-id" value="0">
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Nom complet *</label>
                    <input type="text" id="form-client-name" name="name" required placeholder="Ex: Khadim Ndiaye" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Téléphone</label>
                        <input type="text" id="form-client-phone" name="phone" placeholder="Ex: +221 77 123 45 67" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Adresse e-mail</label>
                        <input type="email" id="form-client-email" name="email" placeholder="Ex: khadim@gmail.com" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;">
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Adresse physique</label>
                    <input type="text" id="form-client-address" name="address" placeholder="Ex: Mermoz, Dakar" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;">
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;">Dette / Solde débiteur de départ (FCFA)</label>
                    <input type="number" id="form-client-balance" name="balance" min="0" value="0" style="width: 100%; padding: 8px; border: 1px solid var(--erp-border); border-radius: 4px;">
                </div>
                
                <button type="submit" name="save_client" class="erp-btn erp-btn-primary" style="width: 100%; padding: 12px; margin-top: 10px; justify-content: center;">Enregistrer le Dossier</button>
            </form>
        </div>
    </div>
</div>

<script>
function openAddClientModal() {
    document.getElementById('client-modal-title').textContent = "Ajouter un Client";
    document.getElementById('form-client-id').value = "0";
    document.getElementById('form-client-name').value = "";
    document.getElementById('form-client-phone').value = "";
    document.getElementById('form-client-email').value = "";
    document.getElementById('form-client-address').value = "";
    document.getElementById('form-client-balance').value = "0";
    
    openModal('clientModal');
}

function openEditClientModal(c) {
    document.getElementById('client-modal-title').textContent = "Modifier : " + c.name;
    document.getElementById('form-client-id').value = c.id;
    document.getElementById('form-client-name').value = c.name;
    document.getElementById('form-client-phone').value = c.phone || "";
    document.getElementById('form-client-email').value = c.email || "";
    document.getElementById('form-client-address').value = c.address || "";
    document.getElementById('form-client-balance').value = c.balance || "0";
    
    openModal('clientModal');
}
</script>
