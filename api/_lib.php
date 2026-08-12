<?php
declare(strict_types=1);

const CTI_API_VERSION = '2026-08-13';
const CTI_MAX_BODY_BYTES = 32768;

function cti_json(int $status, array $payload): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function cti_request_id(): string {
    $candidate = trim((string)($_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? ''));
    if ($candidate !== '' && preg_match('/^[A-Za-z0-9:_\-.]{8,160}$/', $candidate)) return $candidate;
    return 'cti:' . bin2hex(random_bytes(16));
}

function cti_require_post(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        cti_json(405, ['ok'=>false,'error'=>'method_not_allowed','apiVersion'=>CTI_API_VERSION]);
    }
}

function cti_read_json(): array {
    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > CTI_MAX_BODY_BYTES) cti_json(413, ['ok'=>false,'error'=>'payload_too_large']);
    $ctype = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
    if (!str_starts_with($ctype, 'application/json')) cti_json(415, ['ok'=>false,'error'=>'content_type_must_be_application_json']);
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > CTI_MAX_BODY_BYTES) cti_json(413, ['ok'=>false,'error'=>'payload_too_large']);
    try { $data = json_decode($raw, true, 64, JSON_THROW_ON_ERROR); }
    catch (Throwable $e) { cti_json(400, ['ok'=>false,'error'=>'invalid_json']); }
    if (!is_array($data)) cti_json(400, ['ok'=>false,'error'=>'json_object_required']);
    return $data;
}

function cti_runtime_dir(): string {
    $configured = trim((string)getenv('CTI_RUNTIME_DIR'));
    $dir = $configured !== '' ? $configured : dirname(__DIR__) . '/.cti_runtime';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
        cti_json(503, ['ok'=>false,'error'=>'runtime_storage_unavailable']);
    }
    return $dir;
}

function cti_hash_ip(): string {
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $salt = (string)(getenv('CTI_IP_HASH_SALT') ?: 'cti-staging');
    return hash_hmac('sha256', $ip, $salt);
}

function cti_rate_limit(string $bucket, int $limit = 20, int $window = 60): void {
    $dir = cti_runtime_dir() . '/rate'; if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $key = hash('sha256', $bucket . ':' . cti_hash_ip());
    $path = $dir . '/' . $key . '.json';
    $now = time(); $state = ['start'=>$now,'count'=>0];
    $fh = fopen($path, 'c+'); if (!$fh) cti_json(503, ['ok'=>false,'error'=>'rate_limit_storage_unavailable']);
    flock($fh, LOCK_EX);
    $existing = stream_get_contents($fh); if ($existing) { $decoded = json_decode($existing, true); if (is_array($decoded)) $state = $decoded; }
    if (($now - (int)$state['start']) >= $window) $state = ['start'=>$now,'count'=>0];
    $state['count'] = (int)$state['count'] + 1;
    ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($state)); fflush($fh); flock($fh, LOCK_UN); fclose($fh);
    if ($state['count'] > $limit) { header('Retry-After: ' . max(1, $window - ($now - (int)$state['start']))); cti_json(429, ['ok'=>false,'error'=>'rate_limited']); }
}

function cti_clean_scalar(mixed $value, int $max = 500): ?string {
    if ($value === null) return null;
    if (!is_scalar($value)) return null;
    $s = trim((string)$value); if ($s === '') return null;
    return mb_substr($s, 0, $max);
}

function cti_bool(mixed $value): bool { return $value === true || $value === 1 || $value === '1' || $value === 'true'; }

