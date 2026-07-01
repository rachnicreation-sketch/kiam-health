<?php
/**
 * Paramètres Boutique & Sauvegarde - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : réservé à l'Admin uniquement
requireRole(['admin']);

$message = '';
$error = '';

// ==========================================
// 1. DÉMARRAGE DE LA SAUVEGARDE SQL (BACKUP DB)
// ==========================================
if (isset($_GET['action']) && $_GET['action'] === 'backup_db') {
    try {
        // En-têtes pour forcer le téléchargement du fichier SQL
        $filename = "backup_kiam_caisse_" . date('Ymd_His') . ".sql";
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $filename . '"');

        // Récupérer la structure et le contenu des tables
        $tables = ['users', 'categories', 'products', 'clients', 'suppliers', 'expenses', 'supplier_orders', 'sales', 'sale_items', 'stock_movements', 'user_logs', 'settings'];
        
        echo "-- KIAM Caisse SQL Backup\n";
        echo "-- Date de génération : " . date('d/m/Y H:i:s') . "\n";
        echo "-- Host : localhost | Base : kiam_caisse\n\n";
        echo "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $table) {
            // 1. Structure de la table
            $createStmt = $pdo->query("SHOW CREATE TABLE `$table`")->fetch();
            echo "DROP TABLE IF EXISTS `$table`;\n";
            echo $createStmt[1] . ";\n\n";

            // 2. Contenu de la table
            $rows = $pdo->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($rows)) {
                echo "INSERT INTO `$table` VALUES \n";
                $inserts = [];
                foreach ($rows as $row) {
                    $values = array_map(function($val) use ($pdo) {
                        if ($val === null) return 'NULL';
                        return $pdo->quote($val);
                    }, $row);
                    $inserts[] = "(" . implode(", ", $values) . ")";
                }
                echo implode(",\n", $inserts) . ";\n\n";
            }
        }
        echo "SET FOREIGN_KEY_CHECKS=1;\n";
        exit; // Sortir immédiatement pour éviter de polluer le fichier SQL avec le code HTML du layout !
    } catch (Exception $e) {
        $error = "Erreur de sauvegarde : " . $e->getMessage();
    }
}

// ==========================================
// 2. ENREGISTRER LES MODIFICATIONS DES PARAMÈTRES
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_settings'])) {
    $compName = trim($_POST['company_name'] ?? '');
    $phone = trim($_POST['company_phone'] ?? '');
    $address = trim($_POST['company_address'] ?? '');
    $currency = trim($_POST['currency'] ?? 'FCFA');
    $tax = (float)($_POST['tax_rate'] ?? 18.00);

    // Charger les paramètres courants d'abord
    $settingsStmt = $pdo->query("SELECT * FROM settings LIMIT 1");
    $shopSettings = $settingsStmt->fetch();
    $logoPath = $shopSettings['company_logo'] ?? null;

    // Gérer l'upload du logo
    if (isset($_FILES['company_logo']) && $_FILES['company_logo']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $fileExtension = strtolower(pathinfo($_FILES['company_logo']['name'], PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg'];

        if (in_array($fileExtension, $allowedExtensions)) {
            $newFileName = 'logo_' . ($_SESSION['tenant_slug'] ?? 'master') . '_' . time() . '.' . $fileExtension;
            $destination = $uploadDir . $newFileName;
            
            if (move_uploaded_file($_FILES['company_logo']['tmp_name'], $destination)) {
                // Supprimer l'ancien logo si existant
                if ($logoPath && file_exists(__DIR__ . '/../' . $logoPath)) {
                    @unlink(__DIR__ . '/../' . $logoPath);
                }
                $logoPath = 'uploads/' . $newFileName;
            } else {
                $error = "Erreur lors du déplacement du logo.";
            }
        } else {
            $error = "Format de logo non autorisé (JPG, PNG, GIF et SVG uniquement).";
        }
    }

    if (!empty($compName) && empty($error)) {
        try {
            $stmt = $pdo->prepare("
                UPDATE settings 
                SET company_name = ?, company_phone = ?, company_address = ?, currency = ?, tax_rate = ?, company_logo = ?
                WHERE id = ?
            ");
            $stmt->execute([$compName, $phone, $address, $currency, $tax, $logoPath, $shopSettings['id']]);
            logAction($pdo, $_SESSION['user_id'], "Mise à jour des paramètres de la boutique : $compName");
            $message = "Paramètres de la boutique enregistrés avec succès !";
        } catch (PDOException $e) {
            $error = "Erreur lors de la mise à jour : " . $e->getMessage();
        }
    }
}

// Récupérer les paramètres actuels
$settingsStmt = $pdo->query("SELECT * FROM settings LIMIT 1");
$shopSettings = $settingsStmt->fetch();
?>

<!-- Bannières de Statut -->
<?php if (!empty($message)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo $message; ?>", 'success'));</script>
<?php endif; ?>
<?php if (!empty($error)): ?>
    <script>document.addEventListener('DOMContentLoaded', () => showNotification("<?php echo $error; ?>", 'danger'));</script>
<?php endif; ?>

<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
    <!-- Formulaire d'édition des paramètres (Gauche) -->
    <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
        <h3 style="margin-top: 0; margin-bottom: 20px; color: var(--erp-primary); border-bottom: 1px solid var(--erp-border); padding-bottom: 10px;">Paramètres de la Caisse & Informations de la Boutique</h3>
        
        <form method="POST" action="index.php?page=settings" enctype="multipart/form-data">
            <!-- Bloc Téléversement Logo -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; background: #f8fafc; border: 1px dashed var(--erp-border); border-radius: 4px; padding: 15px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: var(--erp-text-main);">Logo de l'entreprise</label>
                <?php if (!empty($shopSettings['company_logo'])): ?>
                    <div style="margin-bottom: 5px; display: flex; align-items: center; gap: 10px;">
                        <img src="<?php echo htmlspecialchars($shopSettings['company_logo']); ?>" alt="Logo actuel" style="max-height: 48px; border: 1px solid var(--erp-border); border-radius: 4px; padding: 2px; background: white;">
                        <span style="font-size: 0.78rem; color: var(--erp-text-muted);">Logo actif</span>
                    </div>
                <?php endif; ?>
                <input type="file" id="company_logo" name="company_logo" accept="image/*" style="font-size: 0.85rem;">
                <small style="color: var(--erp-text-muted); font-size: 0.78rem;">Formats recommandés : PNG, JPG, SVG. Taille max conseillée : 220x55px.</small>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Nom commercial de l'établissement *</label>
                    <input type="text" id="company_name" name="company_name" required value="<?php echo htmlspecialchars($shopSettings['company_name'] ?? ''); ?>" placeholder="Ex: KIAM Boutique S.A." style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Téléphone Service Client</label>
                    <input type="text" id="company_phone" name="company_phone" value="<?php echo htmlspecialchars($shopSettings['company_phone'] ?? ''); ?>" placeholder="Ex: +221 33 825 00 00" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px;">
                <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Adresse géographique du magasin</label>
                <input type="text" id="company_address" name="company_address" value="<?php echo htmlspecialchars($shopSettings['company_address'] ?? ''); ?>" placeholder="Ex: Avenue Cheikh Anta Diop, Dakar" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Devise Monétaire</label>
                    <input type="text" id="currency" name="currency" required value="<?php echo htmlspecialchars($shopSettings['currency'] ?? 'FCFA'); ?>" placeholder="Ex: FCFA, EUR, USD" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 0.85rem; font-weight: 500; color: var(--erp-text-main);">Taux de TVA standard (%)</label>
                    <input type="number" id="tax_rate" name="tax_rate" required step="0.01" min="0" value="<?php echo htmlspecialchars($shopSettings['tax_rate'] ?? '18.00'); ?>" placeholder="Ex: 18.00" style="padding: 8px 12px; border: 1px solid var(--erp-border); border-radius: 4px; font-size: 0.9rem; width: 100%;">
                </div>
            </div>

            <button type="submit" name="save_settings" class="erp-btn erp-btn-primary" style="padding: 10px 20px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Enregistrer la Configuration
            </button>
        </form>
    </div>

    <!-- Outil d'administration Système (Droite) -->
    <div style="display: flex; flex-direction: column; gap: 20px;">
        <!-- Card Backup -->
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 10px; color: var(--erp-primary);">Sauvegarde</h3>
            <p style="font-size: 0.85rem; color: var(--erp-text-muted); margin-bottom: 15px; line-height: 1.4;">
                Exportez et téléchargez une sauvegarde complète de votre base de données SQL pour sécuriser vos ventes, stocks et clients.
            </p>
            <a href="index.php?page=settings&action=backup_db" class="erp-btn erp-btn-primary" style="width: 100%; justify-content: center; padding: 10px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Exporter la Base (.SQL)
            </a>
        </div>

        <!-- Info Card -->
        <div style="background: #f9fafb; border: 1px solid var(--erp-border); border-radius: 4px; padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 10px; color: var(--erp-text-main);">À propos de KIAM</h3>
            <div style="font-size: 0.85rem; color: var(--erp-text-muted); line-height: 1.5;">
                <p style="margin: 3px 0;"><strong>Version :</strong> 1.0.0 (Stable)</p>
                <p style="margin: 3px 0;"><strong>Environnement :</strong> local Apache/MySQL (WAMP)</p>
                <p style="margin-top: 10px; line-height: 1.4;">Système de caisse professionnel propulsé par des architectures de transactions PDO natives haute performance.</p>
            </div>
        </div>
    </div>
</div>
