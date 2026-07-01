<?php
/**
 * Gestion Clients Améliorée avec Synchronisation & Soldes - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

requireLogin();

$userRole = $_SESSION['user_role'] ?? '';
$isAdminOrManager = in_array($userRole, ['admin', 'manager']);
$message = '';
$error = '';

// Traitement des opérations
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    $clientId = (int)($_POST['client_id'] ?? 0);
    
    if ($action === 'sync_balance' && $clientId > 0) {
        try {
            syncClientBalance($pdo, $clientId);
            $message = "Solde du client synchronisé avec succès!";
        } catch (Exception $e) {
            $error = "Erreur: " . $e->getMessage();
        }
    }
    
    if ($action === 'record_payment' && $clientId > 0) {
        try {
            $amount = (float)($_POST['payment_amount'] ?? 0);
            if ($amount <= 0) throw new Exception('Montant invalide');
            
            $paymentDate = $_POST['payment_date'] ?? date('Y-m-d');
            $paymentMethod = $_POST['payment_method'] ?? 'cash';
            $notes = trim($_POST['payment_notes'] ?? '');
            
            // Enregistrer le paiement
            $stmt = $pdo->prepare("INSERT INTO client_payments (client_id, amount, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$clientId, $amount, $paymentDate, $paymentMethod, $notes]);
            
            // Mettre à jour le solde du client
            $stmt = $pdo->prepare("UPDATE clients SET balance = balance + ? WHERE id = ?");
            $stmt->execute([$amount, $clientId]);
            
            logAction($pdo, $_SESSION['user_id'], "Paiement client ID $clientId: $amount FCFA");
            $message = "Paiement enregistré avec succès!";
        } catch (Exception $e) {
            $error = "Erreur: " . $e->getMessage();
        }
    }
    
    if ($action === 'save_client') {
        $cliId = (int)($_POST['client_id'] ?? 0);
        $name = trim($_POST['name'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $address = trim($_POST['address'] ?? '');
        
        if (empty($name)) {
            $error = "Le nom du client est requis";
        } else {
            try {
                if ($cliId > 0) {
                    $stmt = $pdo->prepare("UPDATE clients SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?");
                    $stmt->execute([$name, $phone, $email, $address, $cliId]);
                    $message = "Client modifié avec succès!";
                } else {
                    $stmt = $pdo->prepare("INSERT INTO clients (name, phone, email, address, loyalty_points, balance) VALUES (?, ?, ?, ?, 0, 0)");
                    $stmt->execute([$name, $phone, $email, $address]);
                    $message = "Client créé avec succès!";
                }
            } catch (Exception $e) {
                $error = "Erreur: " . $e->getMessage();
            }
        }
    }
}

// Récupérer les clients avec calcul des soldes
$search = trim($_GET['search_term'] ?? '');
$sortBy = $_GET['sort_by'] ?? 'balance';

$clientQuery = "SELECT c.* FROM clients c WHERE 1=1";
$params = [];

if (!empty($search)) {
    $clientQuery .= " AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($sortBy === 'debt') {
    $clientQuery .= " ORDER BY ABS(c.balance) DESC";
} elseif ($sortBy === 'credit') {
    $clientQuery .= " ORDER BY c.balance DESC";
} else {
    $clientQuery .= " ORDER BY c.id = 1 DESC, c.name ASC";
}

$stmt = $pdo->prepare($clientQuery);
$stmt->execute($params);
$clients = $stmt->fetchAll();

// Fonction de synchronisation de solde client
function syncClientBalance($pdo, $clientId) {
    $stmt = $pdo->prepare("SELECT SUM(net_amount) as total FROM sales WHERE client_id = ? AND status = 'completed'");
    $stmt->execute([$clientId]);
    $totalVentes = (float)($stmt->fetchColumn() ?? 0);
    
    $stmt = $pdo->prepare("SELECT SUM(amount) as total FROM client_payments WHERE client_id = ?");
    $stmt->execute([$clientId]);
    $totalPaiements = (float)($stmt->fetchColumn() ?? 0);
    
    $nouveauSolde = $totalVentes - $totalPaiements;
    
    $stmt = $pdo->prepare("UPDATE clients SET balance = ? WHERE id = ?");
    $stmt->execute([$nouveauSolde, $clientId]);
    
    return $nouveauSolde;
}
?>

<script src="assets/js/kiam_global.js"></script>

<!-- Bannières -->
<?php if (!empty($message)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo addslashes($message); ?>", 'success'));</script>
<?php endif; ?>
<?php if (!empty($error)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo addslashes($error); ?>", 'danger'));</script>
<?php endif; ?>

<!-- Actions -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const actionContainer = document.getElementById('erp-page-actions');
        if (actionContainer) {
            actionContainer.innerHTML = `
                <button type="button" class="erp-btn erp-btn-primary" onclick="openModal('addClientModal')">+ Nouveau Client</button>
                <button class="erp-btn erp-btn-secondary" onclick="syncAllClientBalances()">🔄 Synchroniser Tous</button>
                <button class="erp-btn erp-btn-secondary" onclick="exportData('export_clients', 'csv')">📊 Exporter Excel</button>
            `;
        }
    });
    
    function syncAllClientBalances() {
        if (!confirm('Êtes-vous sûr de vouloir synchroniser tous les soldes clients?')) return;
        
        fetch('api/accounting_api.php?action=sync_client_balance', {
            method: 'POST',
            body: JSON.stringify({sync_all: true})
        })
        .then(r => r.json())
        .then(d => {
            showNotification('Synchronisation complète en cours...', 'success');
            setTimeout(() => location.reload(), 1000);
        });
    }
</script>

<!-- Vue Liste/Grille -->
<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px;">
    
    <!-- Colonne Gauche: Liste Clients -->
    <div style="display: flex; flex-direction: column; gap: 15px;">
        
        <!-- Barre de Recherche -->
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 15px;">
            <form method="GET" action="index.php" style="display: grid; grid-template-columns: 1fr 150px 150px; gap: 10px;">
                <input type="hidden" name="page" value="clients">
                <div style="position: relative;">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="position: absolute; left: 10px; top: 10px; color: #9ca3af;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" name="search_term" placeholder="Recherche..." value="<?php echo htmlspecialchars($search); ?>" style="width: 100%; padding: 10px 10px 10px 35px; border: 1px solid var(--erp-border); border-radius: 4px;">
                </div>
                <select name="sort_by" style="padding: 10px; border: 1px solid var(--erp-border); border-radius: 4px;">
                    <option value="balance">Tri Défaut</option>
                    <option value="debt" <?php echo $sortBy === 'debt' ? 'selected' : ''; ?>>Par Dette ↓</option>
                    <option value="credit" <?php echo $sortBy === 'credit' ? 'selected' : ''; ?>>Par Crédit ↓</option>
                </select>
                <button type="submit" class="erp-btn erp-btn-primary">Rechercher</button>
            </form>
        </div>
        
        <!-- Tableau des Clients -->
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto;">
            <table class="erp-list-view" style="width: 100%;">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Téléphone</th>
                        <th style="text-align: right;">Solde</th>
                        <th style="text-align: center;">Statut</th>
                        <th style="text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($clients as $c): ?>
                        <tr>
                            <td><strong><?php echo htmlspecialchars($c['name']); ?></strong></td>
                            <td><?php echo htmlspecialchars($c['phone'] ?? 'N/A'); ?></td>
                            <td style="text-align: right;">
                                <span style="padding: 4px 8px; border-radius: 4px; font-weight: 600; background: <?php echo $c['balance'] > 0 ? '#ecfdf5' : ($c['balance'] < 0 ? '#fee2e2' : '#f3f4f6'); ?>; color: <?php echo $c['balance'] > 0 ? '#059669' : ($c['balance'] < 0 ? '#dc2626' : '#6b7280'); ?>;">
                                    <?php echo number_format(abs($c['balance']), 0, ',', ' '); ?> FCFA
                                </span>
                            </td>
                            <td style="text-align: center;">
                                <?php if ($c['balance'] > 0): ?>
                                    <span style="background: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">Débiteur</span>
                                <?php elseif ($c['balance'] < 0): ?>
                                    <span style="background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">Créancier</span>
                                <?php else: ?>
                                    <span style="background: #f3f4f6; color: #6b7280; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">Équilibré</span>
                                <?php endif; ?>
                            </td>
                            <td style="text-align: center;">
                                <button class="erp-btn erp-btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="viewClientDetails(<?php echo $c['id']; ?>)">👁️</button>
                                <?php if ($isAdminOrManager): ?>
                                    <button class="erp-btn erp-btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="editClient(<?php echo $c['id']; ?>)">✏️</button>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Colonne Droite: Résumé & Actions -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px; height: fit-content;">
        
        <h3 style="margin-top: 0; margin-bottom: 20px; color: var(--erp-primary);">📊 Résumé Clientèle</h3>
        
        <?php 
        $totalClients = count($clients);
        $totalDebit = array_reduce($clients, fn($sum, $c) => $sum + ($c['balance'] > 0 ? $c['balance'] : 0), 0);
        $totalCredit = array_reduce($clients, fn($sum, $c) => $sum + ($c['balance'] < 0 ? abs($c['balance']) : 0), 0);
        $netPosition = $totalDebit - $totalCredit;
        ?>
        
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="background: #f9fafb; border-radius: 4px; padding: 15px;">
                <small style="color: var(--erp-text-muted); display: block;">Nombre de Clients</small>
                <strong style="font-size: 1.8rem; color: var(--erp-primary);"><?php echo $totalClients; ?></strong>
            </div>
            
            <div style="background: #ecfdf5; border-left: 4px solid #059669; border-radius: 4px; padding: 15px;">
                <small style="color: #059669; display: block;">Total Crédits Accordés</small>
                <strong style="font-size: 1.5rem; color: #059669;">
                    <?php echo number_format($totalDebit, 0, ',', ' '); ?> FCFA
                </strong>
            </div>
            
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px; padding: 15px;">
                <small style="color: #dc2626; display: block;">Total Crédits Reçus</small>
                <strong style="font-size: 1.5rem; color: #dc2626;">
                    <?php echo number_format($totalCredit, 0, ',', ' '); ?> FCFA
                </strong>
            </div>
            
            <div style="background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 4px; padding: 15px;">
                <small style="color: #0284c7; display: block;">Position Nette</small>
                <strong style="font-size: 1.5rem; color: #0284c7;">
                    <?php echo number_format($netPosition, 0, ',', ' '); ?> FCFA
                </strong>
            </div>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--erp-border);">
        
        <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 500; margin-bottom: 10px;">Actions Rapides</label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="erp-btn erp-btn-secondary" style="width: 100%; text-align: left;" onclick="openModal('recordPaymentModal')">
                    💳 Enregistrer Paiement
                </button>
                <button class="erp-btn erp-btn-secondary" style="width: 100%; text-align: left;" onclick="syncAllClientBalances()">
                    🔄 Synchroniser Soldes
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Modal: Enregistrer Paiement -->
<div id="recordPaymentModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
    <div style="background: white; border-radius: 4px; padding: 30px; max-width: 400px; width: 90%;">
        <h3 style="margin-top: 0;">Enregistrer un Paiement Client</h3>
        
        <form method="POST" style="display: flex; flex-direction: column; gap: 15px;">
            <input type="hidden" name="action" value="record_payment">
            
            <div>
                <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Client</label>
                <select name="client_id" required style="width: 100%; padding: 10px; border: 1px solid var(--erp-border); border-radius: 4px;">
                    <option value="">-- Sélectionner un client --</option>
                    <?php foreach ($clients as $c): ?>
                        <option value="<?php echo $c['id']; ?>"><?php echo htmlspecialchars($c['name']); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div>
                <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Montant Reçu</label>
                <input type="number" name="payment_amount" required min="0" step="100" style="width: 100%; padding: 10px; border: 1px solid var(--erp-border); border-radius: 4px;" placeholder="Montant en FCFA">
            </div>
            
            <div>
                <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Date du Paiement</label>
                <input type="date" name="payment_date" value="<?php echo date('Y-m-d'); ?>" style="width: 100%; padding: 10px; border: 1px solid var(--erp-border); border-radius: 4px;">
            </div>
            
            <div>
                <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Moyen de Paiement</label>
                <select name="payment_method" style="width: 100%; padding: 10px; border: 1px solid var(--erp-border); border-radius: 4px;">
                    <option value="cash">💵 Espèces</option>
                    <option value="mobile_money">📱 Mobile Money</option>
                    <option value="bank">🏦 Virement</option>
                </select>
            </div>
            
            <div>
                <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Notes</label>
                <textarea name="payment_notes" style="width: 100%; padding: 10px; border: 1px solid var(--erp-border); border-radius: 4px; min-height: 60px;" placeholder="Notes optionnelles..."></textarea>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button type="submit" class="erp-btn erp-btn-primary" style="flex: 1;">✓ Enregistrer</button>
                <button type="button" class="erp-btn erp-btn-secondary" style="flex: 1;" onclick="closeModal('recordPaymentModal')">Annuler</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal: Ajouter Client -->
<div id="addClientModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
    <div style="background: white; border-radius: 4px; padding: 30px; max-width: 500px; width: 90%;">
        <h3 style="margin-top: 0;">Nouveau Client</h3>
        
        <form method="POST" style="display: flex; flex-direction: column; gap: 15px;">
            <input type="hidden" name="action" value="save_client">
            
            <div>
                <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Nom Complet *</label>
                <input type="text" name="name" required style="width: 100%; padding: 10px; border: 1px solid var(--erp-border); border-radius: 4px;">
            </div>
            
            <div>
                <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Téléphone</label>
                <input type="tel" name="phone" style="width: 100%; padding: 10px; border: 1px solid var(--erp-border); border-radius: 4px;">
            </div>
            
            <div>
                <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Email</label>
                <input type="email" name="email" style="width: 100%; padding: 10px; border: 1px solid var(--erp-border); border-radius: 4px;">
            </div>
            
            <div>
                <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Adresse</label>
                <textarea name="address" style="width: 100%; padding: 10px; border: 1px solid var(--erp-border); border-radius: 4px; min-height: 60px;"></textarea>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button type="submit" class="erp-btn erp-btn-primary" style="flex: 1;">✓ Créer Client</button>
                <button type="button" class="erp-btn erp-btn-secondary" style="flex: 1;" onclick="closeModal('addClientModal')">Annuler</button>
            </div>
        </form>
    </div>
</div>

<script>
    function viewClientDetails(clientId) {
        // À implémenter - afficher les détails complets du client
        alert('Détails client #' + clientId);
    }
    
    function editClient(clientId) {
        // À implémenter - éditer le client
        alert('Éditer client #' + clientId);
    }
</script>
