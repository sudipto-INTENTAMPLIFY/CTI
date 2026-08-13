<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
cti_require_post();
cti_rate_limit('signals', 60, 60);
$data = cti_read_json();
$event = cti_clean_scalar($data['event'] ?? $data['name'] ?? null, 100);
if (!$event || !preg_match('/^[a-zA-Z0-9_.:-]{2,100}$/', $event)) cti_json(422, ['ok'=>false,'error'=>'invalid_event']);
$consent = is_array($data['consent'] ?? null) ? $data['consent'] : [];
$analyticsAllowed = cti_bool($consent['analytics'] ?? $data['analyticsConsent'] ?? false);
if (!$analyticsAllowed) cti_json(202, ['ok'=>true,'recorded'=>false,'reason'=>'analytics_consent_absent']);
$props = is_array($data['properties'] ?? null) ? $data['properties'] : [];
$allowed = []; foreach (['page','path','cta','form','intentType','utm_source','utm_medium','utm_campaign'] as $k) { $v = cti_clean_scalar($props[$k] ?? null, 500); if ($v !== null) $allowed[$k] = $v; }
cti_audit('signals', ['event'=>$event,'properties'=>$allowed]);
cti_json(202, ['ok'=>true,'recorded'=>true]);
