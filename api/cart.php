<?php
require_once 'db.php';
session_start();
header('Content-Type: application/json');

$stmt = $pdo->prepare("
    SELECT l.name, c.quantity
    FROM carts c
    JOIN listings l ON l.id = c.listing_id
    WHERE c.receiver_id = ?
");
$stmt->execute([$_SESSION['user_id']]);

echo json_encode($stmt->fetchAll());
