<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = getRequestData();

    // 1. Validation basics
    if (empty($data['name']) || empty($data['admin_email']) || empty($data['admin_password'])) {
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

        $stmt = $pdo->prepare("
            INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status)
            VALUES (?, ?, ?, ?, 'active')
        ");
        $stmt->execute([
            $tenantId,
            $data['name'],
            $data['sector'] ?? 'health',
            $data['plan_id'] ?? 'plan_basic'
        ]);

        // 3. Create Admin User for this tenant
        $hashedPassword = password_hash($data['admin_password'], PASSWORD_DEFAULT);
        $userId = "u_" . time();
        $stmt = $pdo->prepare("
            INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role)
            VALUES (?, ?, ?, ?, 'tenant_admin')
        ");
        $stmt->execute([
            $userId,
            $tenantId,
            $data['admin_email'],
            $hashedPassword
        ]);

        // 4. Welcome Notification & Email
        $announcementId = generateId('ANN-');
        $stmt = $pdo->prepare("INSERT INTO kiam_system_announcements (id, title, content, target_sector) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $announcementId,
            "Bienvenue chez Kiam !",
            "Bonjour " . ($data['admin_name'] ?? 'Administrateur') . ", votre espace " . $data['name'] . " est prêt. Explorez vos modules dès maintenant.",
            "tenant:" . $tenantId
        ]);

        $stmt = $pdo->prepare("INSERT INTO kiam_emails_sent (recipient, subject, body) VALUES (?, ?, ?)");
        $stmt->execute([
            $data['admin_email'],
            "Bienvenue sur Kiam SaaS !",
            "Félicitations, votre espace de gestion est activé."
        ]);

        // 5. Log the audit
        $stmt = $pdo->prepare("INSERT INTO kiam_audit_logs (action, user_id, tenant_id, entity_type) VALUES (?, ?, ?, 'tenant')");
        $stmt->execute(["Nouveau Locataire: " . $data['name'], $userId, $tenantId]);

        $pdo->commit();
        sendResponse(["status" => "success", "tenant_id" => $tenantId]);

    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => "Échec de l'inscription: " . $e->getMessage()], 500);
    }
} else {
    sendResponse(["status" => "error", "message" => "Méthode non autorisée."], 405);
}
?>
