<?php
/**
 * Verify OTP API Endpoint (Step 2)
 * Method: POST
 * URL: /Backend/api/verify-otp.php
 *
 * Request Body: { "email": "john@example.com", "otp": "123456" }
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

$email = isset($data['email']) ? trim(strtolower($data['email'])) : '';
$otp   = isset($data['otp'])   ? trim($data['otp'])                : '';

if (empty($email)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Email address is required.']);
    exit;
}

if (empty($otp)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'OTP is required.']);
    exit;
}

if (strlen($otp) !== 6 || !ctype_digit($otp)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'OTP must be exactly 6 digits.']);
    exit;
}

$pdo = getDBConnection();

// Look up the latest OTP for this email
$stmt = $pdo->prepare("SELECT id, otp, expires_at, is_used FROM password_resets WHERE email = :email ORDER BY created_at DESC LIMIT 1");
$stmt->execute([':email' => $email]);
$record = $stmt->fetch();

if (!$record) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid OTP.']);
    exit;
}

// Check if OTP matches
if ($record['otp'] !== $otp) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid OTP.']);
    exit;
}

// Check if already used
if ($record['is_used'] == 1) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'OTP has already been used.']);
    exit;
}

// Check if expired
$now = new DateTime();
$expiry = new DateTime($record['expires_at']);
if ($now > $expiry) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'OTP has expired. Please request a new one.']);
    exit;
}

// OTP is valid! Generate a secure reset_token
try {
    $resetToken = bin2hex(random_bytes(32)); // 64 chars
} catch (Exception $e) {
    $resetToken = bin2hex(openssl_random_pseudo_bytes(32));
}

// Save reset_token to the same record
$updateStmt = $pdo->prepare("UPDATE password_resets SET reset_token = :token WHERE id = :id");
$updateStmt->execute([
    ':token' => $resetToken,
    ':id'    => $record['id']
]);

http_response_code(200);
echo json_encode([
    'success'     => true,
    'message'     => 'OTP verified successfully.',
    'reset_token' => $resetToken
]);
?>
