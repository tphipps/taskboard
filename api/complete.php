<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// Disable saving for testing
// die(json_encode(['status' => 'ok']));

$config = require __DIR__ . '/config.php';

// complete.php
$pdo = new PDO("mysql:host={$config['host']};dbname={$config['database']};charset=utf8", $config['user'],$config['password']);

$data = json_decode(file_get_contents('php://input'), true);

$taskId = $data['taskId'];
$completionDate = $data['completionDate']; // ISO 8601 or null

$stmt = $pdo->prepare("UPDATE tasks SET completion_date = :completionDate WHERE id = :id");
$stmt->execute([
  ':completionDate' => $completionDate,
  ':id' => $taskId
]);

echo json_encode(['status' => 'ok']);

