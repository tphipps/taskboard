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
$pin = $data['pin'];

$stmt = $pdo->prepare("SELECT id, first_name, last_name, avatar_link FROM users WHERE id  = ? AND pin = ?");
$stmt->execute([$userId, $pin]);
if($users = $stmt->fetchAll(PDO::FETCH_ASSOC))
  echo json_encode($users);
else
  http_response_code(401);
