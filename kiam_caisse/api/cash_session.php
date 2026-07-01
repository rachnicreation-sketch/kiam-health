<?php
/**
 * API Sessions de Caisse (Ouverture / Clôture) - KIAM Caisse
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection : Utilisateur connecté requis
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit;
}

$userId = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        
        if ($action === 'check') {
            // Vérifier s'il y a une session active
            $stmt = $pdo->prepare("SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'open' LIMIT 1");
            $stmt->execute([$userId]);
            $session = $stmt->fetch();
            
            if ($session) {
                echo json_encode([
                    'success' => true,
                    'active' => true,
                    'session' => $session
                ]);
            } else {
                echo json_encode([
                    'success' => true,
                    'active' => false
                ]);
            }
            exit;
            
        } elseif ($action === 'summary') {
            // Obtenir le résumé financier de la session en cours
            $stmt = $pdo->prepare("SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'open' LIMIT 1");
            $stmt->execute([$userId]);
            $session = $stmt->fetch();
            
            if (!$session) {
                echo json_encode(['success' => false, 'error' => 'Aucune session active trouvée.']);
                exit;
            }
            
            $sessionId = $session['id'];
            $openedAt = $session['opened_at'];
            $openingBalance = (float)$session['opening_balance'];
            
            // 1. Calcul des ventes en espèces (cash)
            $stmtCash = $pdo->prepare("SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE session_id = ? AND payment_method = 'cash' AND status = 'completed'");
            $stmtCash->execute([$sessionId]);
            $cashSales = (float)$stmtCash->fetchColumn();
            
            // 2. Calcul des ventes Mobile Money
            $stmtMomo = $pdo->prepare("SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE session_id = ? AND payment_method = 'mobile_money' AND status = 'completed'");
            $stmtMomo->execute([$sessionId]);
            $momoSales = (float)$stmtMomo->fetchColumn();
            
            // 3. Calcul des ventes par Carte Bancaire
            $stmtCard = $pdo->prepare("SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE session_id = ? AND payment_method = 'card' AND status = 'completed'");
            $stmtCard->execute([$sessionId]);
            $cardSales = (float)$stmtCard->fetchColumn();
            
            // 4. Dépenses enregistrées depuis l'ouverture de la caisse
            $stmtExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE created_at >= ?");
            $stmtExp->execute([$openedAt]);
            $expensesAmount = (float)$stmtExp->fetchColumn();
            
            // 5. Calcul de l'attendu en espèces
            $expectedClosingBalance = $openingBalance + $cashSales - $expensesAmount;
            
            echo json_encode([
                'success' => true,
                'session_id' => $sessionId,
                'opened_at' => $openedAt,
                'opening_balance' => $openingBalance,
                'cash_sales' => $cashSales,
                'momo_sales' => $momoSales,
                'card_sales' => $cardSales,
                'expenses' => $expensesAmount,
                'expected_closing_balance' => $expectedClosingBalance,
                'cashier_name' => $_SESSION['user_name']
            ]);
            exit;
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        
        // Lire le corps de la requête JSON
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }
        
        if ($action === 'open') {
            // Vérifier s'il y a déjà une session ouverte
            $stmtCheck = $pdo->prepare("SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'open' LIMIT 1");
            $stmtCheck->execute([$userId]);
            if ($stmtCheck->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Une session de caisse est déjà active pour ce compte.']);
                exit;
            }
            
            $openingBalance = isset($input['opening_balance']) ? (float)$input['opening_balance'] : 0.00;
            $notes = trim($input['notes'] ?? '');
            
            if ($openingBalance < 0) {
                echo json_encode(['success' => false, 'error' => 'Le fond de caisse initial ne peut pas être négatif.']);
                exit;
            }
            
            $stmt = $pdo->prepare("INSERT INTO cash_sessions (user_id, opening_balance, expected_closing_balance, actual_closing_balance, difference, status, notes) VALUES (?, ?, 0.00, 0.00, 0.00, 'open', ?)");
            $stmt->execute([$userId, $openingBalance, $notes]);
            $newSessionId = $pdo->lastInsertId();
            
            // Logger l'activité
            logAction($pdo, $userId, "Ouverture de caisse - Session ID: $newSessionId, Fond de caisse: $openingBalance FCFA");
            
            echo json_encode([
                'success' => true,
                'session_id' => $newSessionId,
                'message' => 'Caisse ouverte avec succès'
            ]);
            exit;
            
        } elseif ($action === 'close') {
            // Fermer la session de caisse
            $stmt = $pdo->prepare("SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'open' LIMIT 1");
            $stmt->execute([$userId]);
            $session = $stmt->fetch();
            
            if (!$session) {
                echo json_encode(['success' => false, 'error' => 'Aucune session active à clôturer.']);
                exit;
            }
            
            $sessionId = $session['id'];
            $openingBalance = (float)$session['opening_balance'];
            $openedAt = $session['opened_at'];
            $actualClosingBalance = isset($input['actual_closing_balance']) ? (float)$input['actual_closing_balance'] : 0.00;
            $closeNotes = trim($input['notes'] ?? '');
            
            if ($actualClosingBalance < 0) {
                echo json_encode(['success' => false, 'error' => 'Le montant réel compté ne peut pas être négatif.']);
                exit;
            }
            
            // Recalculer les attendus pour verrouiller le Z-report final
            $stmtCash = $pdo->prepare("SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE session_id = ? AND payment_method = 'cash' AND status = 'completed'");
            $stmtCash->execute([$sessionId]);
            $cashSales = (float)$stmtCash->fetchColumn();
            
            $stmtExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE created_at >= ?");
            $stmtExp->execute([$openedAt]);
            $expensesAmount = (float)$stmtExp->fetchColumn();
            
            $expectedClosingBalance = $openingBalance + $cashSales - $expensesAmount;
            $difference = $actualClosingBalance - $expectedClosingBalance;
            
            // Concaténer les notes
            $originalNotes = $session['notes'] ? $session['notes'] . " | " : "";
            $finalNotes = $originalNotes . "Clôture: " . $closeNotes;
            
            // Démarrer une transaction pour garantir la clôture
            $pdo->beginTransaction();
            
            $stmtUpdate = $pdo->prepare("UPDATE cash_sessions SET closed_at = CURRENT_TIMESTAMP, expected_closing_balance = ?, actual_closing_balance = ?, difference = ?, status = 'closed', notes = ? WHERE id = ?");
            $stmtUpdate->execute([$expectedClosingBalance, $actualClosingBalance, $difference, $finalNotes, $sessionId]);
            
            $pdo->commit();
            
            // Logger l'activité
            logAction($pdo, $userId, "Clôture de caisse - Session ID: $sessionId, Attendu: $expectedClosingBalance, Réel: $actualClosingBalance, Écart: $difference");
            
            // Récupérer la session clôturée pour renvoyer au ticket final
            $stmtClosed = $pdo->prepare("SELECT * FROM cash_sessions WHERE id = ?");
            $stmtClosed->execute([$sessionId]);
            $closedSession = $stmtClosed->fetch();
            
            // Obtenir les stats finales pour l'impression du Z-Report
            $stmtMomo = $pdo->prepare("SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE session_id = ? AND payment_method = 'mobile_money' AND status = 'completed'");
            $stmtMomo->execute([$sessionId]);
            $momoSales = (float)$stmtMomo->fetchColumn();
            
            $stmtCard = $pdo->prepare("SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE session_id = ? AND payment_method = 'card' AND status = 'completed'");
            $stmtCard->execute([$sessionId]);
            $cardSales = (float)$stmtCard->fetchColumn();
            
            echo json_encode([
                'success' => true,
                'session' => $closedSession,
                'totals' => [
                    'opening_balance' => $openingBalance,
                    'cash_sales' => $cashSales,
                    'momo_sales' => $momoSales,
                    'card_sales' => $cardSales,
                    'expenses' => $expensesAmount,
                    'expected' => $expectedClosingBalance,
                    'actual' => $actualClosingBalance,
                    'difference' => $difference
                ],
                'cashier_name' => $_SESSION['user_name']
            ]);
            exit;
        }
    }
    
    echo json_encode(['success' => false, 'error' => 'Action non supportée']);
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
