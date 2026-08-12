import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';

const source = await readFile('appHTML.html', 'utf8');
const marker = '<script src="/RC11_LOADER.js" defer></script>';
if (!source.includes('</body>')) throw new Error('appHTML.html has no closing body tag');
const html = source.includes(marker) ? source : source.replace('</body>', `  ${marker}\n</body>`);
await mkdir('dist/data', { recursive: true });
await writeFile('dist/index.html', html);
await copyFile('RC11_LOADER.js', 'dist/RC11_LOADER.js');
await copyFile('RC11_RUNTIME.js', 'dist/RC11_RUNTIME.js');
await copyFile('CONVERSION_LAYER_CONFIG.js', 'dist/CONVERSION_LAYER_CONFIG.js');
await copyFile('data/evidence-graph.json', 'dist/data/evidence-graph.json');
console.log('RC11 staging artifact built with runtime loader.');
