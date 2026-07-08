<?php
/**
 * Service d'envoi d'e-mails via SMTP avec PHPMailer
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

function sendEmail($to, $subject, $body) {
    // 1. Charger PHPMailer
    $autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
    if (file_exists($autoloadPath)) {
        require_once $autoloadPath;
    }
    
    // Si la classe PHPMailer n'est pas chargée (au cas où l'autoloader composer n'a pas fini)
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        $vendorPath = dirname(__DIR__) . '/vendor/phpmailer/phpmailer/src/';
        if (file_exists($vendorPath . 'PHPMailer.php')) {
            require_once $vendorPath . 'Exception.php';
            require_once $vendorPath . 'PHPMailer.php';
            require_once $vendorPath . 'SMTP.php';
        }
    }

    // 2. Vérifier si les identifiants SMTP sont configurés
    // Si le mot de passe SMTP est vide, on bascule en mode mail() PHP standard (pour ne pas bloquer)
    if (!defined('SMTP_PASS') || trim(SMTP_PASS) === '') {
        $headers = "From: " . (defined('SMTP_FROM_EMAIL') ? SMTP_FROM_EMAIL : 'noreply@kiam.local') . "\r\n";
        $headers .= "Reply-To: " . (defined('SMTP_FROM_EMAIL') ? SMTP_FROM_EMAIL : 'noreply@kiam.local') . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        return @mail($to, $subject, $body, $headers);
    }

    // 3. Envoi via PHPMailer
    $mail = new PHPMailer(true);

    try {
        // Configuration Serveur
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = (SMTP_SECURE === 'ssl') ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';

        // Options SSL pour éviter les blocages de certificat auto-signé sur localhost
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );

        // Destinataires
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->addAddress($to);

        // Contenu
        $mail->isHTML(false); // Mode texte brut
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (Exception $e) {
        // En cas d'erreur SMTP, journaliser et basculer sur mail() par défaut
        error_log("Erreur SMTP : " . $mail->ErrorInfo);
        $headers = "From: " . SMTP_FROM_EMAIL . "\r\n";
        return @mail($to, $subject, $body, $headers);
    }
}
?>
