<?php
// Simulate POST request to auth.php?action=impersonate_demo
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'impersonate_demo';

// Mock php://input content by overriding getRequestData in functions.php if needed,
// but since functions.php uses file_get_contents("php://input"), we can't easily mock it in pure PHP script without editing,
// except we can write a curl request to our own localhost!
// Yes, let's make a real HTTP request to http://localhost/kiam/api/auth.php?action=impersonate_demo using curl in PHP!

$ch = curl_init("http://localhost/kiam/api/auth.php?action=impersonate_demo");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "sector" => "health",
    "name" => "Clinique la vie"
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Curl error: ' . curl_error($ch);
} else {
    echo $response;
}
curl_close($ch);
?>
