<?php
require_once 'db.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status"=>"error","message"=>"Not authenticated"]);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$role = $_SESSION['role'] ?? 'receiver';
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

$body = json_decode(file_get_contents('php://input'), true) ?? [];

function make_token($len=40) {
    return bin2hex(random_bytes((int)($len/2)));
}

/* ======================================
   RECEIVER: Add to Cart (pending)
   - decreases stock immediately (FR7)
====================================== */
if ($method === 'POST' && $action === 'add_to_cart' && $role === 'receiver') {
    $listingId = (int)($body['listing_id'] ?? 0);
    $qty = (int)($body['quantity'] ?? 0);

    if ($listingId <= 0 || $qty <= 0) {
        echo json_encode(["status"=>"error","message"=>"Invalid item or quantity"]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Lock listing
        $st = $pdo->prepare("SELECT id, quantity, status FROM listings WHERE id=? FOR UPDATE");
        $st->execute([$listingId]);
        $l = $st->fetch(PDO::FETCH_ASSOC);

        if (!$l || $l['status'] !== 'active') {
            $pdo->rollBack();
            echo json_encode(["status"=>"error","message"=>"Item not available"]);
            exit;
        }

        if ((int)$l['quantity'] < $qty) {
            $pdo->rollBack();
            echo json_encode(["status"=>"error","message"=>"Out of stock"]);
            exit;
        }

        // Decrease stock
        $newQty = (int)$l['quantity'] - $qty;
        $newStatus = ($newQty === 0) ? 'depleted' : 'active';

        $up = $pdo->prepare("UPDATE listings SET quantity=?, status=? WHERE id=?");
        $up->execute([$newQty, $newStatus, $listingId]);

        // Create reservation (pending) = cart item
        $ins = $pdo->prepare("
            INSERT INTO reservations (receiver_id, listing_id, reserved_amount, status, qr_code, qr_token)
            VALUES (?, ?, ?, 'pending', NULL, NULL)
        ");
        $ins->execute([$userId, $listingId, $qty]);

        $pdo->commit();
        echo json_encode(["status"=>"success","message"=>"Added to cart"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["status"=>"error","message"=>$e->getMessage()]);
    }
    exit;
}

/* ======================================
   RECEIVER: View Cart (pending + approved)
====================================== */
if ($method === 'GET' && $action === 'cart' && $role === 'receiver') {
    $st = $pdo->prepare("
        SELECT 
            r.id AS reservation_id,
            r.reserved_amount,
            r.status,
            r.qr_code,
            l.id AS listing_id,
            l.name,
            l.location,
            l.price,
            l.image_path
        FROM reservations r
        JOIN listings l ON l.id = r.listing_id
        WHERE r.receiver_id=? AND r.status IN ('pending','approved')
        ORDER BY r.reservation_date DESC
    ");
    $st->execute([$userId]);
    echo json_encode(["status"=>"success","items"=>$st->fetchAll()]);
    exit;
}

/* ======================================
   RECEIVER: Remove from cart (only pending)
   - restore stock
====================================== */
if ($method === 'POST' && $action === 'remove_from_cart' && $role === 'receiver') {
    $reservationId = (int)($body['reservation_id'] ?? 0);

    if ($reservationId <= 0) {
        echo json_encode(["status"=>"error","message"=>"Invalid reservation"]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $st = $pdo->prepare("SELECT * FROM reservations WHERE id=? AND receiver_id=? FOR UPDATE");
        $st->execute([$reservationId, $userId]);
        $r = $st->fetch(PDO::FETCH_ASSOC);

        if (!$r || $r['status'] !== 'pending') {
            $pdo->rollBack();
            echo json_encode(["status"=>"error","message"=>"Only pending items can be removed"]);
            exit;
        }

        $qty = (int)$r['reserved_amount'];
        $listingId = (int)$r['listing_id'];

        // Restore listing stock
        $ls = $pdo->prepare("SELECT quantity FROM listings WHERE id=? FOR UPDATE");
        $ls->execute([$listingId]);
        $l = $ls->fetch(PDO::FETCH_ASSOC);

        if ($l) {
            $newQty = (int)$l['quantity'] + $qty;
            $pdo->prepare("UPDATE listings SET quantity=?, status='active' WHERE id=?")->execute([$newQty, $listingId]);
        }

        // Mark reservation cancelled (history)
        $pdo->prepare("UPDATE reservations SET status='cancelled' WHERE id=?")->execute([$reservationId]);

        $pdo->commit();
        echo json_encode(["status"=>"success","message"=>"Removed from cart"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["status"=>"error","message"=>$e->getMessage()]);
    }
    exit;
}

/* ======================================
   DONOR: List pending requests for my listings
====================================== */
if ($method === 'GET' && $action === 'donor_pending' && $role === 'donor') {
    $st = $pdo->prepare("
        SELECT 
            r.id AS reservation_id,
            r.reserved_amount,
            r.status,
            r.reservation_date,
            l.id AS listing_id,
            l.name
        FROM reservations r
        JOIN listings l ON l.id = r.listing_id
        WHERE l.donor_id=? AND r.status='pending'
        ORDER BY r.reservation_date DESC
    ");
    $st->execute([$userId]);
    echo json_encode(["status"=>"success","items"=>$st->fetchAll()]);
    exit;
}

/* ======================================
   DONOR: Approve => generate QR
====================================== */
if ($method === 'POST' && $action === 'approve' && $role === 'donor') {
    $reservationId = (int)($body['reservation_id'] ?? 0);

    if ($reservationId <= 0) {
        echo json_encode(["status"=>"error","message"=>"Invalid reservation"]);
        exit;
    }

    // Check donor owns listing
    $st = $pdo->prepare("
        SELECT r.id, l.donor_id
        FROM reservations r
        JOIN listings l ON l.id=r.listing_id
        WHERE r.id=?
    ");
    $st->execute([$reservationId]);
    $row = $st->fetch(PDO::FETCH_ASSOC);

    if (!$row || (int)$row['donor_id'] !== $userId) {
        echo json_encode(["status"=>"error","message"=>"Not allowed"]);
        exit;
    }

    $token = make_token(40);
    $qrText = "FW-" . $reservationId . "-" . $token;

    $up = $pdo->prepare("
        UPDATE reservations
        SET status='approved', qr_code=?, qr_token=?
        WHERE id=? AND status='pending'
    ");
    $up->execute([$qrText, $token, $reservationId]);

    echo json_encode(["status"=>"success","message"=>"Approved. QR is ready for receiver."]);
    exit;
}

/* ======================================
   DONOR: Verify QR => delivered
====================================== */
if ($method === 'POST' && $action === 'verify_qr' && $role === 'donor') {
    $qr = trim((string)($body['qr'] ?? ''));

    if ($qr === '') {
        echo json_encode(["status"=>"error","message"=>"QR is required"]);
        exit;
    }

    if (!preg_match('/^FW-(\d+)-([a-f0-9]+)$/', $qr, $m)) {
        echo json_encode(["status"=>"error","message"=>"Invalid QR format"]);
        exit;
    }

    $reservationId = (int)$m[1];
    $token = $m[2];

    $st = $pdo->prepare("
        SELECT r.id, r.status, r.qr_token, l.donor_id
        FROM reservations r
        JOIN listings l ON l.id=r.listing_id
        WHERE r.id=?
    ");
    $st->execute([$reservationId]);
    $row = $st->fetch(PDO::FETCH_ASSOC);

    if (!$row || (int)$row['donor_id'] !== $userId) {
        echo json_encode(["status"=>"error","message"=>"Not allowed"]);
        exit;
    }

    if ($row['status'] !== 'approved') {
        echo json_encode(["status"=>"error","message"=>"Reservation is not approved"]);
        exit;
    }

    if (!hash_equals((string)$row['qr_token'], (string)$token)) {
        echo json_encode(["status"=>"error","message"=>"QR mismatch"]);
        exit;
    }

    $pdo->prepare("UPDATE reservations SET status='delivered' WHERE id=?")->execute([$reservationId]);
    echo json_encode(["status"=>"success","message"=>"Delivery confirmed"]);
    exit;
}

echo json_encode(["status"=>"error","message"=>"Invalid request"]);
