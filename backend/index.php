<?php

$targetDir = __DIR__ . "/recordings/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['audio'])) {
    $fileName = $_POST['fileName'] ?? uniqid() . ".webm";
    $targetFile = $targetDir . basename($fileName);

    if (move_uploaded_file($_FILES['audio']['tmp_name'], $targetFile)) {
        http_response_code(200);
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Upload failed"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid request."]);
}
