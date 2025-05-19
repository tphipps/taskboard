<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

$config = require __DIR__ . '/config.php';

$pdo = new PDO("mysql:host={$config['host']};dbname={$config['database']};charset=utf8", $config['user'],$config['password']);

$mode = $_GET['mode'] ?? 'getTasks';

switch ($mode) {
    case 'getUsers':
      // Eventually, this function will be exempt from session control
      $stmt = $pdo->query("SELECT id, first_name, last_name, avatar_link, role FROM users");
      header('Content-Type: application/json');
      http_response_code(200);
      echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
      break;
    case 'verifyPin':
      $data = json_decode(file_get_contents('php://input'), true);
      $userId = $data['user_id'];
      $pin = $data['pin'];
      $stmt = $pdo->prepare("SELECT id, first_name, last_name, avatar_link, role FROM users WHERE id  = ? AND pin = ?");
      $stmt->execute([$userId, $pin]);
      if($users = $stmt->fetchAll(PDO::FETCH_ASSOC))
        echo json_encode($users[0]);
      else
        http_response_code(401);
      break;
    case 'changePin':
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
      break;
    case 'getTasks':
      $assignee = $_GET['assignee'];
      $month = $_GET['month'];
      $startDate = $month . '-01';
      $endDate = date('Y-m-d', strtotime($startDate . ' +1 month'));
      $stmt = $pdo->prepare("SELECT * FROM tasks WHERE assignee_id = ? AND start_date >= ? AND start_date < ? ORDER BY task_name ASC");
      $stmt->execute([$assignee, $startDate, $endDate]);
      header('Content-Type: application/json');
      http_response_code(200);
      echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
      break;
    case 'getTasksPendingReview':
      $stmt = $pdo->prepare("SELECT tasks.id id, type, task_name, start_date, planned_date, completion_date, assignee_id, reviewer_id, reviewed_date, avatar_link, first_name, last_name FROM tasks, users WHERE tasks.assignee_id = users.id AND completion_date IS NOT NULL AND reviewed_date IS NULL ORDER BY completion_date ASC, task_name ASC");
      $stmt->execute();
      header('Content-Type: application/json');
      http_response_code(200);
      echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
      break;
    case 'planTask':
      $data = json_decode(file_get_contents('php://input'), true);
      $taskId = $data['taskId'];
      $plannedDate = $data['plannedDate']; // ISO 8601 or null
      $stmt = $pdo->prepare("UPDATE tasks SET planned_date = :plannedDate WHERE id = :id");
      $stmt->execute([
        ':plannedDate' => $plannedDate,
        ':id' => $taskId
      ]);
      header('Content-Type: application/json');
      http_response_code(200);
      echo json_encode(['success' => "Task $taskId planned successfully"]);
      break;
    case 'completeTask':
      $data = json_decode(file_get_contents('php://input'), true);
      $taskId = $data['taskId'];
      $completionDate = $data['completionDate']; // ISO 8601 or null
      $stmt = $pdo->prepare("UPDATE tasks SET completion_date = :completionDate WHERE id = :id");
      $stmt->execute([
        ':completionDate' => $completionDate,
        ':id' => $taskId
      ]);
      header('Content-Type: application/json');
      http_response_code(200);
      echo json_encode(['success' => "Task $taskId approved successfully"]);
      break;
    case 'approveTask':
      $data = json_decode(file_get_contents('php://input'), true);
      $taskId = $data['task_id'];
      $reviewerId = $data['reviewer_id'];
      $stmt = $pdo->prepare("UPDATE tasks SET reviewer_id = ?, reviewed_date = NOW() WHERE id = ?");
      $stmt->execute([$reviewerId, $taskId]);
      header('Content-Type: application/json');
      http_response_code(200);
      echo json_encode(['success' => "Task $taskId approved successfully"]);
      break;
    case 'rejectTask':
      $data = json_decode(file_get_contents('php://input'), true);
      $taskId = $data['task_id'];
      $stmt = $pdo->prepare("UPDATE tasks SET completion_date = NULL WHERE id = ?");
      $stmt->execute([$taskId]);
      header('Content-Type: application/json');
      http_response_code(200);
      echo json_encode(['success' => "Task $taskId rejected"]);
      break;
    default:
      http_response_code(400);
      echo json_encode(['error' => 'Invalid mode parameter passed']);
}


