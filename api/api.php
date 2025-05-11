<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

$config = require __DIR__ . '/config.php';

// tasks.php
$pdo = new PDO("mysql:host={$config['host']};dbname={$config['database']};charset=utf8", $config['user'],$config['password']);

$assignee = $_GET['assignee'];
$month = $_GET['month'];
$startDate = $month . '-01';
$endDate = date('Y-m-d', strtotime($startDate . ' +1 month'));

$stmt = $pdo->prepare("SELECT * FROM tasks WHERE assignee_id = ? AND start_date >= ? AND start_date < ? ORDER BY task_name ASC");
$stmt->execute([$assignee, $startDate, $endDate]);

header('Content-Type: application/json');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

