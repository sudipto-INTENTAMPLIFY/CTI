(function () {
  'use strict';

  var VERSION = 'RC11.1';
  var config = window.CTI_CONVERSION || {};
  var evidenceGraph = null;

  function safeJson(value) {
    try { return JSON.stringify(value); } catch (_) { return '{}'; }
  }

  function track(eventName, payload) {
    var body = Object.assign({ event: eventName, rc: VERSION, ts: new Date().toISOString(), path: location.pathname }, payload || {});
    try {
      if (window.dataLayer && Array.isArray(window.dataLayer)) window.dataLayer.push(body);
      window.dispatchEvent(new CustomEvent('cti:signal', { detail: body }));
    } catch (_) {}
    return body;
  }

  function loadEvidenceGraph() {
    return fetch('/data/evidence-graph.json', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('evidence_graph_http_' + r.status); return r.json(); })
      .then(function (graph) { evidenceGraph = graph; track('evidence_graph_loaded', { nodes: (graph.nodes || []).length }); return graph; })
      .catch(function (err) { track('evidence_graph_unavailable', { error: String(err && err.message || err) }); return null; });
  }

  function evidenceForClaim(id) {
    if (!evidenceGraph || !Array.isArray(evidenceGraph.nodes)) return [];
    var claim = evidenceGraph.nodes.find(function (n) { return n.id === id && n.type === 'claim'; });
    if (!claim || !Array.isArray(claim.evidenceIds)) return [];
    return claim.evidenceIds.map(function (eid) { return evidenceGraph.nodes.find(function (n) { return n.id === eid; }); }).filter(Boolean);
  }

  function qualify(input) {
    var score = 0;
    if (input.email) score += 20;
    if (input.company) score += 20;
    if (input.role) score += 15;
    if (input.need) score += 20;
    if (input.timeline) score += 15;
    if (input.consent === true) score += 10;
    return { score: score, browserAdvisoryOnly: true, threshold: Number(config.qualificationThreshold || 70), qualifiedAdvisory: score >= Number(config.qualificationThreshold || 70) };
  }

  function postLead(payload) {
    var path = config.crmPath || '/api/website-leads';
    return fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CTI-RC': VERSION }, credentials: 'same-origin', body: safeJson(payload) })
      .then(function (r) { return r.text().then(function (text) { return { ok: r.ok, status: r.status, body: text }; }); });
  }

  function submitLead(input) {
    var advisory = qualify(input);
    var payload = {
      schema: 'cti.website_lead.v1',
      source: 'rc11-signal-concierge',
      capturedAt: new Date().toISOString(),
      identity: { email: input.email || null, company: input.company || null, role: input.role || null, verified: false },
      permission: { marketingConsent: input.consent === true, capturedAt: new Date().toISOString() },
      intent: { need: input.need || null, timeline: input.timeline || null },
      advisoryQualification: advisory,
      page: { path: location.pathname, referrer: document.referrer || null }
    };
    track('signal_concierge_submit', { advisoryScore: advisory.score, consent: input.consent === true });
    return postLead(payload).then(function (result) {
      track(result.ok ? 'signal_concierge_accepted' : 'signal_concierge_rejected', { status: result.status });
      return { result: result, advisory: advisory };
    });
  }

  function installTrustLinks() {
    document.querySelectorAll('a[href*="linkedin.com/company/cybertechintelligence"]').forEach(function (a) {
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('data-evidence-id', 'evidence:linkedin');
      a.addEventListener('click', function () { track('verified_social_click', { network: 'linkedin', evidence: 'evidence:linkedin' }); });
    });
  }

  function expose() {
    window.CTI_RC11 = {
      version: VERSION,
      track: track,
      qualify: qualify,
      submitLead: submitLead,
      loadEvidenceGraph: loadEvidenceGraph,
      evidenceForClaim: evidenceForClaim,
      getEvidenceGraph: function () { return evidenceGraph; }
    };
  }

  expose();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { installTrustLinks(); loadEvidenceGraph(); track('rc11_runtime_ready'); });
  } else {
    installTrustLinks(); loadEvidenceGraph(); track('rc11_runtime_ready');
  }
})();
