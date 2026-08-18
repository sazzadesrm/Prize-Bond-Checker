<?php
/**
 * Bangladesh Prize Bond Checker - Full Core API & Verification Engine
 * Developer: Sazzad Kabir (sazzadmbstu@gmail.com / +88-01810-076761)
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$action = isset($_GET['action']) ? $_GET['action'] : '';
$db = getDB();
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

switch ($action) {
    case 'draws':
        $stmt = $db->query("SELECT * FROM `draws` ORDER BY `draw_number` DESC");
        $draws = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'draws' => $draws]);
        break;

    case 'check_single':
        $bondNumber = preg_replace('/[^0-9]/', '', $input['number'] ?? ($_GET['number'] ?? ''));
        $bondNumber = str_pad($bondNumber, 7, '0', STR_PAD_LEFT);
        $drawNumber = isset($input['draw_number']) ? (int)$input['draw_number'] : 0;

        if (empty($bondNumber)) {
            sendJsonResponse(['success' => false, 'error' => 'Please enter a valid 7-digit bond number'], 400);
        }

        // Query winning result
        $sql = "SELECT r.*, d.draw_number, d.scheduled_date, d.location 
                FROM `draw_results` r
                JOIN `draws` d ON r.draw_id = d.id
                WHERE r.bond_number = ?";
        $params = [$bondNumber];

        if ($drawNumber > 0) {
            $sql .= " AND d.draw_number = ?";
            $params[] = $drawNumber;
        }

        $sql .= " ORDER BY d.draw_number DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $winnings = $stmt->fetchAll();

        $isWinner = count($winnings) > 0;
        sendJsonResponse([
            'success'     => true,
            'bond_number' => $bondNumber,
            'is_winner'   => $isWinner,
            'total_wins'  => count($winnings),
            'winnings'    => $winnings
        ]);
        break;

    case 'check_batch':
        $bondsRaw = $input['bonds'] ?? [];
        if (!is_array($bondsRaw) || empty($bondsRaw)) {
            sendJsonResponse(['success' => false, 'error' => 'No bond numbers provided'], 400);
        }

        $cleanBonds = [];
        foreach ($bondsRaw as $b) {
            $num = preg_replace('/[^0-9]/', '', (string)$b);
            if (!empty($num)) {
                $cleanBonds[] = str_pad($num, 7, '0', STR_PAD_LEFT);
            }
        }
        $cleanBonds = array_unique($cleanBonds);

        if (empty($cleanBonds)) {
            sendJsonResponse(['success' => false, 'error' => 'No valid bond numbers found'], 400);
        }

        $placeholders = str_repeat('?,', count($cleanBonds) - 1) . '?';
        $sql = "SELECT r.*, d.draw_number, d.scheduled_date, d.location 
                FROM `draw_results` r
                JOIN `draws` d ON r.draw_id = d.id
                WHERE r.bond_number IN ($placeholders)
                ORDER BY d.draw_number DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($cleanBonds);
        $allWinnings = $stmt->fetchAll();

        // Group by winning bond number
        $winningMap = [];
        foreach ($allWinnings as $w) {
            $winningMap[$w['bond_number']][] = $w;
        }

        $results = [];
        $totalPrize = 0;
        $winnerCount = 0;

        foreach ($cleanBonds as $bond) {
            $isWin = isset($winningMap[$bond]);
            $wins = $isWin ? $winningMap[$bond] : [];
            if ($isWin) {
                $winnerCount++;
                foreach ($wins as $win) {
                    $totalPrize += (float)$win['prize_amount'];
                }
            }
            $results[] = [
                'bond_number' => $bond,
                'is_winner'   => $isWin,
                'winnings'    => $wins
            ];
        }

        sendJsonResponse([
            'success'       => true,
            'total_checked' => count($cleanBonds),
            'total_winners' => $winnerCount,
            'total_prize'   => $totalPrize,
            'results'       => $results
        ]);
        break;

    case 'portfolio':
        $user = requireAuth();
        $stmt = $db->prepare("SELECT * FROM `portfolio_bonds` WHERE `user_id` = ? ORDER BY `id` DESC");
        $stmt->execute([$user['id']]);
        $bonds = $stmt->fetchAll();

        $totalInvestment = count($bonds) * 100;
        $totalWinnings = 0;
        $totalWinners = 0;

        foreach ($bonds as $b) {
            if ($b['is_winner']) {
                $totalWinners++;
                $totalWinnings += (float)$b['winning_amount'];
            }
        }

        sendJsonResponse([
            'success' => true,
            'bonds'   => $bonds,
            'stats'   => [
                'total_bonds'      => count($bonds),
                'total_investment' => $totalInvestment,
                'total_winnings'   => $totalWinnings,
                'net_profit'       => $totalWinnings - $totalInvestment,
                'total_winners'    => $totalWinners
            ]
        ]);
        break;

    case 'add_portfolio_bond':
        $user = requireAuth();
        $series = strtoupper(trim($input['bond_series'] ?? 'KA'));
        $number = preg_replace('/[^0-9]/', '', $input['bond_number'] ?? '');
        $number = str_pad($number, 7, '0', STR_PAD_LEFT);
        $purchaseDate = !empty($input['purchase_date']) ? $input['purchase_date'] : null;
        $notes = trim($input['notes'] ?? '');

        if (strlen($number) !== 7) {
            sendJsonResponse(['success' => false, 'error' => 'Valid 7-digit bond number is required'], 400);
        }

        // Check if winning bond
        $winStmt = $db->prepare("SELECT r.*, d.draw_number FROM `draw_results` r JOIN `draws` d ON r.draw_id = d.id WHERE r.bond_number = ? ORDER BY d.draw_number DESC LIMIT 1");
        $winStmt->execute([$number]);
        $win = $winStmt->fetch();

        $isWinner = $win ? 1 : 0;
        $prizeTier = $win ? $win['prize_tier'] : null;
        $prizeAmount = $win ? $win['prize_amount'] : 0.00;
        $drawNum = $win ? $win['draw_number'] : null;

        $stmt = $db->prepare("INSERT INTO `portfolio_bonds` (`user_id`, `bond_series`, `bond_number`, `purchase_date`, `notes`, `is_winner`, `winning_prize_tier`, `winning_amount`, `winning_draw_number`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user['id'], $series, $number, $purchaseDate, $notes, $isWinner, $prizeTier, $prizeAmount, $drawNum]);

        sendJsonResponse(['success' => true, 'message' => 'Bond added to portfolio', 'id' => $db->lastInsertId()]);
        break;

    case 'delete_portfolio_bond':
        $user = requireAuth();
        $id = (int)($input['id'] ?? ($_GET['id'] ?? 0));
        $stmt = $db->prepare("DELETE FROM `portfolio_bonds` WHERE `id` = ? AND `user_id` = ?");
        $stmt->execute([$id, $user['id']]);
        sendJsonResponse(['success' => true, 'message' => 'Bond deleted']);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Invalid API action'], 400);
}
?>
