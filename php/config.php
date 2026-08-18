<?php
/**
 * Bangladesh Prize Bond Checker - System Configuration & Database Connection
 * Developer: Sazzad Kabir (sazzadmbstu@gmail.com / +88-01810-076761)
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database Credentials (Update with your cPanel / MySQL hosting details)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'prizebond_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Application Settings
define('APP_NAME', 'Prize Bond Checker');
define('APP_URL', getenv('APP_URL') ?: 'http://localhost');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error'   => 'Database connection failed: ' . $e->getMessage()
            ]);
            exit;
        }
    }
    return $pdo;
}

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function getAuthUser() {
    return isset($_SESSION['user']) ? $_SESSION['user'] : null;
}

function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        sendJsonResponse(['success' => false, 'error' => 'Authentication required.'], 401);
    }
    return $user;
}
?>
