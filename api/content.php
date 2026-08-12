<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';

const CTI_CONTENT_TYPES = ['blog','research','resource','case-study'];

function cti_content_store(): string {
    $dir = cti_runtime_dir() . '/cms';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) cti_json(503,['ok'=>false,'error'=>'cms_storage_unavailable']);
    $path = $dir . '/content.json';
    if (!is_file($path)) file_put_contents($path, json_encode(['schema'=>'cti.cms.v2','updatedAt'=>gmdate('c'),'items'=>[]], JSON_PRETTY_PRINT), LOCK_EX);
    return $path;
}
function cti_content_load(): array {
    $d=json_decode((string)file_get_contents(cti_content_store()),true);
    return is_array($d)?$d:['schema'=>'cti.cms.v2','updatedAt'=>gmdate('c'),'items'=>[]];
}
function cti_content_auth(): void {
    $expected=trim((string)getenv('CTI_CMS_ADMIN_TOKEN'));
    $auth=trim((string)($_SERVER['HTTP_AUTHORIZATION']??''));
    if($expected===''||!hash_equals('Bearer '.$expected,$auth)) cti_json(401,['ok'=>false,'error'=>'cms_auth_required']);
}
function cti_list(mixed $v,int $max=100): array {
    if(!is_array($v)) return [];
    return array_values(array_filter(array_map(fn($x)=>cti_clean_scalar($x,$max),$v)));
}
function cti_content_normalize(array $item): array {
    $type=cti_clean_scalar($item['type']??null,40);
    if(!$type||!in_array($type,CTI_CONTENT_TYPES,true)) cti_json(422,['ok'=>false,'error'=>'invalid_content_type']);
    $title=cti_clean_scalar($item['title']??null,180); $slug=cti_clean_scalar($item['slug']??null,180);
    if(!$title||!$slug||!preg_match('/^[a-z0-9-]+$/',$slug)) cti_json(422,['ok'=>false,'error'=>'title_and_slug_required']);
    $status=cti_clean_scalar($item['status']??'draft',20);
    if(!in_array($status,['draft','published','archived'],true)) cti_json(422,['ok'=>false,'error'=>'invalid_status']);
    $publishedAt=cti_clean_scalar($item['publishedAt']??null,40);
    if($status==='published'&&!$publishedAt) $publishedAt=gmdate('c');
    return [
      'id'=>cti_clean_scalar($item['id']??null,100)?:'content:'.bin2hex(random_bytes(8)),
      'type'=>$type,'slug'=>$slug,'title'=>$title,'dek'=>cti_clean_scalar($item['dek']??null,700),
      'body'=>cti_clean_scalar($item['body']??null,50000),'status'=>$status,'publishedAt'=>$publishedAt,
      'updatedAt'=>gmdate('c'),'author'=>cti_clean_scalar($item['author']??null,120),
      'category'=>cti_clean_scalar($item['category']??null,120),'topics'=>cti_list($item['topics']??[],80),
      'sourceUrl'=>cti_clean_scalar($item['sourceUrl']??null,500),'heroImage'=>cti_clean_scalar($item['heroImage']??null,500),
      'evidenceIds'=>cti_list($item['evidenceIds']??[],100),'metrics'=>is_array($item['metrics']??null)?$item['metrics']:[],
      'comparison'=>is_array($item['comparison']??null)?$item['comparison']:[],'featured'=>cti_bool($item['featured']??false),
      'seo'=>is_array($item['seo']??null)?['title'=>cti_clean_scalar($item['seo']['title']??null,180),'description'=>cti_clean_scalar($item['seo']['description']??null,320),'canonical'=>cti_clean_scalar($item['seo']['canonical']??null,500)]:[]
    ];
}

$method=$_SERVER['REQUEST_METHOD']??'GET';
if($method==='GET'){
    $admin=($_GET['admin']??'')==='1'; if($admin) cti_content_auth();
    $store=cti_content_load(); $type=cti_clean_scalar($_GET['type']??null,100); $slug=cti_clean_scalar($_GET['slug']??null,180); $status=cti_clean_scalar($_GET['status']??null,20);
    $types=$type?array_values(array_filter(array_map('trim',explode(',',$type)))):[];
    $items=array_values(array_filter($store['items']??[],function($item)use($admin,$types,$slug,$status){
        if(!$admin&&($item['status']??'')!=='published')return false;
        if($admin&&$status&&($item['status']??'')!==$status)return false;
        if($types&&!in_array(($item['type']??''),$types,true))return false;
        if($slug&&($item['slug']??'')!==$slug)return false;
        return true;
    }));
    usort($items,fn($a,$b)=>strcmp((string)($b['publishedAt']??$b['updatedAt']??''),(string)($a['publishedAt']??$a['updatedAt']??'')));
    cti_json(200,['ok'=>true,'schema'=>'cti.cms.v2','updatedAt'=>$store['updatedAt']??null,'count'=>count($items),'items'=>$items]);
}
if(!in_array($method,['POST','PUT'],true)){header('Allow: GET, POST, PUT');cti_json(405,['ok'=>false,'error'=>'method_not_allowed']);}
cti_content_auth(); cti_rate_limit('cms-write',60,60); $input=cti_read_json(); $item=cti_content_normalize($input);
$store=cti_content_load(); $items=$store['items']??[]; $replaced=false;
foreach($items as $i=>$existing){if(($existing['id']??'')===$item['id']||(($existing['type']??'')===$item['type']&&($existing['slug']??'')===$item['slug'])){$item['id']=$existing['id']??$item['id'];$items[$i]=$item;$replaced=true;break;}}
if(!$replaced)$items[]=$item;
$store=['schema'=>'cti.cms.v2','updatedAt'=>gmdate('c'),'items'=>$items];
file_put_contents(cti_content_store(),json_encode($store,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES),LOCK_EX);
cti_audit('cms',['action'=>$replaced?'update':'create','contentId'=>$item['id'],'type'=>$item['type'],'slug'=>$item['slug'],'status'=>$item['status']]);
cti_json($replaced?200:201,['ok'=>true,'item'=>$item]);
