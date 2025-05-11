<?php
// get_users.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$config = require __DIR__ . '/config.php';
$pdo = new PDO("mysql:host={$config['host']};dbname={$config['database']};charset=utf8", $config['user'],$config['password']);


$stmt = $pdo->query("SELECT id, first_name, last_name, avatar_link FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($users);

