<?php
$host = "localhost";
$db_name = "foodwaste_db";
$username = "root";
$password = ""; // XAMPP varsayılan şifre boştur

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Bağlantı başarılıysa bir şey yazdırmıyoruz (API güvenliği için)
} catch (PDOException $e) {
    die("Veritabanı bağlantı hatası: " . $e->getMessage());
}
?>