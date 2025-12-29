<?php
require_once 'db.php';
session_start();
header('Content-Type: application/json');

// Hata ayıklama için (Opsiyonel: Geliştirme aşamasında hataları görmeni sağlar)
error_reporting(E_ALL);
ini_set('display_errors', 0);

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);

if ($action === 'register') {
    // SQL şemana göre: full_name ve password_hash
    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)");
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    
    try {
        $stmt->execute([
            $data['name'], 
            $data['email'], 
            $password, 
            $data['role']
        ]);
        echo json_encode(["status" => "success", "message" => "Registration successful!"]);
    } catch (Exception $e) {
        // Hata durumunda (örneğin aynı e-posta tekrarı)
        echo json_encode(["status" => "error", "message" => "Email already registered or database error."]);
    }
}

if ($action === 'login') {
    if (empty($data['email']) || empty($data['password'])) {
        echo json_encode(["status" => "error", "message" => "Please fill all fields."]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch();

    // Şifre doğrulaması
    if ($user && password_verify($data['password'], $user['password_hash'])) {
        // Oturum bilgilerini sakla
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];

        echo json_encode([
            "status" => "success", 
            "user" => [
                "name" => $user['full_name'], 
                "role" => $user['role']
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
    }
}
?>