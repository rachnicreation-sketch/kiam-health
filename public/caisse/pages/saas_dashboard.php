<?php
/**
 * Tableau de Bord Administrateur SaaS - KIAM ERP
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : Super Admin uniquement
requireRole('super_admin');

$message = '';
$error = '';

// ==========================================
// 1. CRÉATION D'UN TENANT
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_tenant'])) {
    $name = trim($_POST['company_name'] ?? '');
    $slug = strtolower(preg_replace('/[^a-zA-Z0-9-]/', '', trim($_POST['company_slug'] ?? '')));
    $admin_user = trim($_POST['admin_username'] ?? 'admin');
    $admin_pass = $_POST['admin_password'] ?? 'admin123';
    $plan = $_POST['subscription_plan'] ?? 'basic';
    $status = $_POST['subscription_status'] ?? 'trial';
    $expiry = !empty($_POST['subscription_expires_at']) ? $_POST['subscription_expires_at'] : null;

    if (!empty($name) && !empty($slug) && !empty($admin_user) && !empty($admin_pass)) {
        $dbName = "kiam_caisse_tenant_" . $slug;
        
        $pdo_master->beginTransaction();
        try {
            // A. Vérifier si le slug existe déjà
            $stmtCheck = $pdo_master->prepare("SELECT COUNT(*) FROM tenants WHERE slug = ? OR database_name = ?");
            $stmtCheck->execute([$slug, $dbName]);
            if ($stmtCheck->fetchColumn() > 0) {
                throw new Exception("Le slug d'entreprise ou la base de données existe déjà.");
            }

            // B. Enregistrer le tenant dans la base Master
            $stmtInsert = $pdo_master->prepare("
                INSERT INTO tenants (name, slug, database_name, status, subscription_plan, subscription_status, subscription_expires_at) 
                VALUES (?, ?, ?, 'active', ?, ?, ?)
            ");
            $stmtInsert->execute([$name, $slug, $dbName, $plan, $status, $expiry]);
            
            // C. Créer la base de données physique du tenant
            $pdo_master->exec("CREATE DATABASE `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // D. Connecter temporairement à la nouvelle base
            $tenantPdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . $dbName . ";charset=utf8mb4", DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);

            // E. Lire et exécuter le schéma SQL en injectant la base
            $sqlPath = __DIR__ . '/../database.sql';
            if (!file_exists($sqlPath)) {
                throw new Exception("Le fichier de structure SQL 'database.sql' est introuvable.");
            }
            $sql = file_get_contents($sqlPath);
            // Retirer la création et l'usage hardcodé de kiam_caisse dans database.sql
            $sql = preg_replace('/CREATE DATABASE IF NOT EXISTS `kiam_caisse`[^;]*;/i', '', $sql);
            $sql = preg_replace('/USE `kiam_caisse`;/i', 'USE `' . $dbName . '`;', $sql);
            
            // Exécuter l'initialisation des tables
            $tenantPdo->exec($sql);

            // F. Insérer les paramètres par défaut dans la base du tenant
            $stmtSet = $tenantPdo->prepare("INSERT INTO settings (company_name, company_phone, company_email, company_address, currency, tax_rate) VALUES (?, '', '', '', 'FCFA', 18.00)");
            $stmtSet->execute([$name]);

            // G. Insérer l'administrateur de l'entreprise
            $stmtAdmin = $tenantPdo->prepare("INSERT INTO users (username, password_hash, role, name, status) VALUES (?, ?, 'admin', 'Administrateur', 'active')");
            $stmtAdmin->execute([$admin_user, password_hash($admin_pass, PASSWORD_DEFAULT)]);

            // H. Insérer les paramètres de paie par défaut
            $tenantPdo->exec("INSERT INTO payroll_settings (cnss_rate_employee, cnss_rate_employer, tax_bracket_rate, work_start_time, work_end_time, weekend_days, overtime_rate_multiplier, night_work_multiplier) VALUES 
                (5.50, 14.50, 10.00, '08:00:00', '17:00:00', 'Saturday,Sunday', 1.25, 1.50)");

            // I. Insérer le client de passage par défaut
            $tenantPdo->exec("INSERT INTO clients (id, name, phone, email, address, loyalty_points, balance) VALUES (1, 'Client de Passage', NULL, NULL, NULL, 0, 0.00)");

            $pdo_master->commit();
            logAction($pdo_master, $_SESSION['user_id'], "Création du locataire $name (slug: $slug, DB: $dbName)");
            $message = "L'entreprise '$name' a été créée avec succès et configurée !";
        } catch (Exception $e) {
            // Vérifier si une transaction est active avant de faire rollback
            if ($pdo_master->inTransaction()) {
                $pdo_master->rollBack();
            }
            // Nettoyer la DB créée si échec
            try {
                $pdo_master->exec("DROP DATABASE IF EXISTS `$dbName`");
            } catch (Exception $ex) {}
            $error = "Erreur lors de la création : " . $e->getMessage();
        }
    } else {
        $error = "Veuillez remplir tous les champs du formulaire.";
    }
}

// ==========================================
// 2. MODIFICATION D'UN TENANT
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['edit_tenant'])) {
    $tenantId = (int)$_POST['tenant_id'];
    $name = trim($_POST['company_name'] ?? '');
    $plan = $_POST['subscription_plan'] ?? 'basic';
    $status = $_POST['subscription_status'] ?? 'trial';
    $expiry = !empty($_POST['subscription_expires_at']) ? $_POST['subscription_expires_at'] : null;

    if (!empty($name) && $tenantId > 0) {
        try {
            $stmt = $pdo_master->prepare("
                UPDATE tenants 
                SET name = ?, subscription_plan = ?, subscription_status = ?, subscription_expires_at = ?
                WHERE id = ?
            ");
            $stmt->execute([$name, $plan, $status, $expiry, $tenantId]);
            logAction($pdo_master, $_SESSION['user_id'], "Modification du locataire ID $tenantId : $name");
            $message = "Les paramètres du locataire ont été mis à jour.";
        } catch (PDOException $e) {
            $error = "Erreur de modification : " . $e->getMessage();
        }
    }
}

// ==========================================
// 3. TOGGLE STATUS (SUSPENDRE / ACTIVER)
// ==========================================
if (isset($_GET['toggle_status']) && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    try {
        $stmt = $pdo_master->prepare("SELECT * FROM tenants WHERE id = ?");
        $stmt->execute([$id]);
        $t = $stmt->fetch();
        if ($t) {
            $newStatus = $t['status'] === 'active' ? 'suspended' : 'active';
            $stmtUp = $pdo_master->prepare("UPDATE tenants SET status = ? WHERE id = ?");
            $stmtUp->execute([$newStatus, $id]);
            logAction($pdo_master, $_SESSION['user_id'], "Changement de statut pour ID $id vers $newStatus");
            $message = "Le statut de l'entreprise " . htmlspecialchars($t['name']) . " est désormais : " . ($newStatus === 'active' ? 'ACTIF' : 'SUSPENDU');
        }
    } catch (PDOException $e) {
        $error = "Erreur de mise à jour du statut : " . $e->getMessage();
    }
}

// ==========================================
// 4. SUPPRESSION D'UN TENANT
// ==========================================
if (isset($_GET['delete_tenant']) && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    try {
        $stmt = $pdo_master->prepare("SELECT * FROM tenants WHERE id = ?");
        $stmt->execute([$id]);
        $t = $stmt->fetch();
        if ($t) {
            if ($t['slug'] === 'pilote') {
                $error = "Impossible de supprimer le tenant pilote par défaut.";
            } else {
                $dbName = $t['database_name'];
                
                // A. Supprimer la base de données
                $pdo_master->exec("DROP DATABASE IF EXISTS `$dbName`");
                
                // B. Supprimer la ligne de configuration
                $stmtDel = $pdo_master->prepare("DELETE FROM tenants WHERE id = ?");
                $stmtDel->execute([$id]);
                
                logAction($pdo_master, $_SESSION['user_id'], "Suppression du locataire : " . $t['name'] . " (DB: $dbName)");
                $message = "L'entreprise '" . htmlspecialchars($t['name']) . "' et sa base de données ont été définitivement supprimées.";
            }
        }
    } catch (PDOException $e) {
        $error = "Erreur de suppression du locataire : " . $e->getMessage();
    }
}

// ==========================================
// 5. CHARGEMENT DES DONNÉES & STATISTIQUES
// ==========================================
// Statistiques SaaS
$totalTenants = $pdo_master->query("SELECT COUNT(*) FROM tenants")->fetchColumn();
$activeTenants = $pdo_master->query("SELECT COUNT(*) FROM tenants WHERE status = 'active'")->fetchColumn();
$suspendedTenants = $pdo_master->query("SELECT COUNT(*) FROM tenants WHERE status = 'suspended'")->fetchColumn();

// Estimation des revenus mensuels (Basic: 10k, Premium: 30k, Business: 75k)
$revenueStmt = $pdo_master->query("
    SELECT 
        SUM(CASE WHEN subscription_plan = 'basic' THEN 10000 
                 WHEN subscription_plan = 'premium' THEN 30000 
                 WHEN subscription_plan = 'business' THEN 75000 
                 ELSE 0 END) as monthly_revenue
    FROM tenants 
    WHERE status = 'active' AND subscription_status = 'active'
");
$estimatedRevenue = $revenueStmt->fetchColumn() ?: 0;

// Charger la liste des locataires
$tenants = $pdo_master->query("SELECT * FROM tenants ORDER BY id DESC")->fetchAll();
?>

<!-- Bannières de notification -->
<?php if (!empty($message)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo addslashes($message); ?>", 'success'));</script>
<?php endif; ?>
<?php if (!empty($error)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo addslashes($error); ?>", 'danger'));</script>
<?php endif; ?>

<!-- Titre Principal -->
<div style="margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
    <h2 style="color: var(--erp-primary); margin: 0; font-size: 1.5rem; font-weight: 700;">Console SaaS - Administration des Locataires</h2>
    <button class="erp-btn erp-btn-primary" onclick="openAddTenantModal()">Nouvelle Entreprise</button>
</div>

<!-- Métriques SaaS -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px;">
    <!-- Total Locataires -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 6px; padding: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
            <div style="font-size: 0.85rem; color: var(--erp-text-muted); font-weight: 500; text-transform: uppercase;">Total Entreprises</div>
            <div style="font-size: 1.8rem; font-weight: 700; color: #1F2937; margin-top: 4px;"><?php echo $totalTenants; ?></div>
        </div>
        <div style="width: 44px; height: 44px; background: rgba(113, 75, 103, 0.1); color: var(--erp-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
    </div>

    <!-- Actifs -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 6px; padding: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
            <div style="font-size: 0.85rem; color: var(--erp-text-muted); font-weight: 500; text-transform: uppercase;">Locataires Actifs</div>
            <div style="font-size: 1.8rem; font-weight: 700; color: #059669; margin-top: 4px;"><?php echo $activeTenants; ?></div>
        </div>
        <div style="width: 44px; height: 44px; background: rgba(16, 185, 129, 0.1); color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
    </div>

    <!-- Suspendus -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 6px; padding: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
            <div style="font-size: 0.85rem; color: var(--erp-text-muted); font-weight: 500; text-transform: uppercase;">Comptes Suspendus</div>
            <div style="font-size: 1.8rem; font-weight: 700; color: #dc2626; margin-top: 4px;"><?php echo $suspendedTenants; ?></div>
        </div>
        <div style="width: 44px; height: 44px; background: rgba(220, 38, 38, 0.1); color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
        </div>
    </div>

    <!-- Revenus mensuels -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 6px; padding: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
            <div style="font-size: 0.85rem; color: var(--erp-text-muted); font-weight: 500; text-transform: uppercase;">Estimation Mensuelle</div>
            <div style="font-size: 1.8rem; font-weight: 700; color: #d97706; margin-top: 4px;"><?php echo number_format($estimatedRevenue, 0, ',', ' '); ?> FCFA</div>
        </div>
        <div style="width: 44px; height: 44px; background: rgba(217, 119, 6, 0.1); color: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
    </div>
</div>

<!-- Liste des locataires -->
<div style="background: white; border: 1px solid var(--erp-border); border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <table class="erp-list-view" style="width: 100%; border-collapse: collapse;">
        <thead>
            <tr style="background: #f9fafb; border-bottom: 2px solid var(--erp-border);">
                <th style="padding: 12px; text-align: left;">Entreprise</th>
                <th style="padding: 12px; text-align: left;">Slug (Espace)</th>
                <th style="padding: 12px; text-align: left;">Plan / Type</th>
                <th style="padding: 12px; text-align: left;">Abonnement</th>
                <th style="padding: 12px; text-align: left;">Expiration</th>
                <th style="padding: 12px; text-align: left;">Statut</th>
                <th style="padding: 12px; text-align: right;">Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($tenants)): ?>
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--erp-text-muted);">
                        Aucune entreprise locataire n'a été créée pour le moment.
                    </td>
                </tr>
            <?php else: ?>
                <?php foreach ($tenants as $t): ?>
                    <tr style="border-bottom: 1px solid var(--erp-border);">
                        <td style="padding: 12px; font-weight: 600; color: var(--erp-primary);">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <?php if (!empty($t['logo'])): ?>
                                    <img src="<?php echo htmlspecialchars($t['logo']); ?>" alt="Logo" style="height: 24px; border-radius: 4px;">
                                <?php else: ?>
                                    <div style="width: 24px; height: 24px; background: #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #64748b; font-weight: bold; text-transform: uppercase;">
                                        <?php echo substr($t['name'], 0, 2); ?>
                                    </div>
                                <?php endif; ?>
                                <?php echo htmlspecialchars($t['name']); ?>
                            </div>
                        </td>
                        <td style="padding: 12px; font-family: monospace; color: var(--erp-text-muted);"><?php echo htmlspecialchars($t['slug']); ?></td>
                        <td style="padding: 12px; text-transform: uppercase; font-size: 0.85rem; font-weight: 500;">
                            <?php if ($t['subscription_plan'] === 'business'): ?>
                                <span style="color: #c084fc; background: rgba(192, 132, 252, 0.15); padding: 2px 8px; border-radius: 10px;">Enterprise</span>
                            <?php elseif ($t['subscription_plan'] === 'premium'): ?>
                                <span style="color: #60a5fa; background: rgba(96, 165, 250, 0.15); padding: 2px 8px; border-radius: 10px;">Premium</span>
                            <?php else: ?>
                                <span style="color: #94a3b8; background: rgba(148, 163, 184, 0.15); padding: 2px 8px; border-radius: 10px;">Standard</span>
                            <?php endif; ?>
                        </td>
                        <td style="padding: 12px; font-size: 0.88rem;">
                            <?php if ($t['subscription_status'] === 'active'): ?>
                                <span style="color: #10b981; font-weight: 500;">Payé</span>
                            <?php elseif ($t['subscription_status'] === 'trial'): ?>
                                <span style="color: #3b82f6; font-weight: 500;">Essai</span>
                            <?php else: ?>
                                <span style="color: #ef4444; font-weight: 500;">Expiré</span>
                            <?php endif; ?>
                        </td>
                        <td style="padding: 12px; font-size: 0.88rem; color: var(--erp-text-muted);">
                            <?php echo $t['subscription_expires_at'] ? date('d/m/Y', strtotime($t['subscription_expires_at'])) : 'À vie'; ?>
                        </td>
                        <td style="padding: 12px;">
                            <?php if ($t['status'] === 'active'): ?>
                                <span class="erp-badge erp-badge-success">Actif</span>
                            <?php else: ?>
                                <span class="erp-badge erp-badge-danger">Suspendu</span>
                            <?php endif; ?>
                        </td>
                        <td style="padding: 12px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
                            <!-- Accéder au portail dédié -->
                            <a href="login.php?tenant=<?php echo urlencode($t['slug']); ?>" target="_blank" class="erp-btn erp-btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" title="Ouvrir le portail">
                                🔗 Portail
                            </a>
                            
                            <!-- Activer / Suspendre -->
                            <a href="index.php?page=saas_dashboard&toggle_status=1&id=<?php echo $t['id']; ?>" class="erp-btn <?php echo $t['status'] === 'active' ? 'erp-btn-secondary' : 'erp-btn-primary'; ?>" style="padding: 4px 8px; font-size: 0.8rem;" title="<?php echo $t['status'] === 'active' ? 'Suspendre' : 'Activer'; ?>">
                                <?php echo $t['status'] === 'active' ? '🚫 Suspendre' : '⚡ Activer'; ?>
                            </a>

                            <!-- Modifier -->
                            <button class="erp-btn erp-btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick='openEditTenantModal(<?php echo json_encode($t); ?>)'>
                                📝 Éditer
                            </button>

                            <!-- Supprimer -->
                            <?php if ($t['slug'] !== 'pilote'): ?>
                                <a href="index.php?page=saas_dashboard&delete_tenant=1&id=<?php echo $t['id']; ?>" class="erp-btn" style="padding: 4px 8px; font-size: 0.8rem; background-color: rgba(239, 68, 68, 0.15); color: #ef4444;" onclick="return confirm('Attention ! Supprimer cette entreprise détruira définitivement sa base de données et TOUTES ses informations métier (produits, ventes, comptabilité). Voulez-vous continuer ?')">
                                    🗑️ Suppr.
                                </a>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<!-- ==========================================================
     MODAL AJOUT LOCATAIRE
     ========================================================== -->
<div class="modal" id="addTenantModal">
    <div class="modal-content" style="max-width: 550px;">
        <div class="modal-header">
            <h3>Ajouter une Entreprise (Espace SaaS)</h3>
            <button type="button" class="modal-close" onclick="closeModal('addTenantModal')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body">
            <form method="POST" action="index.php?page=saas_dashboard">
                <input type="hidden" name="create_tenant" value="1">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label" for="company_name">Nom commercial *</label>
                        <input type="text" id="company_name" name="company_name" required placeholder="Ex: Supermarché Océan" class="form-control" oninput="generateSlug(this.value)">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="company_slug">Slug / Espace unique *</label>
                        <input type="text" id="company_slug" name="company_slug" required placeholder="Ex: ocean" class="form-control" style="font-family: monospace;">
                    </div>
                </div>

                <div style="background: rgba(129, 140, 248, 0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(129, 140, 248, 0.15); margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; font-size: 0.9rem; color: var(--erp-primary);">Compte Administrateur de l'Entreprise</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" for="admin_username">Identifiant *</label>
                            <input type="text" id="admin_username" name="admin_username" value="admin" required class="form-control">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" for="admin_password">Mot de passe *</label>
                            <input type="text" id="admin_password" name="admin_password" value="admin123" required class="form-control">
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label" for="subscription_plan">Plan de Facturation</label>
                        <select id="subscription_plan" name="subscription_plan" class="form-control">
                            <option value="basic">Standard (10k FCFA/mois)</option>
                            <option value="premium">Premium (30k FCFA/mois)</option>
                            <option value="business">Enterprise (75k FCFA/mois)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="subscription_status">Statut de l'Abonnement</label>
                        <select id="subscription_status" name="subscription_status" class="form-control">
                            <option value="trial">Essai gratuit (Trial)</option>
                            <option value="active">Actif / Payé</option>
                            <option value="expired">Expiré / Impayé</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="subscription_expires_at">Date de fin de l'abonnement</label>
                    <input type="date" id="subscription_expires_at" name="subscription_expires_at" class="form-control" value="<?php echo date('Y-m-d', strtotime('+30 days')); ?>">
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 1rem; font-weight: bold; margin-top: 10px; justify-content: center;">
                    Provisionner l'Espace ERP Dédié
                </button>
            </form>
        </div>
    </div>
</div>

<!-- ==========================================================
     MODAL ÉDITION LOCATAIRE
     ========================================================== -->
<div class="modal" id="editTenantModal">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h3>Modifier l'Entreprise Locataire</h3>
            <button type="button" class="modal-close" onclick="closeModal('editTenantModal')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body">
            <form method="POST" action="index.php?page=saas_dashboard">
                <input type="hidden" name="edit_tenant" value="1">
                <input type="hidden" name="tenant_id" id="edit_tenant_id">
                
                <div class="form-group">
                    <label class="form-label" for="edit_company_name">Nom commercial *</label>
                    <input type="text" id="edit_company_name" name="company_name" required class="form-control">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label" for="edit_subscription_plan">Plan de Facturation</label>
                        <select id="edit_subscription_plan" name="subscription_plan" class="form-control">
                            <option value="basic">Standard</option>
                            <option value="premium">Premium</option>
                            <option value="business">Enterprise</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="edit_subscription_status">Statut de l'Abonnement</label>
                        <select id="edit_subscription_status" name="subscription_status" class="form-control">
                            <option value="trial">Essai gratuit</option>
                            <option value="active">Actif / Payé</option>
                            <option value="expired">Expiré</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="edit_subscription_expires_at">Date de fin de l'abonnement</label>
                    <input type="date" id="edit_subscription_expires_at" name="subscription_expires_at" class="form-control">
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 1rem; font-weight: bold; margin-top: 10px; justify-content: center;">
                    Enregistrer les modifications
                </button>
            </form>
        </div>
    </div>
</div>

<script>
function openAddTenantModal() {
    openModal('addTenantModal');
}

function openEditTenantModal(tenant) {
    document.getElementById('edit_tenant_id').value = tenant.id;
    document.getElementById('edit_company_name').value = tenant.name;
    document.getElementById('edit_subscription_plan').value = tenant.subscription_plan;
    document.getElementById('edit_subscription_status').value = tenant.subscription_status;
    document.getElementById('edit_subscription_expires_at').value = tenant.subscription_expires_at || '';
    openModal('editTenantModal');
}

function generateSlug(val) {
    const slug = val.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "");
    document.getElementById('company_slug').value = slug;
}
</script>
