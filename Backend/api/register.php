<?php
/**
 * Registration API Endpoint
 * Method: POST
 * URL: /Backend/api/register.php
 *
 * Request Body (JSON):
 * {
 *   "full_name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "yourpassword",
 *   "confirm_password": "yourpassword"
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

// --- Sanitize & Validate Inputs ---
$full_name        = isset($data['full_name'])        ? trim(strip_tags($data['full_name']))        : '';
$email            = isset($data['email'])            ? trim(strtolower($data['email']))            : '';
$password         = isset($data['password'])         ? $data['password']                           : '';
$confirm_password = isset($data['confirm_password']) ? $data['confirm_password']                   : '';

$errors = [];

// Full name validation
if (empty($full_name)) {
    $errors[] = 'Full name is required.';
} elseif (strlen($full_name) < 3 || strlen($full_name) > 100) {
    $errors[] = 'Full name must be between 3 and 100 characters.';
}

// Email validation
if (empty($email)) {
    $errors[] = 'Email address is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}

// Password validation
if (empty($password)) {
    $errors[] = 'Password is required.';
} elseif (strlen($password) < 8) {
    $errors[] = 'Password must be at least 8 characters long.';
} elseif (!preg_match('/[A-Z]/', $password)) {
    $errors[] = 'Password must contain at least one uppercase letter.';
} elseif (!preg_match('/[0-9]/', $password)) {
    $errors[] = 'Password must contain at least one number.';
}

// Confirm password validation
if ($password !== $confirm_password) {
    $errors[] = 'Passwords do not match.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors), 'errors' => $errors]);
    exit;
}

// --- Database Operations ---
$pdo = getDBConnection();

// Check if email already exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);

if ($stmt->rowCount() > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'An account with this email already exists.']);
    exit;
}

// Hash the password securely
$hashed_password = password_hash($password, PASSWORD_BCRYPT);

// Insert the new user
$insertStmt = $pdo->prepare(
    "INSERT INTO users (full_name, email, password, created_at)
     VALUES (:full_name, :email, :password, NOW())"
);

$insertStmt->execute([
    ':full_name' => $full_name,
    ':email'     => $email,
    ':password'  => $hashed_password,
]);

$newUserId = $pdo->lastInsertId();

http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Account created successfully! Please log in.',
    'user'    => [
        'id'        => (int) $newUserId,
        'full_name' => $full_name,
        'email'     => $email,
    ],
]);
?>
