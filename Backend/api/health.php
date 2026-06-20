<?php
/**
 * Quick API Health-Check Endpoint
 * URL: /Backend/api/health.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';

$dbStatus = 'disconnected';
try {
    $pdo      = getDBConnection();
    $dbStatus = 'connected';
} catch (Exception $e) {
    $dbStatus = 'error: ' . $e->getMessage();
}

echo json_encode([
    'success'   => true,
    'api'       => 'Auth System API',
    'version'   => '1.0.0',
    'status'    => 'running',
    'database'  => $dbStatus,
    'timestamp' => date('Y-m-d H:i:s'),
]);
?>
