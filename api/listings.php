<?php
require_once 'db.php';
session_start();
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Not authenticated"]);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$role = $_SESSION['role'] ?? 'receiver';

/* =======================
   1) GET LISTINGS
======================= */
if ($method === 'GET') {
    try {
        if ($role === 'donor') {
            // Donor: Only own listings
            $stmt = $pdo->prepare("SELECT * FROM listings WHERE donor_id = ? ORDER BY created_at DESC");
            $stmt->execute([$userId]);
        } else {
            // Receiver market: only active and in stock
            $stmt = $pdo->prepare("SELECT * FROM listings WHERE status='active' AND quantity > 0 ORDER BY created_at DESC");
            $stmt->execute();
        }
        echo json_encode(["status" => "success", "listings" => $stmt->fetchAll()]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

/* =======================
   2) CREATE LISTING (DONOR) + IMAGE
   NOTE: FormData => $_POST, $_FILES
======================= */
if ($method === 'POST' && $action === 'create') {

    if ($role !== 'donor') {
        echo json_encode(["status" => "error", "message" => "Only donors can create listings."]);
        exit;
    }

    $name = trim($_POST['name'] ?? '');
    $quantity = (int)($_POST['quantity'] ?? 0);
    $location = trim($_POST['location'] ?? '');
    $expiration_date = $_POST['expiration_date'] ?? null;
    $price = (float)($_POST['price'] ?? 0);

    if ($name === '' || $quantity <= 0) {
        echo json_encode(["status" => "error", "message" => "Item name and quantity are required."]);
        exit;
    }

    // Default image
    $imagePath = 'default_food.jpeg';

    // Upload if exists
    if (!empty($_FILES['image']['name'])) {
        $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg','jpeg','png','webp'];

        if (!in_array($ext, $allowed, true)) {
            echo json_encode(["status" => "error", "message" => "Only JPG/JPEG/PNG/WEBP images allowed."]);
            exit;
        }

        $fileName = uniqid("img_", true) . "." . $ext;
        $target = __DIR__ . "/../uploads/" . $fileName;

        if (!move_uploaded_file($_FILES['image']['tmp_name'], $target)) {
            echo json_encode(["status" => "error", "message" => "Image upload failed."]);
            exit;
        }

        $imagePath = $fileName;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO listings (donor_id, name, quantity, type, location, expiration_date, price, status, image_path)
            VALUES (?, ?, ?, 'food', ?, ?, ?, 'active', ?)
        ");
        $stmt->execute([$userId, $name, $quantity, $location, $expiration_date, $price, $imagePath]);

        echo json_encode(["status" => "success", "message" => "Item listed successfully!"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

echo json_encode(["status" => "error", "message" => "Invalid request"]);
