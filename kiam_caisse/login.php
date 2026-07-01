<?php
/**
 * Page de Connexion Sécurisée SaaS Multi-Tenant - KIAM Caisse
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';

// Si déjà connecté, rediriger vers le dashboard
if (isLoggedIn()) {
    header('Location: index.php');
    exit;
}

$error = '';
$tenant = null;
$tenant_slug = trim($_GET['tenant'] ?? $_POST['tenant_slug'] ?? '');

// Vérifier et charger le locataire (tenant) si renseigné
if (!empty($tenant_slug)) {
    try {
        $stmt = $pdo_master->prepare("SELECT * FROM tenants WHERE slug = ? LIMIT 1");
        $stmt->execute([$tenant_slug]);
        $tenant = $stmt->fetch();
        if (!$tenant) {
            $error = "L'espace entreprise '" . htmlspecialchars($tenant_slug) . "' n'existe pas.";
            $tenant_slug = '';
        } elseif ($tenant['status'] === 'suspended') {
            $error = "Cet espace entreprise a été suspendu par l'administrateur SaaS.";
            $tenant = null;
            $tenant_slug = '';
        }
    } catch (PDOException $e) {
        $error = "Erreur de base de données : " . $e->getMessage();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $tenant_slug = trim($_POST['tenant_slug'] ?? '');

    if (!empty($username) && !empty($password)) {
        try {
            if (!empty($tenant_slug)) {
                // Connexion pour un compte locataire d'entreprise
                $stmtTenant = $pdo_master->prepare("SELECT * FROM tenants WHERE slug = ? LIMIT 1");
                $stmtTenant->execute([$tenant_slug]);
                $tObj = $stmtTenant->fetch();

                if ($tObj) {
                    if ($tObj['status'] === 'suspended') {
                        $error = "Cet espace entreprise est suspendu.";
                    } else {
                        // Connexion dynamique à la base de données du locataire
                        $tenantDb = $tObj['database_name'];
                        $tPdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . $tenantDb . ";charset=utf8mb4", DB_USER, DB_PASS, [
                            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                        ]);
                        
                        $stmt = $tPdo->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
                        $stmt->execute([$username]);
                        $user = $stmt->fetch();

                        if ($user && password_verify($password, $user['password_hash'])) {
                            if ($user['status'] === 'active') {
                                // Enregistrer dans la session
                                $_SESSION['user_id'] = $user['id'];
                                $_SESSION['user_username'] = $user['username'];
                                $_SESSION['user_name'] = $user['name'];
                                $_SESSION['user_role'] = $user['role'];
                                $_SESSION['tenant_id'] = $tObj['id'];
                                $_SESSION['tenant_slug'] = $tObj['slug'];
                                $_SESSION['tenant_db'] = $tObj['database_name'];

                                // Mettre à jour la date de dernière connexion dans la base du locataire
                                $updateStmt = $tPdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
                                $updateStmt->execute([$user['id']]);
                                
                                // Logger l'activité de connexion
                                logAction($tPdo, $user['id'], "Connexion réussie à l'espace : " . $tObj['name']);
                                
                                header('Location: index.php');
                                exit;
                            } else {
                                $error = 'Ce compte utilisateur d\'entreprise a été désactivé.';
                            }
                        } else {
                            $error = 'Nom d\'utilisateur ou mot de passe incorrect pour cet espace.';
                        }
                    }
                } else {
                    $error = "L'espace entreprise '" . htmlspecialchars($tenant_slug) . "' n'existe pas.";
                }
            } else {
                // Pas de slug : vérification s'il s'agit du Super Admin dans la base Master
                $stmt = $pdo_master->prepare("SELECT * FROM users WHERE username = ? AND role = 'super_admin' LIMIT 1");
                $stmt->execute([$username]);
                $user = $stmt->fetch();

                if ($user && password_verify($password, $user['password_hash'])) {
                    if ($user['status'] === 'active') {
                        $_SESSION['user_id'] = $user['id'];
                        $_SESSION['user_username'] = $user['username'];
                        $_SESSION['user_name'] = $user['name'];
                        $_SESSION['user_role'] = 'super_admin';
                        $_SESSION['tenant_db'] = DB_NAME_MASTER;

                        // Mettre à jour la connexion
                        $updateStmt = $pdo_master->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
                        $updateStmt->execute([$user['id']]);

                        header('Location: index.php');
                        exit;
                    } else {
                        $error = 'Ce compte Super Administrateur a été désactivé.';
                    }
                } else {
                    $error = 'Nom d\'utilisateur incorrect ou Espace Entreprise requis.';
                }
            }
        } catch (PDOException $e) {
            $error = 'Erreur système de base de données : ' . $e->getMessage();
        }
    } else {
        $error = 'Veuillez remplir tous les champs.';
    }
}
?>
<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - KIAM Caisse</title>
    <!-- Google Fonts Outfit -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #070d16;
            --bg-card: rgba(17, 24, 39, 0.75);
            --border-color: rgba(255, 255, 255, 0.08);
            --text-main: #f9fafb;
            --text-secondary: #9ca3af;
            --primary: #0099ff;
            --primary-hover: #0066cc;
            --danger: #fb7185;
            --shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: linear-gradient(135deg, #1e1b4b 0%, #0f0f23 50%, #0a0e27 100%);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        /* Arrière-plan dynamique */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.05) 0%, transparent 40%);
            z-index: 0;
            pointer-events: none;
        }

        .login-container {
            width: 100%;
            max-width: 360px;
            z-index: 1;
            position: relative;
        }

        .login-card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 28px 24px;
            box-shadow: var(--shadow);
            backdrop-filter: blur(12px);
        }

        .login-logo {
            text-align: center;
            margin-bottom: 24px;
        }

        .login-logo img {
            max-height: 60px;
            margin: 0 auto;
            display: block;
        }

        .login-title {
            text-align: center;
            margin-bottom: 24px;
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--text-main);
        }

        .error-banner {
            background-color: rgba(251, 113, 133, 0.1);
            border-left: 4px solid var(--danger);
            color: var(--danger);
            padding: 12px 14px;
            border-radius: 8px;
            font-size: 0.88rem;
            margin-bottom: 20px;
            font-weight: 500;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 6px;
        }

        .form-control {
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background-color: rgba(31, 41, 55, 0.5);
            color: var(--text-main);
            font-size: 0.95rem;
            transition: all 0.2s ease;
        }

        .form-control:focus {
            border-color: var(--primary);
            outline: none;
            background-color: rgba(17, 24, 39, 0.8);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .btn-submit {
            width: 100%;
            background-color: var(--primary);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 11px;
            font-size: 0.98rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 8px;
        }

        .btn-submit:hover {
            background-color: var(--primary-hover);
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.25);
        }

        .change-tenant-link {
            display: block;
            text-align: center;
            margin-top: 14px;
            font-size: 0.85rem;
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
        }

        .change-tenant-link:hover {
            text-decoration: underline;
        }

        .tenant-info {
            text-align: center;
            margin-bottom: 20px;
        }

        .tenant-info img {
            max-height: 50px;
            margin-bottom: 8px;
            border-radius: 8px;
        }

        .tenant-name {
            font-size: 0.95rem;
            color: var(--text-secondary);
        }
    </style>
