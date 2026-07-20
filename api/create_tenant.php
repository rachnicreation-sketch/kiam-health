<?php
require_once 'config.php';
require_once 'functions.php';
require_once 'email_service.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = getRequestData();

    // 1. Validation basics
    if (empty($data['name']) || empty($data['admin_email'])) {
        sendResponse(["status" => "error", "message" => "Données incomplètes."], 400);
    }

    try {
        $pdo->beginTransaction();

        // 2. Create Tenant (ID unique based on name)
        $tenantId = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $data['name']));

        // Ensure uniqueness
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM kiam_tenants WHERE id = ?");
        $stmt->execute([$tenantId]);
        if ($stmt->fetchColumn() > 0) {
            $tenantId .= rand(10, 99);
        }

        // Determine if this is the trial plan (Forfait Découverte)
        $planId = $data['plan_id'] ?? 'plan_decouverte';
        $isTrialPlan = ($planId === 'plan_decouverte');
        $subscriptionStatus = $isTrialPlan ? 'trial' : 'active';
        $trialEndsAt = $isTrialPlan ? date('Y-m-d H:i:s', strtotime('+35 days')) : null;

        $stmt = $pdo->prepare("
            INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status, trial_ends_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $tenantId,
            $data['name'],
            $data['sector'] ?? 'health',
            $planId,
            $subscriptionStatus,
            $trialEndsAt
        ]);

        // 3. Create Admin User for this tenant
        // Generate username from admin_username field, or fallback to a slug of the establishment name
        $rawUsername = !empty($data['admin_username'])
            ? $data['admin_username']
            : strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $data['admin_name'] ?? $data['name']));

        // Ensure username uniqueness
        $baseUsername = $rawUsername;
        $suffix = 1;
        while (true) {
            $chk = $pdo->prepare("SELECT COUNT(*) FROM kiam_global_users WHERE username = ?");
            $chk->execute([$rawUsername]);
            if ((int)$chk->fetchColumn() === 0) break;
            $rawUsername = $baseUsername . $suffix++;
        }

        // Generate a strong password if none provided
        $plainPassword = !empty($data['admin_password']) ? $data['admin_password'] : 'Kiam@' . rand(1000, 9999) . '!';
        $hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);
        $userId = "u_" . time();

        $stmt = $pdo->prepare("
            INSERT INTO kiam_global_users (id, tenant_id, email, username, password_hash, full_name, global_role)
            VALUES (?, ?, ?, ?, ?, ?, 'tenant_admin')
        ");
        $stmt->execute([
            $userId,
            $tenantId,
            $data['admin_email'],
            $rawUsername,
            $hashedPassword,
            $data['admin_name'] ?? ''
        ]);

        // 4. Welcome Notification
        $announcementId = generateId('ANN-');
        $stmt = $pdo->prepare("INSERT INTO kiam_system_announcements (id, title, content, target_sector) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $announcementId,
            "Bienvenue chez Kiam !",
            "Bonjour " . ($data['admin_name'] ?? 'Administrateur') . ", votre espace " . $data['name'] . " est prêt. Explorez vos modules dès maintenant.",
            "tenant:" . $tenantId
        ]);

        // 5. Send credentials by email
        $planLabel = $isTrialPlan ? 'Forfait Découverte (45 jours gratuits)' : ($data['plan_id'] ?? 'Standard');
        $trialNote = $isTrialPlan ? "\n\n⚠️  IMPORTANT : Votre accès est valable 45 jours à compter d'aujourd'hui. Passé ce délai, le compte sera automatiquement suspendu jusqu'à souscription d'un forfait payant." : '';

        $emailSubject = "[Kiam SaaS] Vos identifiants de connexion — " . $data['name'];
        $emailBody = "Bonjour " . ($data['admin_name'] ?? 'Administrateur') . ",\n\n"
            . "Votre espace de gestion Kiam SaaS a été créé avec succès.\n\n"
            . "══════════════════════════════════════\n"
            . "  IDENTIFIANTS DE CONNEXION\n"
            . "══════════════════════════════════════\n"
            . "  Établissement : " . $data['name'] . "\n"
            . "  Secteur       : " . ($data['sector'] ?? 'health') . "\n"
            . "  Forfait       : " . $planLabel . "\n"
            . "  URL de connexion : http://localhost/kiam/\n\n"
            . "  Nom d'utilisateur : " . $rawUsername . "\n"
            . "  Mot de passe      : " . $plainPassword . "\n"
            . "══════════════════════════════════════"
            . $trialNote . "\n\n"
            . "Pour des raisons de sécurité, veuillez changer votre mot de passe dès votre première connexion.\n\n"
            . "Cordialement,\nL'équipe Kiam SaaS";

        // Send to tenant email
        sendEmail($data['admin_email'], $emailSubject, $emailBody);

        // Send copy to admin email
        sendEmail('contact.rxservices@gmail.com', "[COPIE ADMIN] " . $emailSubject, $emailBody);

        // Log in kiam_emails_sent table
        $stmt = $pdo->prepare("INSERT INTO kiam_emails_sent (recipient, subject, body) VALUES (?, ?, ?)");
        $stmt->execute([$data['admin_email'], $emailSubject, $emailBody]);
        $stmt->execute(['contact.rxservices@gmail.com', "[COPIE] " . $emailSubject, $emailBody]);

        // 6. Log the audit
        $stmt = $pdo->prepare("INSERT INTO kiam_audit_logs (action, user_id, tenant_id, entity_type) VALUES (?, ?, ?, 'tenant')");
        $stmt->execute(["Nouveau Locataire: " . $data['name'], $userId, $tenantId]);

        // 7. Seed Demo Data
        $sector = $data['sector'] ?? 'health';
        if ($sector === 'hotel') {
            $pdo->exec("INSERT INTO hotel_rooms (id, clinic_id, room_number, type, category, price, status) VALUES 
                ('RM-101', '$tenantId', '101', 'Standard', 'Standard', 35000, 'available'),
                ('RM-102', '$tenantId', '102', 'Luxe', 'Luxe', 75000, 'available'),
                ('RM-103', '$tenantId', '201', 'Suite', 'Suite', 120000, 'available')
            ON DUPLICATE KEY UPDATE status=VALUES(status)");
        } elseif ($sector === 'health') {
            $pdo->exec("INSERT INTO patients (id, clinic_id, name, phone, email) VALUES 
                ('P-DEMO-01', '$tenantId', 'Seydou Keïta', '+221 77 111 2233', 'seydou@example.com'),
                ('P-DEMO-02', '$tenantId', 'Amina Diallo', '+221 77 222 3344', 'amina@example.com')
            ON DUPLICATE KEY UPDATE name=VALUES(name)");
        } elseif ($sector === 'erp') {
            $pdo->exec("INSERT INTO erp_products (id, clinic_id, name, price, stock) VALUES 
                ('PRD-01', '$tenantId', 'Ordinateur Kiam Pro', 350000, 10),
                ('PRD-02', '$tenantId', 'Téléphone Kiam Note', 150000, 25)
            ON DUPLICATE KEY UPDATE name=VALUES(name)");
        } elseif ($sector === 'school') {
            $pdo->exec("INSERT INTO school_classes (id, clinic_id, name) VALUES 
                ('C-CM2', '$tenantId', 'CM2-A'),
                ('C-6EME', '$tenantId', '6ème B')
            ON DUPLICATE KEY UPDATE name=VALUES(name)");
        } elseif ($sector === 'pharmacy') {
            $pdo->exec("INSERT INTO medications (id, clinic_id, name, stock, threshold) VALUES 
                ('MED-01', '$tenantId', 'Paracétamol 500mg', 500, 50),
                ('MED-02', '$tenantId', 'Amoxicilline 1g', 100, 20)
            ON DUPLICATE KEY UPDATE name=VALUES(name)");
        } elseif ($sector === 'enterprise') {
            $pdo->exec("INSERT INTO enterprise_projects (id, clinic_id, name, budget) VALUES 
                ('PRJ-01', '$tenantId', 'Développement SaaS Kiam', 5000000)
            ON DUPLICATE KEY UPDATE name=VALUES(name)");
        }

        $pdo->commit();
        sendResponse(["status" => "success", "tenant_id" => $tenantId, "username" => $rawUsername]);

    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => "Échec de l'inscription: " . $e->getMessage()], 500);
    }
} else {
    sendResponse(["status" => "error", "message" => "Méthode non autorisée."], 405);
}
?>
