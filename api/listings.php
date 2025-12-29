<?php
require_once 'db.php';
session_start();
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// İLANLARI LİSTELEME (Bağışçının kendi ilanları)
if ($method === 'GET' && isset($_SESSION['user_id'])) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM listings WHERE donor_id = ? ORDER BY created_at DESC");
        $stmt->execute([$_SESSION['user_id']]);
        $listings = $stmt->fetchAll();
        echo json_encode(["status" => "success", "listings" => $listings]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// YENİ İLAN EKLEME
if ($method === 'POST' && $action === 'create' && isset($_SESSION['user_id'])) {
    $data = json_decode(file_get_contents('php://input'), true);
    try {
        $stmt = $pdo->prepare("INSERT INTO listings (donor_id, name, quantity, type, location, expiration_date, price, status) 
                               VALUES (?, ?, ?, 'food', ?, ?, ?, 'active')");
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
        echo json_encode(["status" => "error", "message" => "DB Error: " . $e->getMessage()]);
    }
    exit;
}