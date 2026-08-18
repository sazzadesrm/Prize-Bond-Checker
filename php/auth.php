<?php
/**
 * Bangladesh Prize Bond Checker - Authentication API & Controller
 * Developer: Sazzad Kabir (sazzadmbstu@gmail.com / +88-01810-076761)
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$action = isset($_GET['action']) ? $_GET['action'] : '';
$db = getDB();

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

switch ($action) {
    case 'login':
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            sendJsonResponse(['success' => false, 'error' => 'Email and password are required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM `users` WHERE `email` = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            $_SESSION['user'] = $user;
            sendJsonResponse([
                'success' => true,
                'message' => 'Login successful',
                'user'    => $user
            ]);
        } else {
            sendJsonResponse(['success' => false, 'error' => 'Invalid email or password'], 401);
        }
        break;

    case 'register':
        $name = trim($input['name'] ?? 'Prize Bond Investor');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $password = $input['password'] ?? '';
        $language = trim($input['language'] ?? 'bn');

        if (empty($email) || empty($password)) {
            sendJsonResponse(['success' => false, 'error' => 'Email and password are required'], 400);
        }

        // Check duplicate email
        $checkStmt = $db->prepare("SELECT id FROM `users` WHERE `email` = ?");
        $checkStmt->execute([$email]);
        if ($checkStmt->fetch()) {
            sendJsonResponse(['success' => false, 'error' => 'This email is already registered'], 409);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $insertStmt = $db->prepare("INSERT INTO `users` (`name`, `email`, `phone`, `password_hash`, `language`) VALUES (?, ?, ?, ?, ?)");
        $insertStmt->execute([$name, $email, $phone, $passwordHash, $language]);

        $userId = $db->lastInsertId();
        $user = [
            'id'         => (int)$userId,
            'name'       => $name,
            'email'      => $email,
            'phone'      => $phone,
            'role'       => 'user',
            'is_premium' => 1,
            'language'   => $language
        ];

        $_SESSION['user'] = $user;
        sendJsonResponse([
            'success' => true,
            'message' => 'Registration successful',
            'user'    => $user
        ], 201);
        break;

    case 'me':
    case 'profile':
        $user = getAuthUser();
        if ($user) {
            sendJsonResponse(['success' => true, 'user' => $user]);
        } else {
            sendJsonResponse(['success' => false, 'user' => null], 401);
        }
        break;

    case 'logout':
        unset($_SESSION['user']);
        session_destroy();
        sendJsonResponse(['success' => true, 'message' => 'Logged out successfully']);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Invalid auth action'], 400);
}
?>
