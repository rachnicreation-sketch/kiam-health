<?php
/**
 * Installateur Automatique & Générateur de Données de Démonstration
 * 
 * ⚠️ SÉCURITÉ PRODUCTION: Ce fichier doit être supprimé ou rendu inaccessible
 * après l'installation initiale de la base de données.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'kiam_caisse');

$status = '';
$error = '';
$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;

// Vérifier si la base de données est déjà installée
if ($step === 1) {
    try {
        $testPdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $stmt = $testPdo->query("SELECT COUNT(*) FROM users");
        if ($stmt && $stmt->fetchColumn() > 0) {
            $status = 'already_installed';
        }
    } catch (PDOException $e) {
        // La DB n'existe pas ou la connexion a échoué - parfait pour l'installation
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['start_install'])) {
    try {
        // 1. Connexion au serveur MySQL (sans spécifier de base de données)
        $pdo = new PDO("mysql:host=" . DB_HOST, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        // 2. Lire et exécuter le schéma SQL
        $sqlPath = __DIR__ . '/database.sql';
        if (!file_exists($sqlPath)) {
            throw new Exception("Le fichier database.sql est introuvable à la racine de l'application.");
        }
        
        $sql = file_get_contents($sqlPath);
        $pdo->exec($sql);
        
        // Connexion à la base de données nouvellement créée
        $pdo->exec("USE `" . DB_NAME . "`");
        
        // 3. Insérer les paramètres par défaut (À personnaliser lors du déploiement)
        $pdo->exec("INSERT INTO `settings` (company_name, company_phone, company_email, company_address, currency, tax_rate) VALUES 
            ('Votre Boutique', '', '', '', 'FCFA', 18.00)");
            
        // 4. Insérer le premier utilisateur administrateur
        // NOTE: En production, changer le mot de passe ! Identifiants par défaut : admin / admin123
        $stmtUser = $pdo->prepare("INSERT INTO `users` (username, password_hash, role, name) VALUES (?, ?, ?, ?)");
        $stmtUser->execute(['admin', password_hash('admin123', PASSWORD_DEFAULT), 'admin', 'Administrateur']);
        
        // 9.5.1 Paramètres de Paie (Configuration pour le système RH)
        $pdo->exec("INSERT INTO `payroll_settings` (cnss_rate_employee, cnss_rate_employer, tax_bracket_rate, work_start_time, work_end_time, weekend_days, overtime_rate_multiplier, night_work_multiplier) VALUES 
            (5.50, 14.50, 10.00, '08:00:00', '17:00:00', 'Saturday,Sunday', 1.25, 1.50)")
        
        $step = 3; // Étape finale : Succès
    } catch (Exception $e) {
        $error = $e->getMessage();
        $step = 2; // Reste à l'étape de confirmation avec l'erreur
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Installateur - KIAM Caisse</title>
    <!-- Intégration de la police Outfit de Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0f172a;
            --bg-card: #1e293b;
            --text-main: #f8fafc;
            --text-secondary: #94a3b8;
            --primary: #6366f1;
            --primary-hover: #4f46e5;
            --success: #10b981;
            --danger: #f43f5e;
            --border: #334155;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background-color: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 20px;
            width: 100%;
            max-width: 600px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
        }

        .container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 60%);
            z-index: 0;
            pointer-events: none;
        }

        .content {
            position: relative;
            z-index: 1;
        }

        .logo-title {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo-title h1 {
            font-size: 2.2rem;
            font-weight: 700;
            color: var(--text-main);
            letter-spacing: -0.5px;
        }

        .logo-title h1 span {
            color: var(--primary);
        }

        .logo-title p {
            color: var(--text-secondary);
            font-size: 1rem;
            margin-top: 8px;
        }

        .status-box {
            background-color: rgba(99, 102, 241, 0.1);
            border: 1px dashed var(--primary);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }

        .status-box.success {
            background-color: rgba(16, 185, 129, 0.1);
            border-color: var(--success);
        }

        .status-box.danger {
            background-color: rgba(244, 63, 94, 0.1);
            border-color: var(--danger);
        }

        .status-box h3 {
            font-size: 1.2rem;
            margin-bottom: 8px;
        }

        .status-box p {
            color: var(--text-secondary);
            font-size: 0.95rem;
        }

        .btn {
            background-color: var(--primary);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 14px 28px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            text-decoration: none;
        }

        .btn:hover {
            background-color: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        .btn-success {
            background-color: var(--success);
        }

        .btn-success:hover {
            background-color: #0d9488;
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }

        .credentials-list {
            text-align: left;
            margin: 20px 0;
            background-color: rgba(15, 23, 42, 0.6);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid var(--border);
        }

        .credentials-list h4 {
            margin-bottom: 12px;
            font-size: 1.05rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 8px;
            color: var(--text-main);
        }

        .credential-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.95rem;
        }

        .credential-item:last-child {
            margin-bottom: 0;
        }

        .credential-item .label {
            color: var(--text-secondary);
        }

        .credential-item .val {
            font-family: monospace;
            font-weight: 600;
            color: var(--success);
        }

        .features-list {
            margin: 25px 0;
            text-align: left;
        }

        .features-list h4 {
            font-size: 1.1rem;
            margin-bottom: 15px;
            color: var(--text-main);
        }

        .features-list ul {
            list-style: none;
        }

        .features-list li {
            position: relative;
            padding-left: 28px;
            margin-bottom: 12px;
            font-size: 0.95rem;
            color: var(--text-secondary);
        }

        .features-list li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: var(--success);
            font-weight: 700;
            font-size: 1.1rem;
            top: -2px;
        }

        .back-link {
            display: inline-block;
            margin-top: 20px;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s;
        }

        .back-link:hover {
            color: var(--text-main);
        }
    </style>
</head>
<body>

<div class="container">
    <div class="content">
        <div class="logo-title">
            <h1>KIAM<span>Caisse</span></h1>
            <p>Système Intégré de Point de Vente & Gestion des Stocks</p>
        </div>

        <?php if ($step === 1): ?>
            <?php if ($status === 'already_installed'): ?>
                <div class="status-box success">
                    <h3>Application Déjà Installée !</h3>
                    <p>La base de données KIAM Caisse contient déjà des tables et des utilisateurs. Vous pouvez directement vous connecter.</p>
                </div>
                <a href="login.php" class="btn btn-success">Accéder à la Connexion</a>
            <?php else: ?>
                <div class="status-box">
                    <h3>Bienvenue dans l'assistant d'installation</h3>
                    <p>Nous allons initialiser la base de données <strong>kiam_caisse</strong>, configurer l'ensemble des tables métier et générer un jeu de données de test complet pour évaluer le système.</p>
                </div>
                
                <div class="features-list">
                    <h4>Ce qui va être installé :</h4>
                    <ul>
                        <li>Structure de base de données MySQL complète (21 tables relationnelles incluant Paie, RH et Sessions de Caisse).</li>
                        <li>Configuration entreprise vierge (à personnaliser) avec paramètres TVA 18% FCFA.</li>
                        <li>Compte administrateur sécurisé pour démarrer la configuration.</li>
                        <li>Paramètres de paie et structure RH complète prêts à l'emploi.</li>
                        <li>Système d'audit et de logs pour traçabilité complète des opérations.</li>
                    </ul>
                </div>

                <form method="POST">
                    <button type="submit" name="start_install" class="btn">Lancer l'Installation</button>
                </form>
            <?php endif; ?>

        <?php elseif ($step === 2): ?>
            <div class="status-box danger">
                <h3>Une erreur est survenue !</h3>
                <p><?php echo htmlspecialchars($error); ?></p>
            </div>
            <p style="color: var(--text-secondary); text-align: center; margin-bottom: 20px;">
                Veuillez vous assurer que votre serveur WAMP/MySQL est bien démarré et que les identifiants de connexion dans le fichier <code>install.php</code> correspondent à votre environnement.
            </p>
            <a href="install.php" class="btn">Réessayer</a>

        <?php elseif ($step === 3): ?>
            <div class="status-box success">
                <h3>Installation réussie avec succès !</h3>
                <p>La base de données et l'historique complet des données de test ont été initialisés en moins de 1 seconde.</p>
            </div>

            <div class="credentials-list">
                <h4>Compte administrateur initial :</h4>
                <div class="credential-item">
                    <span class="label">Identifiant :</span>
                    <span class="val">admin</span>
                </div>
                <div class="credential-item">
                    <span class="label">Mot de passe initial :</span>
                    <span class="val">admin123</span>
                </div>
            </div>

            <p style="color: var(--text-secondary); text-align: center; font-size: 0.9rem; margin-bottom: 30px;">
                <strong style="color: #f43f5e;">⚠️ IMPORTANT SÉCURITÉ :</strong><br/>
                Changez immédiatement le mot de passe administrateur après votre première connexion.<br/>
                Créez les autres utilisateurs (Gestionnaire, Caissier, RH, Comptable) dans les paramètres d'administration.
            </p>

            <a href="login.php" class="btn btn-success">Démarrer KIAM Caisse</a>
        <?php endif; ?>
    </div>
</div>

</body>
</html>
