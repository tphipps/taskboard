<?php
// get_users.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

$config = require __DIR__ . '/config.php';
$pdo = new PDO("mysql:host={$config['host']};dbname={$config['database']};charset=utf8", $config['user'],$config['password']);

$data = json_decode(file_get_contents('php://input'), true);

$userId = $data['user_id'];
$currentPin = $data['current_pin'];
$newPin = $data['new_pin'];

$stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND pin = ?");
$stmt->execute([$userId,$currentPin]);
if(!$users = $stmt->fetchAll(PDO::FETCH_ASSOC))
  http_response_code(401);

$stmt = $pdo->prepare("UPDATE users SET pin = ? WHERE id = ?");
$stmt->execute([$newPin, $userId]);

echo json_encode(['status' => 'ok']);
