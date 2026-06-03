<?php
/**
 * Gestion Administrative des Utilisateurs & Journal d'Audit - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : réservé à l'Admin uniquement
requireRole(['admin']);

$message = '';
$error = '';

// ==========================================
// 1. TRAITEMENT DU CRUD DES UTILISATEURS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_user'])) {
    $usrId = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
    $name = trim($_POST['name'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $role = $_POST['role']; // 'admin', 'manager', 'cashier'
    $status = $_POST['status']; // 'active', 'inactive'
    $password = trim($_POST['password'] ?? '');

    if (!empty($name) && !empty($username) && !empty($role)) {
        try {
            if ($usrId > 0) {
                // Modification
                if (!empty($password)) {
                    // Si un nouveau mot de passe est saisi, on le met à jour
                    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare("
                        UPDATE users 
                        SET name = ?, username = ?, role = ?, status = ?, password_hash = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$name, $username, $role, $status, $hashedPassword, $usrId]);
                } else {
                    // Sinon on garde le mot de passe actuel intact
                    $stmt = $pdo->prepare("
                        UPDATE users 
                        SET name = ?, username = ?, role = ?, status = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$name, $username, $role, $status, $usrId]);
                }
                logAction($pdo, $_SESSION['user_id'], "Modification de l'utilisateur : $username (ID: $usrId)");
                $message = "Utilisateur modifié avec succès !";
            } else {
                // Création
                if (empty($password)) {
                    throw new Exception("Le mot de passe est obligatoire pour la création.");
                }
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("
                    INSERT INTO users (name, username, password_hash, role, status)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([$name, $username, $hashedPassword, $role, $status]);
                logAction($pdo, $_SESSION['user_id'], "Création de l'utilisateur : $username");
                $message = "Utilisateur créé avec succès !";
            }
        } catch (Exception $e) {
            $error = "Erreur utilisateur : " . ($e->getCode() == 23000 ? "Cet identifiant de connexion est déjà utilisé." : $e->getMessage());
        }
    }
}

if (isset($_GET['delete_user'])) {
    $usrId = (int)$_GET['delete_user'];
    
    if ($usrId === (int)$_SESSION['user_id']) {
        $error = "Impossible de supprimer votre propre compte utilisateur actif !";
    } else {
        try {
            // Supprimer d'abord les logs ou laisser cascade
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$usrId]);
            logAction($pdo, $_SESSION['user_id'], "Suppression de l'utilisateur ID : $usrId");
            $message = "Utilisateur supprimé avec succès !";
        } catch (PDOException $e) {
            $error = "Erreur de suppression : " . $e->getMessage();
        }
    }
}

// ==========================================
// 2. RÉCUPÉRATION DE L'HISTORIQUE ET DES COMPTES
// ==========================================
$usersList = $pdo->query("SELECT * FROM users ORDER BY name ASC")->fetchAll();

// Récupérer le journal d'activité (Audit Trail)
$auditLogsStmt = $pdo->query("
    SELECT ul.*, u.name as user_name, u.role as user_role
    FROM user_logs ul
    LEFT JOIN users u ON ul.user_id = u.id
    ORDER BY ul.created_at DESC
    LIMIT 100
");
$auditLogs = $auditLogsStmt->fetchAll();
?>

<!-- Bannières de Statut -->
<?php if (!empty($message)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo $message; ?>", 'success'));</script>
<?php endif; ?>
<?php if (!empty($error)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo $error; ?>", 'danger'));</script>
<?php endif; ?>

<!-- Injection dynamique de l'Action Nouvel Utilisateur -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const actionContainer = document.getElementById('erp-page-actions');
        if (actionContainer) {
            actionContainer.innerHTML = `
                <div style="display: flex; gap: 8px;">
                    <button class="erp-btn erp-btn-secondary" id="tab-btn-users" onclick="switchTab('users')" style="background-color: var(--erp-primary); color: white;">Comptes Utilisateurs</button>
                    <button class="erp-btn erp-btn-secondary" id="tab-btn-audit" onclick="switchTab('audit')">Journal d'Audit & Sécurité</button>
                    <button class="erp-btn erp-btn-primary" onclick="openAddUserModal()">+ Nouvel Utilisateur</button>
                </div>
            `;
        }
    });
</script>

<!-- ==========================================================================
     TAB 1: COMPTES UTILISATEURS
     ========================================================================== -->
<div id="tab-users" style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto;">
    <table class="erp-list-view">
        <thead>
            <tr>
                <th style="width: 40px;"><input type="checkbox"></th>
                <th>Nom Complet</th>
                <th>Identifiant de connexion</th>
                <th>Rôle Système</th>
                <th>Date d'inscription</th>
                <th>Statut Compte</th>
                <th style="text-align: right;">Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($usersList as $u): ?>
                <tr ondblclick='openEditUserModal(<?php echo json_encode($u); ?>)'>
                    <td><input type="checkbox"></td>
                    <td><strong><?php echo htmlspecialchars($u['name']); ?></strong></td>
                    <td style="font-family: monospace; font-size: 0.9rem;"><?php echo htmlspecialchars($u['username']); ?></td>
                    <td>
                        <span class="erp-badge <?php 
                            if ($u['role'] === 'admin') echo 'erp-badge-danger';
                            elseif ($u['role'] === 'manager') echo 'erp-badge-primary';
                            else echo 'erp-badge-success';
                        ?>">
                            <?php echo getRoleLabel($u['role']); ?>
                        </span>
                    </td>
                    <td><span style="font-size: 0.85rem; color: var(--erp-text-muted);"><?php echo date('d/m/Y', strtotime($u['created_at'])); ?></span></td>
                    <td>
                        <span class="erp-badge <?php echo $u['status'] === 'active' ? 'erp-badge-success' : 'erp-badge-danger'; ?>">
                            <?php echo $u['status'] === 'active' ? 'Actif' : 'Désactivé'; ?>
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 8px;">
                            <button class="erp-btn erp-btn-secondary" style="padding: 2px 8px;" onclick='openEditUserModal(<?php echo json_encode($u); ?>)' title="Modifier">✏️</button>
                            <?php if ($u['id'] !== (int)$_SESSION['user_id']): ?>
                                <a href="index.php?page=users&delete_user=<?php echo $u['id']; ?>" class="erp-btn erp-btn-secondary" style="padding: 2px 8px; color: #e11d48;" onclick="return confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')" title="Supprimer">✕</a>
                            <?php endif; ?>
                        </div>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<!-- ==========================================================================
     TAB 2: JOURNAL D'AUDIT & SÉCURITÉ
     ========================================================================== -->
<div id="tab-audit" style="display: none; background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto;">
    <div style="padding: 15px; border-bottom: 1px solid var(--erp-border);">
        <small style="color: var(--erp-text-muted);">Traces d'événements et de sécurité système (100 derniers logs)</small>
    </div>
    
    <table class="erp-list-view">
        <thead>
            <tr>
                <th style="width: 40px;"><input type="checkbox"></th>
                <th>Date & Heure</th>
                <th>Opérateur</th>
                <th>Rôle</th>
                <th>Action Effectuée</th>
                <th>Adresse IP</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($auditLogs)): ?>
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--erp-text-muted); padding: 30px;">Aucun log disponible dans le journal.</td>
                </tr>
            <?php else: ?>
                <?php foreach ($auditLogs as $log): ?>
                    <tr>
                        <td><input type="checkbox"></td>
                        <td style="font-size: 0.85rem; color: var(--erp-text-muted);"><?php echo date('d/m/Y H:i:s', strtotime($log['created_at'])); ?></td>
                        <td><strong><?php echo htmlspecialchars($log['user_name'] ?: 'Système / Visiteur'); ?></strong></td>
                        <td>
                            <span class="erp-badge <?php 
                                if ($log['user_role'] === 'admin') echo 'erp-badge-danger';
                                elseif ($log['user_role'] === 'manager') echo 'erp-badge-primary';
                                else echo 'erp-badge-success';
                            ?>">
                                <?php echo getRoleLabel($log['user_role'] ?: 'inconnu'); ?>
                            </span>
                        </td>
                        <td><strong style="color: var(--erp-text-main); font-size: 0.88rem;"><?php echo htmlspecialchars($log['action']); ?></strong></td>
                        <td style="font-family: monospace; font-size: 0.82rem; color: var(--erp-text-muted);"><?php echo htmlspecialchars($log['ip_address'] ?: '-'); ?></td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<!-- ==========================================================================
     TAB 3: USER CRUD MODAL
     ========================================================================== -->
<div class="modal" id="userModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="user-modal-title">Créer un Utilisateur</h3>
            <button type="button" class="modal-close"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        
        <div class="modal-body">
            <form method="POST" action="index.php?page=users">
                <input type="hidden" name="user_id" id="form-user-id" value="0">
                
                <div class="form-group">
                    <label class="form-label" for="form-user-fullname">Nom complet *</label>
                    <input class="form-control" type="text" id="form-user-fullname" name="name" required placeholder="Ex: Aminata Diop">
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="form-user-login">Identifiant de connexion unique *</label>
                    <input class="form-control" type="text" id="form-user-login" name="username" required placeholder="Ex: ami_diop">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label" for="form-user-role">Rôle Système *</label>
                        <select name="role" id="form-user-role" class="form-control" required>
                            <option value="cashier">Caissier</option>
                            <option value="manager">Gestionnaire</option>
                            <option value="admin">Administrateur</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="form-user-status">Statut *</label>
                        <select name="status" id="form-user-status" class="form-control" required>
                            <option value="active">Actif</option>
                            <option value="inactive">Désactivé</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="form-user-pass" id="form-user-pass-label">Mot de Passe *</label>
                    <input class="form-control" type="password" id="form-user-pass" name="password" placeholder="Saisir le mot de passe...">
                    <small style="color: var(--text-tertiary); display: none;" id="form-user-pass-help">Laissez vide pour conserver le mot de passe actuel.</small>
                </div>
                
                <button type="submit" name="save_user" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px; margin-top: 10px;">Enregistrer l'Utilisateur</button>
            </form>
        </div>
    </div>
</div>

<script>
function switchTab(tab) {
    const usrTab = document.getElementById('tab-users');
    const audTab = document.getElementById('tab-audit');
    const usrBtn = document.getElementById('tab-btn-users');
    const audBtn = document.getElementById('tab-btn-audit');
    
    if (tab === 'users') {
        usrTab.style.display = 'block';
        audTab.style.display = 'none';
        
        usrBtn.className = 'btn btn-primary';
        usrBtn.style.backgroundColor = 'var(--accent)';
        audBtn.className = 'btn btn-secondary';
        audBtn.style.backgroundColor = '';
    } else {
        usrTab.style.display = 'none';
        audTab.style.display = 'block';
        
        usrBtn.className = 'btn btn-secondary';
        usrBtn.style.backgroundColor = '';
        audBtn.className = 'btn btn-primary';
        audBtn.style.backgroundColor = 'var(--accent)';
    }
}

function openAddUserModal() {
    document.getElementById('user-modal-title').textContent = "Créer un Utilisateur";
    document.getElementById('form-user-id').value = "0";
    document.getElementById('form-user-fullname').value = "";
    document.getElementById('form-user-login').value = "";
    document.getElementById('form-user-role').value = "cashier";
    document.getElementById('form-user-status').value = "active";
    
    // Configurer champ pass comme obligatoire
    const passInput = document.getElementById('form-user-pass');
    passInput.value = "";
    passInput.required = true;
    
    document.getElementById('form-user-pass-label').textContent = "Mot de Passe *";
    document.getElementById('form-user-pass-help').style.display = 'none';
    
    openModal('userModal');
}

function openEditUserModal(u) {
    document.getElementById('user-modal-title').textContent = "Modifier : " + u.name;
    document.getElementById('form-user-id').value = u.id;
    document.getElementById('form-user-fullname').value = u.name;
    document.getElementById('form-user-login').value = u.username;
    document.getElementById('form-user-role').value = u.role;
    document.getElementById('form-user-status').value = u.status;
    
    // Configurer champ pass comme facultatif
    const passInput = document.getElementById('form-user-pass');
    passInput.value = "";
    passInput.required = false;
    
    document.getElementById('form-user-pass-label').textContent = "Nouveau Mot de Passe";
    document.getElementById('form-user-pass-help').style.display = 'block';
    
    openModal('userModal');
}
</script>
