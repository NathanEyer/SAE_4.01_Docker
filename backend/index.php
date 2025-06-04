<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Créer les dossiers nécessaires
$recordingsDir = __DIR__ . "/recordings/";
$sessionsDir = __DIR__ . "/sessions/";

if (!file_exists($recordingsDir)) {
    mkdir($recordingsDir, 0777, true);
}
if (!file_exists($sessionsDir)) {
    mkdir($sessionsDir, 0777, true);
}

// Route pour récupérer les phrases
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'sentences') {
    $fileName = __DIR__ . "/sentences/sentences.txt";
    
    if (!file_exists($fileName)) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Fichier de phrases non trouvé"]);
        exit;
    }
    
    $lines = file($fileName, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    echo json_encode(["status" => "success", "sentences" => $lines]);
    exit;
}

// Route pour créer une session
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_session') {
    $age = isset($_POST['age']) ? intval($_POST['age']) : null;
    $gender = isset($_POST['gender']) ? $_POST['gender'] : null;
    $consent = isset($_POST['consent']) ? $_POST['consent'] === 'true' : false;
    $sentenceCount = isset($_POST['sentenceCount']) ? intval($_POST['sentenceCount']) : 10;
    
    if (!$age || !$gender || !$consent || $age < 1 || $age > 120) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Données invalides ou consentement manquant"]);
        exit;
    }
    
    if (!in_array($gender, ['homme', 'femme', 'autre'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Genre invalide"]);
        exit;
    }
    
    $sessionId = uniqid('session_', true);
    $sessionData = [
        'id' => $sessionId,
        'age' => $age,
        'gender' => $gender,
        'consent' => $consent,
        'sentenceCount' => $sentenceCount,
        'createdAt' => date('Y-m-d H:i:s'),
        'recordings' => []
    ];
    
    file_put_contents($sessionsDir . $sessionId . '.json', json_encode($sessionData));
    
    echo json_encode(["status" => "success", "sessionId" => $sessionId]);
    exit;
}

// Route pour sauvegarder un enregistrement
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['audio']) && isset($_POST['sessionId'])) {
    $sessionId = $_POST['sessionId'];
    $sentenceIndex = isset($_POST['sentenceIndex']) ? intval($_POST['sentenceIndex']) : 0;
    $sentence = isset($_POST['sentence']) ? $_POST['sentence'] : '';
    
    // Vérifier la session
    $sessionFile = $sessionsDir . $sessionId . '.json';
    if (!file_exists($sessionFile)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Session invalide"]);
        exit;
    }
    
    $sessionData = json_decode(file_get_contents($sessionFile), true);
    
    // Générer le nom de fichier
    $timestamp = date('Y-m-d_H-i-s');
    $fileName = "{$sessionId}_sentence_{$sentenceIndex}_{$timestamp}.webm";
    $targetFile = $recordingsDir . $fileName;
    
    if (move_uploaded_file($_FILES['audio']['tmp_name'], $targetFile)) {
        // Mettre à jour les données de session
        $sessionData['recordings'][] = [
            'fileName' => $fileName,
            'sentenceIndex' => $sentenceIndex,
            'sentence' => $sentence,
            'timestamp' => $timestamp
        ];
        
        file_put_contents($sessionFile, json_encode($sessionData));
        
        echo json_encode([
            "status" => "success", 
            "message" => "Enregistrement sauvegardé",
            "fileName" => $fileName
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Échec de la sauvegarde"]);
    }
    exit;
}

// Route pour finaliser une session
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'finalize_session') {
    $sessionId = $_POST['sessionId'];
    $sessionFile = $sessionsDir . $sessionId . '.json';
    
    if (file_exists($sessionFile)) {
        $sessionData = json_decode(file_get_contents($sessionFile), true);
        $sessionData['finalizedAt'] = date('Y-m-d H:i:s');
        file_put_contents($sessionFile, json_encode($sessionData));
        
        echo json_encode(["status" => "success", "message" => "Session finalisée"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Session non trouvée"]);
    }
    exit;
}

// Route par défaut
http_response_code(400);
echo json_encode(["status" => "error", "message" => "Requête invalide"]);
?>