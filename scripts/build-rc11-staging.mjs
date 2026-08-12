import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';

const pages = [
  'index.html','services.html','pricing.html','blog.html','research.html',
  'case-studies.html','vendors.html','intelligence.html','contact.html'
];
const marker = '<script src="/RC11_LOADER.js" defer></script>';

await mkdir('dist/data', { recursive: true });
for (const page of pages) {
  const source = await readFile(page, 'utf8');
  if (!source.includes('</body>')) throw new Error(`${page} has no closing body tag`);
  const html = source.includes(marker) ? source : source.replace('</body>', `  ${marker}\n</body>`);
  await writeFile(`dist/${page}`, html);
}

await copyFile('RC11_LOADER.js', 'dist/RC11_LOADER.js');
await copyFile('RC11_RUNTIME.js', 'dist/RC11_RUNTIME.js');
await copyFile('CONVERSION_LAYER_CONFIG.js', 'dist/CONVERSION_LAYER_CONFIG.js');
await copyFile('data/evidence-graph.json', 'dist/data/evidence-graph.json');

console.log(`RC11 staging artifact built: ${pages.length} HTML pages + runtime/evidence assets.`);
