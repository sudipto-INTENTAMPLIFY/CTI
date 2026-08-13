<?php
declare(strict_types=1);
require __DIR__.'/_lib.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET') cti_json(405,['ok'=>false,'error'=>'method_not_allowed']);
$auth=cti_auth(['editor','admin']);
$role=$auth['role'];
cti_json(200,[
  'ok'=>true,
  'schema'=>'cti.cms.session.v1',
  'role'=>$role,
  'capabilities'=>[
    'read'=>true,
    'create'=>true,
    'update'=>true,
    'publish'=>true,
    'archive'=>$role==='admin',
    'pricingWrite'=>$role==='admin'
  ]
]);