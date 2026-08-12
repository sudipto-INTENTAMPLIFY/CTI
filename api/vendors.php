<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';

function cti_vendor_store(): string {
    $path = dirname(__DIR__) . '/data/vendors.json';
    if (!is_file($path)) file_put_contents($path, json_encode(['schema'=>'cti.vendors.v1','updatedAt'=>gmdate('c'),'vendors'=>[]], JSON_PRETTY_PRINT));
    return $path;
}
function cti_vendor_load(): array { $d=json_decode((string)file_get_contents(cti_vendor_store()),true); return is_array($d)?$d:['schema'=>'cti.vendors.v1','updatedAt'=>gmdate('c'),'vendors'=>[]]; }
function cti_vendor_auth(): void { $e=trim((string)getenv('CTI_CMS_ADMIN_TOKEN')); $a=trim((string)($_SERVER['HTTP_AUTHORIZATION']??'')); if($e===''||$a!=='Bearer '.$e) cti_json(401,['ok'=>false,'error'=>'cms_auth_required']); }
function cti_vendor_normalize(array $v): array {
  $name=cti_clean_scalar($v['name']??null,180); $slug=cti_clean_scalar($v['slug']??null,180); if(!$name||!$slug||!preg_match('/^[a-z0-9-]+$/',$slug)) cti_json(422,['ok'=>false,'error'=>'name_and_slug_required']);
  return ['id'=>cti_clean_scalar($v['id']??null,100)?:'vendor:'.bin2hex(random_bytes(8)),'name'=>$name,'slug'=>$slug,'category'=>cti_clean_scalar($v['category']??null,120),'segment'=>cti_clean_scalar($v['segment']??null,120),'website'=>cti_clean_scalar($v['website']??null,500),'summary'=>cti_clean_scalar($v['summary']??null,1000),'priority'=>cti_bool($v['priority']??false),'buyingTriggers'=>array_values(array_filter(array_map(fn($x)=>cti_clean_scalar($x,120),is_array($v['buyingTriggers']??null)?$v['buyingTriggers']:[]))),'activationPlays'=>array_values(array_filter(array_map(fn($x)=>cti_clean_scalar($x,160),is_array($v['activationPlays']??null)?$v['activationPlays']:[]))),'evidenceIds'=>array_values(array_filter(array_map(fn($x)=>cti_clean_scalar($x,100),is_array($v['evidenceIds']??null)?$v['evidenceIds']:[]))),'status'=>in_array(($v['status']??'published'),['draft','published','archived'],true)?$v['status']:'draft','updatedAt'=>gmdate('c')];
}
$method=$_SERVER['REQUEST_METHOD']??'GET';
if($method==='GET'){
 $s=cti_vendor_load(); $q=strtolower(trim((string)($_GET['q']??''))); $category=trim((string)($_GET['category']??'')); $vendors=array_values(array_filter($s['vendors']??[],function($v)use($q,$category){if(($v['status']??'')!=='published')return false;if($category!==''&&($v['category']??'')!==$category)return false;if($q!==''&&!str_contains(strtolower(json_encode($v)), $q))return false;return true;}));
 $categories=array_values(array_unique(array_filter(array_map(fn($v)=>$v['category']??null,$vendors)))); $priority=count(array_filter($vendors,fn($v)=>!empty($v['priority'])));
 cti_json(200,['ok'=>true,'schema'=>'cti.vendors.v1','updatedAt'=>$s['updatedAt']??null,'stats'=>['tracked'=>count($vendors),'categories'=>count($categories),'priority'=>$priority],'categories'=>$categories,'vendors'=>$vendors]);
}
if(!in_array($method,['POST','PUT'],true)){header('Allow: GET, POST, PUT');cti_json(405,['ok'=>false,'error'=>'method_not_allowed']);}
cti_vendor_auth();cti_rate_limit('vendor-write',30,60);$input=cti_read_json();$vendor=cti_vendor_normalize($input);$s=cti_vendor_load();$vendors=$s['vendors']??[];$replaced=false;
foreach($vendors as $i=>$existing)if(($existing['id']??'')===$vendor['id']||($existing['slug']??'')===$vendor['slug']){$vendors[$i]=$vendor;$replaced=true;break;}if(!$replaced)$vendors[]=$vendor;
$s=['schema'=>'cti.vendors.v1','updatedAt'=>gmdate('c'),'vendors'=>$vendors];file_put_contents(cti_vendor_store(),json_encode($s,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES),LOCK_EX);cti_audit('vendors',['action'=>$replaced?'update':'create','vendorId'=>$vendor['id'],'slug'=>$vendor['slug'],'status'=>$vendor['status']]);cti_json($replaced?200:201,['ok'=>true,'vendor'=>$vendor]);
