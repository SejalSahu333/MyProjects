<?php
/**
 * Reset Password API Endpoint (Step 3)
 * Method: POST
 * URL: /Backend/api/reset-password.php
 *
 * Request Body: {
 *   "reset_token": "a3f9d1c2...",
 *   "password": "NewPassword123",
 *   "confirm_password": "NewPassword123"
 * }
 */

require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data     = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

$token            = isset($data['reset_token'])      ? trim($data['reset_token']) : '';
$password         = isset($data['password'])         ? $data['password']          : '';
$confirm_password = isset($data['confirm_password']) ? $data['confirm_password']  : '';

if (empty($token)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Reset token is required.']);
    exit;
}

// Password Validation
$errors = [];
if (empty($password)) {
    $errors[] = 'Password is required.';
} elseif (strlen($password) < 8) {
    $errors[] = 'Password must be at least 8 characters long.';
} elseif (!preg_match('/[A-Z]/', $password)) {
    $errors[] = 'Password must contain at least one uppercase letter.';
} elseif (!preg_match('/[0-9]/', $password)) {
    $errors[] = 'Password must contain at least one number.';
}

if ($password !== $confirm_password) {
    $errors[] = 'Passwords do not match.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors), 'errors' => $errors]);
    exit;
}

$pdo = getDBConnection();

// Look up the token
$stmt = $pdo->prepare("SELECT id, email, expires_at, is_used FROM password_resets WHERE reset_token = :token LIMIT 1");
$stmt->execute([':token' => $token]);
$record = $stmt->fetch();

if (!$record) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid or expired reset token.']);
    exit;
}

if ($record['is_used'] == 1) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid or expired reset token.']);
    exit;
}

$now = new DateTime();
$expiry = new DateTime($record['expires_at']);
if ($now > $expiry) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid or expired reset token.']);
    exit;
}

// Token is valid! Hash the new password
$hashed_password = password_hash($password, PASSWORD_BCRYPT);

// Use a transaction to ensure both updates succeed
try {
    $pdo->beginTransaction();

    // Update the user's password
    $updateUserStmt = $pdo->prepare("UPDATE users SET password = :password WHERE email = :email");
    $updateUserStmt->execute([
        ':password' => $hashed_password,
        ':email'    => $record['email']
    ]);

    // Mark the token/OTP as used
    $updateResetStmt = $pdo->prepare("UPDATE password_resets SET is_used = 1 WHERE id = :id");
    $updateResetStmt->execute([':id' => $record['id']]);

    $pdo->commit();

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Password reset successfully! Please log in.']);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred while resetting password.']);
}
?>
