import { readFile } from 'node:fs/promises';

const required = [
  ['dist/index.html', '/RC11_LOADER.js'],
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
console.log('RC11 static evidence checks PASS');
