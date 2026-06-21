<?php
// Resend.com Email API Configuration
require_once __DIR__ . '/env.php';

define('RESEND_FROM_EMAIL', 'onboarding@resend.dev'); // Default for free plan 
define('RESEND_FROM_NAME', 'AuthSystem');

/**
 * Send email via Resend.com REST API using PHP cURL
 *
 * @param string $toEmail    Recipient email
 * @param string $subject    Email subject
 * @param string $htmlBody   HTML email body
 * @return bool              true = sent, false = failed
 */
function sendEmail(string $toEmail, string $subject, string $htmlBody): bool
{
    $payload = [
        'from' => RESEND_FROM_NAME . ' <' . RESEND_FROM_EMAIL . '>',
        'to' => [$toEmail],
        'subject' => $subject,
        'html' => $htmlBody,
    ];

    $apiKey = getenv('RESEND_API_KEY') ?: '';

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $httpCode === 200 || $httpCode === 201;
}
?>