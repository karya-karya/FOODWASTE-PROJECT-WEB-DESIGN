<?php
require_once 'db.php';
session_start();
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($action === 'create' && isset($_SESSION['user_id'])) {
    try {
        // Sütun isimleri: donor_id, name, quantity, type, location, expiration_date, price, status
        // Değerler (Values): 8 adet soru işareti olmalı
        $stmt = $pdo->prepare("INSERT INTO listings (donor_id, name, quantity, type, location, expiration_date, price, status) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt->execute([
            $_SESSION['user_id'],
            $data['name'],
            $data['quantity'],
            'food', // type varsayılan olarak food
            $data['location'],
            $data['expiration_date'],
            $data['price'],
            'active' // status varsayılan olarak active
        ]);
        
        echo json_encode(["status" => "success", "message" => "Item listed successfully!"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "DB Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Unauthorized or invalid action."]);
}
?>