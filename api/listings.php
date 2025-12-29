<?php
require_once 'db.php';
session_start();
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// 1. VERİLERİ LİSTELEME (GET)
if ($method === 'GET' && isset($_SESSION['user_id'])) {
    try {
        if ($_SESSION['role'] === 'donor') {
            // Donor: Kendi eklediği her şeyi görsün (active, reserved, completed)
            $stmt = $pdo->prepare("SELECT * FROM listings WHERE donor_id = ? ORDER BY created_at DESC");
            $stmt->execute([$_SESSION['user_id']]);
        } else {
            // Receiver: Sadece marketteki 'active' (boşta) olanları görsün
            $stmt = $pdo->prepare("SELECT * FROM listings WHERE status = 'active' ORDER BY created_at DESC");
            $stmt->execute();
        }
        $listings = $stmt->fetchAll();
        echo json_encode(["status" => "success", "listings" => $listings]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 2. İŞLEMLER (POST)
if ($method === 'POST' && isset($_SESSION['user_id'])) {
    $data = json_decode(file_get_contents('php://input'), true);

    // A. YENİ İLAN
    if ($action === 'create') {
        try {
            $stmt = $pdo->prepare("INSERT INTO listings (donor_id, name, quantity, type, location, expiration_date, price, status) 
                                   VALUES (?, ?, ?, 'food', ?, ?, ?, 'active')");
            $stmt->execute([
                $_SESSION['user_id'], $data['name'], $data['quantity'], 
                $data['location'], $data['expiration_date'], $data['price']
            ]);
            echo json_encode(["status" => "success", "message" => "Item listed successfully!"]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Create Error"]);
        }
    } 
    // B. TALEP ETME (CLAIM)
    else if ($action === 'claim') {
        try {
            $stmt = $pdo->prepare("UPDATE listings SET status = 'reserved' WHERE id = ? AND status = 'active'");
            $stmt->execute([$data['listing_id']]);
            echo json_encode(["status" => "success", "message" => "Food successfully claimed!"]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Claim failed"]);
        }
    }
    // C. TESLİM ETME (COMPLETE)
    else if ($action === 'complete') {
        try {
            $stmt = $pdo->prepare("UPDATE listings SET status = 'completed' WHERE id = ? AND donor_id = ?");
            $stmt->execute([$data['listing_id'], $_SESSION['user_id']]);
            echo json_encode(["status" => "success", "message" => "Item marked as delivered!"]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Completion failed"]);
        }
    }
    exit;
}
?>