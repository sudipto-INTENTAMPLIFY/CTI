import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';

const pages = [
  'index.html','services.html','pricing.html','blog.html','research.html',
  'case-studies.html','vendors.html','intelligence.html','contact.html'
];
const marker = '<script src="/RC11_LOADER.js" defer></script>';
const liveMarker = '<script src="/RC11_LIVE_CONTENT.js" defer></script>';
const cmsMarker = '<script src="/CTI_DYNAMIC_CMS.js" defer></script>';

await mkdir('dist/data', { recursive: true });
await mkdir('dist/api', { recursive: true });
for (const page of pages) {
  const source = await readFile(page, 'utf8');
  if (!source.includes('</body>')) throw new Error(`${page} has no closing body tag`);
  let html = source.includes(marker) ? source : source.replace('</body>', `  ${marker}\n</body>`);
  html = html.includes(liveMarker) ? html : html.replace('</body>', `  ${liveMarker}\n</body>`);
  html = html.includes(cmsMarker) ? html : html.replace('</body>', `  ${cmsMarker}\n</body>`);
  await writeFile(`dist/${page}`, html);
}

await copyFile('RC11_LOADER.js', 'dist/RC11_LOADER.js');
await copyFile('RC11_RUNTIME.js', 'dist/RC11_RUNTIME.js');
await copyFile('RC11_LIVE_CONTENT.js', 'dist/RC11_LIVE_CONTENT.js');
await copyFile('CTI_DYNAMIC_CMS.js', 'dist/CTI_DYNAMIC_CMS.js');
await copyFile('CONVERSION_LAYER_CONFIG.js', 'dist/CONVERSION_LAYER_CONFIG.js');
await copyFile('.htaccess', 'dist/.htaccess');
await copyFile('data/evidence-graph.json', 'dist/data/evidence-graph.json');
await copyFile('data/cms-content.json', 'dist/data/cms-content.json');
await copyFile('data/vendors.json', 'dist/data/vendors.json');
for (const file of ['_lib.php','website-leads.php','signals.php','content.php','vendors.php','.htaccess']) await copyFile(`api/${file}`, `dist/api/${file}`);
try { await copyFile('data/live-content.json', 'dist/data/live-content.json'); } catch (_) { console.warn('live-content snapshot absent; sync workflow must run before final staging evidence'); }

console.log(`RC11 staging artifact built: ${pages.length} HTML pages + runtime/evidence/CMS/live-content assets + staging APIs.`);
