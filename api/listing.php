<?php
require_once 'db.php';
session_start();
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);

if ($action === 'create' && isset($_SESSION['user_id'])) {
    // Veritabanı tablonla tam uyumlu sorgu
    $stmt = $pdo->prepare("INSERT INTO listings (donor_id, name, quantity, type, location, expiration_date, price, status) 
                           VALUES (?, ?, ?, 'food', ?, ?, ?, 'active')");
    
    try {
        $stmt->execute([
            $_SESSION['user_id'],
            $data['name'],
            $data['quantity'],
            $data['location'],
            $data['expiration_date'],
            $data['price']
        ]);
        echo json_encode(["status" => "success", "message" => "Item listed successfully!"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
}