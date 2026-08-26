<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Accept');
  http_response_code(204);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
  exit;
}

$name = trim((string)($data['name'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$phone = trim((string)($data['phone'] ?? '')) ?: 'NA';
$city = trim((string)($data['city'] ?? '')) ?: 'NA';
$type = trim((string)($data['buisnessType'] ?? ''));

if ($name === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['status' => 'error', 'message' => 'Name and a valid email are required']);
  exit;
}

$host = getenv('EJ_SMTP_HOST') ?: '';
$user = getenv('EJ_SMTP_USER') ?: '';
$pass = getenv('EJ_SMTP_PASS') ?: '';
$to = getenv('EJ_CONTACT_TO') ?: 'pierre@pierreravan.com';
$from = getenv('EJ_CONTACT_FROM') ?: ($user ?: 'noreply@theeternaljourney.com');

if ($host === '' || $user === '' || $pass === '') {
  echo json_encode([
    'status' => 'success',
    'delivered' => false,
    'message' => 'Thank you for reaching out. We will connect with you at the earliest.',
  ]);
  exit;
}

$subject = 'Email From theeternaljourney.com';
$body = "Business Type: {$type}\nName: {$name}\nEmail: {$email}\nPhone: {$phone}\nCity: {$city}\n";
$headers = "From: Eternal Journey <{$from}>\r\nReply-To: {$email}\r\nContent-Type: text/plain; charset=UTF-8";

$ok = @mail($to, $subject, $body, $headers);
echo json_encode([
  'status' => $ok ? 'success' : 'error',
  'delivered' => (bool)$ok,
  'message' => $ok
    ? 'Thank you for reaching out. We will connect with you at the earliest.'
    : 'Failed to send message. Please try after some time',
]);