function cti_audit(string $stream, array $record): void {
    $dir = cti_runtime_dir() . '/audit'; if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $record['serverTs'] = gmdate('c'); $record['ipHash'] = cti_hash_ip();
    @file_put_contents($dir . '/' . preg_replace('/[^a-z0-9_-]/i','_', $stream) . '.jsonl', json_encode($record, JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
}

function cti_idempotency_read(string $requestId): ?array {
    $dir = cti_runtime_dir() . '/idempotency'; if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $path = $dir . '/' . hash('sha256', $requestId) . '.json';
    if (!is_file($path)) return null;
    $decoded = json_decode((string)file_get_contents($path), true);
    return is_array($decoded) ? $decoded : null;
}

function cti_idempotency_write(string $requestId, array $response): void {
    $dir = cti_runtime_dir() . '/idempotency'; if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $path = $dir . '/' . hash('sha256', $requestId) . '.json';
    file_put_contents($path, json_encode($response, JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function cti_http_json(string $url, array $payload, array $headers = []): array {
    if (!function_exists('curl_init')) throw new RuntimeException('curl_unavailable');
    $ch = curl_init($url);
    $headerList = array_merge(['Content-Type: application/json','Accept: application/json'], $headers);
    curl_setopt_array($ch, [CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>12,CURLOPT_HTTPHEADER=>$headerList,CURLOPT_POSTFIELDS=>json_encode($payload, JSON_UNESCAPED_SLASHES)]);
    $body = curl_exec($ch); $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $error = curl_error($ch); curl_close($ch);
    if ($body === false || $error !== '') throw new RuntimeException('upstream_transport_error');
    $decoded = json_decode((string)$body, true);
    return ['status'=>$status,'body'=>is_array($decoded)?$decoded:['raw'=>(string)$body]];
}

function cti_suitecrm_create_lead(array $lead): array {
    $base = rtrim(trim((string)getenv('CTI_CRM_URL')), '/');
    $user = trim((string)getenv('CTI_CRM_USER')); $password = (string)getenv('CTI_CRM_PASSWORD');
    if ($base === '' || $user === '' || $password === '') return ['ok'=>false,'error'=>'crm_not_configured'];
    if (!str_starts_with(strtolower($base), 'https://')) return ['ok'=>false,'error'=>'crm_https_required'];
    $endpoint = $base . '/service/v4_1/rest.php';
    $loginParams = ['user_auth'=>['user_name'=>$user,'password'=>md5($password),'version'=>'1'],'application_name'=>'CTI Website'];
    $login = cti_http_json($endpoint, ['method'=>'login','input_type'=>'JSON','response_type'=>'JSON','rest_data'=>json_encode($loginParams)]);
    $session = $login['body']['id'] ?? null;
    if ($login['status'] >= 400 || !$session) return ['ok'=>false,'error'=>'crm_login_failed','status'=>$login['status']];
    $name = trim((string)($lead['identity']['name'] ?? 'Website Lead')); $parts = preg_split('/\s+/', $name, 2);
    $values = [
        ['name'=>'first_name','value'=>$parts[0] ?? 'Website'],
        ['name'=>'last_name','value'=>$parts[1] ?? 'Lead'],
        ['name'=>'email1','value'=>$lead['identity']['email']],
        ['name'=>'account_name','value'=>$lead['identity']['company']],
        ['name'=>'title','value'=>$lead['identity']['role']],
        ['name'=>'lead_source','value'=>'Web Site'],
        ['name'=>'status','value'=>'New'],
        ['name'=>'description','value'=>json_encode(['ctiRequestId'=>$lead['requestId'],'qualificationState'=>$lead['qualificationState'],'intent'=>$lead['intent'],'attribution'=>$lead['attribution'],'permission'=>$lead['permission']], JSON_UNESCAPED_SLASHES)]
    ];
    $params = ['session'=>$session,'module_name'=>'Leads','name_value_list'=>$values];
    $created = cti_http_json($endpoint, ['method'=>'set_entry','input_type'=>'JSON','response_type'=>'JSON','rest_data'=>json_encode($params)]);
    $id = $created['body']['id'] ?? null;
    if ($created['status'] >= 400 || !$id) return ['ok'=>false,'error'=>'crm_create_failed','status'=>$created['status']];
    return ['ok'=>true,'crmRecordId'=>(string)$id,'crmModule'=>'Leads'];
}
