<?php
require_once 'db.php';
session_start();
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);

if ($action === 'register') {
    // SQL dosyasındaki 'full_name' ve 'password_hash' alanlarına uygun kayıt 
    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)");
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    
    try {
        $stmt->execute([$data['name'], $data['email'], $password, $data['role']]);
        echo json_encode(["status" => "success", "message" => "Registration successful!"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Email already exists."]);
    }
}

if ($action === 'login') {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch();

    if ($user && password_verify($data['password'], $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        echo json_encode(["status" => "success", "user" => ["name" => $user['full_name'], "role" => $user['role']]]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid credentials."]);
    }
}