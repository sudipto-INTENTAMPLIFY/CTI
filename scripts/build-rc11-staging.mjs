import { mkdir, copyFile, readFile, writeFile, access } from 'node:fs/promises';
const pages=['index.html','services.html','pricing.html','blog.html','research.html','case-studies.html','vendors.html','intelligence.html','contact.html'];
const scripts=['RC11_LOADER.js','RC11_LIVE_CONTENT.js','CTI_DYNAMIC_CMS.js'];
await mkdir('dist/data',{recursive:true});await mkdir('dist/api',{recursive:true});
for(const page of pages){let html=await readFile(page,'utf8');if(!html.includes('</body>'))throw Error(`${page} has no closing body tag`);for(const src of scripts){const marker=`<script src="/${src}" defer></script>`;if(!html.includes(marker))html=html.replace('</body>',`  ${marker}\n</body>`)}await writeFile(`dist/${page}`,html)}
for(const f of ['RC11_LOADER.js','RC11_RUNTIME.js','RC11_LIVE_CONTENT.js','CTI_DYNAMIC_CMS.js','CTI_ADMIN.js','CONVERSION_LAYER_CONFIG.js','.htaccess','admin.html'])await copyFile(f,`dist/${f}`);
await copyFile('data/evidence-graph.json','dist/data/evidence-graph.json');
for(const file of ['_lib.php','website-leads.php','signals.php','content.php','vendors.php','.htaccess'])await copyFile(`api/${file}`,`dist/api/${file}`);
try{await copyFile('data/live-content.json','dist/data/live-content.json')}catch(_){console.warn('live-content snapshot absent; sync workflow must run before final staging evidence')}
for(const required of ['dist/admin.html','dist/CTI_ADMIN.js','dist/api/content.php','dist/api/vendors.php','dist/api/website-leads.php','dist/.htaccess','dist/api/.htaccess'])await access(required);
console.log(`RC11 staging artifact built: ${pages.length} pages + governed CMS admin/API + runtime/evidence assets.`);
