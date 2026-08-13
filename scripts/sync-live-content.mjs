import { mkdir, writeFile } from 'node:fs/promises';

const sources = [
  { id: 'events', type: 'events', url: 'https://cybertechintelligence.com/events' },
  { id: 'webinars', type: 'event-program', url: 'https://cybertechintelligence.com/services/webinar-and-panel' },
  { id: 'roundtables', type: 'event-program', url: 'https://cybertechintelligence.com/services/ciso-roundtables' }
];

function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function absolute(base, href) {
  try { return new URL(href, base).toString(); } catch { return null; }
}

function extractLinks(html, base) {
  const links = [];
  const rx = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = rx.exec(html))) {
    const href = absolute(base, m[1]);
    const label = text(m[2]).slice(0, 180);
    if (!href || !label) continue;
    const looksCommercial = /register|event|webinar|roundtable|know more|schedule|demo|partner|get started|contact/i.test(label + ' ' + href);
    if (looksCommercial) links.push({ label, href });
  }
  return [...new Map(links.map(x => [x.href + '|' + x.label, x])).values()].slice(0, 80);
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? text(m[1]) : null;
}

const output = {
  schema: 'cti.live_content.v1',
  generatedAt: new Date().toISOString(),
  policy: {
    sourceOfTruth: 'public-production-site',
    factsMayNotBeInvented: true,
    preserveCanonicalLinks: true,
    staleAfterHours: 36,
    stagingDoesNotWriteProduction: true
  },
  sources: []
};

for (const source of sources) {
  try {
    const r = await fetch(source.url, { headers: { 'User-Agent': 'CyberTech-Intelligence-RC11-LiveContentSync/1.0' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    output.sources.push({
      ...source,
      status: 'healthy',
      fetchedAt: new Date().toISOString(),
      title: extractTitle(html),
      canonicalUrl: source.url,
      links: extractLinks(html, source.url)
    });
  } catch (error) {
    output.sources.push({ ...source, status: 'degraded', fetchedAt: new Date().toISOString(), canonicalUrl: source.url, error: String(error && error.message || error), links: [] });
  }
}

await mkdir('data', { recursive: true });
await writeFile('data/live-content.json', JSON.stringify(output, null, 2) + '\n');
console.log(`Live-content sync complete: ${output.sources.length} sources`);
for (const s of output.sources) console.log(`${s.id}: ${s.status}, ${s.links.length} routed links`);
