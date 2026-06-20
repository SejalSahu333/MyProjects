<?php
/**
 * Login API Endpoint
 * Method: POST
 * URL: /Backend/api/login.php
 *
 * Request Body (JSON):
 * {
 *   "email": "john@example.com",
 *   "password": "yourpassword"
 * }
 */

require_once '../config/cors.php';
require_once '../config/database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use POST.']);
    exit;
}

// --- Read and decode JSON body ---
$rawInput = file_get_contents('php://input');
$data     = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

// --- Sanitize Inputs ---
$email    = isset($data['email'])    ? trim(strtolower($data['email'])) : '';
$password = isset($data['password']) ? $data['password']                : '';

$errors = [];

if (empty($email)) {
    $errors[] = 'Email address is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}

if (empty($password)) {
    $errors[] = 'Password is required.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors), 'errors' => $errors]);
    exit;
}

// --- Database Lookup ---
$pdo  = getDBConnection();
$stmt = $pdo->prepare("SELECT id, full_name, email, password FROM users WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

// Verify user exists and password matches
if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
    exit;
}

// Generate a simple session token (for stateless auth demo)
$token = bin2hex(random_bytes(32));

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Login successful! Welcome back, ' . $user['full_name'] . '.',
    'token'   => $token,
    'user'    => [
        'id'        => (int) $user['id'],
        'full_name' => $user['full_name'],
        'email'     => $user['email'],
    ],
]);
?>
