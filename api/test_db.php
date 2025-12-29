<?php
require_once 'db.php';

header('Content-Type: application/json');

try {
    // Veritabanındaki tablo sayısını kontrol edelim
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        "status" => "success",
        "message" => "Veritabanına bağlandım!",
        "found_tables" => $tables
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>