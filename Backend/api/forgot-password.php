<?php
/**
 * Forgot Password API Endpoint (Step 1)
 * Method: POST
 * URL: /Backend/api/forgot-password.php
 *
 * Request Body: { "email": "john@example.com" }
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/resend.php';

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

if (empty($email)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Email address is required.']);
    exit;
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

$pdo = getDBConnection();

// Check if email exists in users table
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);

// We ALWAYS return success even if email is not found to prevent email enumeration attacks
$successResponse = [
    'success' => true,
    'message' => 'If this email is registered, an OTP has been sent.'
];

if ($stmt->rowCount() === 0) {
    echo json_encode($successResponse);
    exit;
}

// Email exists, proceed to generate OTP
// Delete old OTPs for this email to prevent spam
$delStmt = $pdo->prepare("DELETE FROM password_resets WHERE email = :email");
$delStmt->execute([':email' => $email]);

// Generate 6-digit OTP
try {
    $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
} catch (Exception $e) {
    // Fallback if random_int fails
    $otp = str_pad((string)rand(0, 999999), 6, '0', STR_PAD_LEFT);
}

// Valid for 10 minutes
$expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

// Save OTP to DB
$insertStmt = $pdo->prepare("INSERT INTO password_resets (email, otp, expires_at) VALUES (:email, :otp, :expires_at)");
$insertStmt->execute([
    ':email'      => $email,
    ':otp'        => $otp,
    ':expires_at' => $expiresAt
]);

// Prepare Email HTML
$htmlBody = '
<div style="font-family:sans-serif; max-width:480px; margin:auto; background:#0a0e1a; color:#f1f5f9; padding:32px; border-radius:16px;">
  <h2 style="color:#6366f1;">🔐 Password Reset OTP</h2>
  <p>Your one-time password to reset your AuthSystem password:</p>
  <div style="font-size:40px; font-weight:bold; letter-spacing:12px; background:#1e1b4b; padding:24px; text-align:center; border-radius:12px; color:#a5b4fc; margin:20px 0;">
    ' . $otp . '
  </div>
  <p>⏱️ This OTP is valid for <strong>10 minutes</strong>.</p>
  <p style="color:#94a3b8; font-size:12px;">If you did not request this, please ignore this email.</p>
</div>';

// Send Email via Resend
// Note: In development, if RESEND_API_KEY is not set, we'll just log success to not break the flow
if (getenv('RESEND_API_KEY') && getenv('RESEND_API_KEY') !== 're_YOUR_API_KEY_HERE') {
    sendEmail($email, "Your Password Reset OTP - AuthSystem", $htmlBody);
}

http_response_code(200);
echo json_encode($successResponse);
?>
