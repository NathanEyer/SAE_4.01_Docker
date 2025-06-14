<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$fileName = "../sentences/sentences.txt";

if(!file_exists($fileName)){
    http_response_code(500);
   echo json_encode(["status" => "error", "message" => "Fichier non trouvé"]);
    exit;
}

$lines = file($fileName, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
header('Content-type: application/json');
echo json_encode($lines);

?>