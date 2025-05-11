<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

$config = require __DIR__ . '/config.php';
$pdo = new PDO("mysql:host={$config['host']};dbname={$config['database']};charset=utf8", $config['user'],$config['password']);

$data = json_decode(file_get_contents('php://input'), true);

$taskId = $data['taskId'];
$plannedDate = $data['plannedDate']; // format: YYYY-MM-DD

$stmt = $pdo->prepare("UPDATE tasks SET planned_date = :plannedDate WHERE id = :id");
$stmt->execute([
  ':plannedDate' => $plannedDate,
  ':id' => $taskId
]);

echo json_encode(['status' => 'ok']);