</head>
<body>

<div class="login-container">
    <div class="login-card">
        <div class="login-logo">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23003d99;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%230066cc;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='100' cy='100' r='95' fill='none' stroke='url(%23grad1)' stroke-width='8' opacity='0.3'/%3E%3Cpath d='M 70 80 L 70 140 L 90 140 L 90 100' fill='%231aad1a' stroke='%231aad1a' stroke-width='3' stroke-linejoin='round'/%3E%3Cpath d='M 95 90 L 95 140 L 115 140 L 115 80' fill='%2366dd00' stroke='%2366dd00' stroke-width='3' stroke-linejoin='round'/%3E%3Cpath d='M 120 100 L 120 140 L 140 140 L 140 70' fill='%2399ff33' stroke='%2399ff33' stroke-width='3' stroke-linejoin='round'/%3E%3Cpath d='M 50 150 L 60 100 L 150 50 L 160 100' fill='none' stroke='url(%23grad1)' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" alt="KIAM Logo" style="width: 60px; height: 60px;">
        </div>

        <div class="login-title">KIAM Caisse</div>

        <?php if ($tenant): ?>
            <div class="tenant-info">
                <?php if (!empty($tenant['logo'])): ?>
                    <img src="<?php echo htmlspecialchars($tenant['logo']); ?>" alt="Logo entreprise">
                <?php endif; ?>
                <div class="tenant-name">🏢 <?php echo htmlspecialchars($tenant['name']); ?></div>
            </div>
        <?php endif; ?>

        <?php if (!empty($error)): ?>
            <div class="error-banner">
                <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="login.php">
            <!-- Champ Espace Entreprise caché si déjà identifié, sinon visible -->
            <?php if ($tenant): ?>
                <input type="hidden" name="tenant_slug" value="<?php echo htmlspecialchars($tenant['slug']); ?>">
            <?php else: ?>
                <div class="form-group">
                    <label class="form-label" for="tenant_slug">Nom d'entreprise</label>
                    <input class="form-control" type="text" id="tenant_slug" name="tenant_slug" placeholder="Ex: monentreprise" value="<?php echo htmlspecialchars($tenant_slug); ?>" autocomplete="off">
                </div>
            <?php endif; ?>

            <div class="form-group">
                <label class="form-label" for="username">Nom d'utilisateur</label>
                <input class="form-control" type="text" id="username" name="username" placeholder="Ex: admin" required autocomplete="username">
            </div>

            <div class="form-group">
                <label class="form-label" for="password">Mot de passe</label>
                <input class="form-control" type="password" id="password" name="password" placeholder="••••••••" required autocomplete="current-password">
            </div>

            <button type="submit" class="btn-submit">Se Connecter</button>

            <?php if ($tenant): ?>
                <a href="login.php" class="change-tenant-link">← Changer d'entreprise</a>
            <?php endif; ?>
        </form>
    </div>
</div>

</body>
</html>
