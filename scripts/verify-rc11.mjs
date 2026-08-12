import { readFile } from 'node:fs/promises';

const pages = [
  'index.html','services.html','pricing.html','blog.html','research.html',
  'case-studies.html','vendors.html','intelligence.html','contact.html'
];
for (const page of pages) {
  const text = await readFile(`dist/${page}`, 'utf8');
  if (!text.includes('/RC11_LOADER.js')) throw new Error(`dist/${page} missing RC11 loader`);
}

const required = [
  ['dist/RC11_LOADER.js', '/RC11_RUNTIME.js'],
  ['dist/RC11_RUNTIME.js', 'cti.website_lead.v1'],
  ['dist/RC11_RUNTIME.js', 'browserAdvisoryOnly'],
  ['dist/CONVERSION_LAYER_CONFIG.js', 'qualificationAuthority: "server"'],
  ['dist/CONVERSION_LAYER_CONFIG.js', 'identityAndPermissionAreSeparate: true']
];
for (const [file, needle] of required) {
  const text = await readFile(file, 'utf8');
  if (!text.includes(needle)) throw new Error(`${file} missing required marker: ${needle}`);
}

const graph = JSON.parse(await readFile('dist/data/evidence-graph.json', 'utf8'));
if (graph.schema !== 'cti.evidence_graph.v1') throw new Error('Evidence graph schema mismatch');
if (!graph.policy?.factRequiresEvidence || graph.policy?.expiredEvidenceMaySupportLiveClaim !== false) throw new Error('Evidence governance policy invalid');
if (!graph.nodes?.some(n => n.id === 'evidence:linkedin' && n.status === 'verified')) throw new Error('Verified LinkedIn evidence missing');
console.log(`RC11 static evidence checks PASS for ${pages.length} pages.`);
