(function () {
  'use strict';

  var VERSION = 'RC11.1';
  var RELEASE = 'RC9-HARDENED';
  var config = window.CTI_CONVERSION || {};
  var evidenceGraph = null;
  var SIGNAL_PARAM_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','msclkid','fbclid','li_fat_id'];

  function safeJson(value) { try { return JSON.stringify(value); } catch (_) { return '{}'; } }
  function now() { return new Date().toISOString(); }
  function uid(prefix) {
    try { if (crypto && crypto.randomUUID) return (prefix || 'cti') + ':' + crypto.randomUUID(); } catch (_) {}
    return (prefix || 'cti') + ':' + Date.now() + ':' + Math.random().toString(36).slice(2);
  }
  function storageGet(store, key) { try { var raw = store.getItem(key); return raw ? JSON.parse(raw) : null; } catch (_) { return null; } }
  function storageSet(store, key, value) { try { store.setItem(key, safeJson(value)); } catch (_) {} }

  function readAttributionFromUrl() {
    var p = new URLSearchParams(location.search || '');
    var out = {};
    SIGNAL_PARAM_KEYS.forEach(function (key) { var v = p.get(key); if (v) out[key] = v; });
    return out;
  }

  function captureAttribution() {
    var current = {
      capturedAt: now(),
      landingUrl: location.href,
      landingPath: location.pathname + location.search,
      referrer: document.referrer || null,
      params: readAttributionFromUrl()
    };
    var first = storageGet(localStorage, 'cti:first_touch');
    if (!first) { storageSet(localStorage, 'cti:first_touch', current); first = current; }
    storageSet(sessionStorage, 'cti:latest_touch', current);
    return { firstTouch: first, latestTouch: current };
  }

  function attribution() {
    return {
      firstTouch: storageGet(localStorage, 'cti:first_touch'),
      latestTouch: storageGet(sessionStorage, 'cti:latest_touch') || captureAttribution().latestTouch
    };
  }

  function sendSignal(body) {
    var path = config.signalPath || '/api/signals';
    try {
      fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CTI-RC': VERSION, 'X-CTI-Release': RELEASE },
        credentials: 'same-origin',
        keepalive: true,
        body: safeJson(body)
      }).catch(function () {});
    } catch (_) {}
  }

  function track(eventName, payload) {
    var body = Object.assign({
      event: eventName,
      eventId: uid('evt'),
      rc: VERSION,
      release: RELEASE,
      ts: now(),
      path: location.pathname,
      attribution: attribution()
    }, payload || {});
    try {
      if (window.dataLayer && Array.isArray(window.dataLayer)) window.dataLayer.push(body);
      window.dispatchEvent(new CustomEvent('cti:signal', { detail: body }));
    } catch (_) {}
    if (!/^evidence_graph_/.test(eventName) && eventName !== 'rc11_runtime_ready') sendSignal(body);
    return body;
  }

  function loadEvidenceGraph() {
    return fetch(config.evidenceGraphPath || '/data/evidence-graph.json', { credentials: 'same-origin', cache: 'no-store' })
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
    if (input.email) score += 15;
    if (input.company) score += 15;
    if (input.role) score += 15;
    if (input.targetMarket) score += 10;
    if (input.objective || input.need) score += 15;
    if (input.accountVolume) score += 10;
    if (input.challenge) score += 10;
    if (input.timeline) score += 10;
    return {
      score: score,
      browserAdvisoryOnly: true,
      threshold: Number(config.qualificationThreshold || 70),
      qualifiedAdvisory: score >= Number(config.qualificationThreshold || 70),
      authoritativeQualification: 'SERVER_REQUIRED'
    };
  }

  function postLead(payload) {
    var path = config.crmPath || '/api/website-leads';
    var requestId = payload.requestId || uid('lead');
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;
    track('crm_handoff_attempt', { requestId: requestId });
    return fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CTI-RC': VERSION,
        'X-CTI-Release': RELEASE,
        'Idempotency-Key': requestId
      },
      credentials: 'same-origin',
      signal: controller ? controller.signal : undefined,
      body: safeJson(Object.assign({}, payload, { requestId: requestId }))
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      return r.text().then(function (text) {
        var result = { ok: r.ok, status: r.status, body: text, requestId: requestId };
        track(r.ok ? 'crm_handoff_success' : 'crm_handoff_failure', { requestId: requestId, status: r.status });
        return result;
      });
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      track('crm_handoff_failure', { requestId: requestId, error: String(err && err.message || err) });
      throw err;
    });
  }

  function submitLead(input) {
    input = input || {};
    var advisory = qualify(input);
    var requestId = uid('lead');
    var payload = {
      schema: 'cti.website_lead.v2',
      requestId: requestId,
      source: input.source || 'website',
      capturedAt: now(),
      identity: {
        email: input.email || null,
        company: input.company || null,
        role: input.role || null,
        verified: false,
        verificationSource: null
      },
      permission: {
        privacyAccepted: input.privacyAccepted === true,
        marketingConsent: input.marketingConsent === true || input.consent === true,
        capturedAt: now()
      },
      intent: {
        targetMarket: input.targetMarket || null,
        objective: input.objective || input.need || null,
        accountVolume: input.accountVolume || null,
        challenge: input.challenge || null,
        timeline: input.timeline || null,
        budgetRange: input.budgetRange || null,
        currentStack: input.currentStack || null
      },
      advisoryQualification: advisory,
      qualificationState: 'WEBSITE_INTEREST',
      attribution: attribution(),
      page: { path: location.pathname, url: location.href, referrer: document.referrer || null }
    };
    track('qualification_form_submit', { requestId: requestId, advisoryScore: advisory.score, marketingConsent: payload.permission.marketingConsent });
    return postLead(payload).then(function (result) {
      track(result.ok ? 'qualification_receipt' : 'qualification_error', { requestId: requestId, status: result.status });
      return { result: result, advisory: advisory, qualificationState: 'AWAITING_SERVER_VALIDATION' };
    });
  }

  function installTrustLinks() {
    document.querySelectorAll('a[href*="linkedin.com/company/cybertechintelligence"]').forEach(function (a) {
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('data-evidence-id', 'evidence:linkedin');
      a.addEventListener('click', function () { track('verified_social_click', { network: 'linkedin', evidence: 'evidence:linkedin' }); });
    });
  }

  function installCtaTracking() {
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('a,button') : null;
      if (!el) return;
      var label = String(el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 120);
      if (/build my gtm plan/i.test(label)) track('build_gtm_plan_click', { label: label });
      else if (/talk to a gtm strategist/i.test(label)) track('talk_gtm_strategist_click', { label: label });
      else if (/pricing/i.test(label) || /pricing/i.test(el.getAttribute('href') || '')) track('pricing_engagement', { label: label, href: el.getAttribute('href') || null });
    }, true);
  }

  function installAccessibilityGuardrails() {
    if (!document.getElementById('cti-a11y-guardrails')) {
      var style = document.createElement('style');
      style.id = 'cti-a11y-guardrails';
      style.textContent = ':focus-visible{outline:3px solid currentColor!important;outline-offset:3px!important}.cti-skip-link{position:fixed;left:12px;top:12px;z-index:2147483647;padding:10px 14px;background:#fff;color:#000;transform:translateY(-180%)}.cti-skip-link:focus{transform:none}@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}';
      document.head.appendChild(style);
    }
    var main = document.querySelector('main');
    if (main) {
      if (!main.id) main.id = 'main-content';
      if (!document.querySelector('.cti-skip-link')) {
        var skip = document.createElement('a');
        skip.href = '#' + main.id;
        skip.className = 'cti-skip-link';
        skip.textContent = 'Skip to main content';
        document.body.insertBefore(skip, document.body.firstChild);
      }
    }
    document.querySelectorAll('input,select,textarea,button').forEach(function (el) {
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;
      var id = el.id;
      if (id && document.querySelector('label[for="' + CSS.escape(id) + '"]')) return;
      var label = el.getAttribute('placeholder') || el.getAttribute('name') || el.getAttribute('title');
      if (label) el.setAttribute('aria-label', label);
    });
  }

  function expose() {
    window.CTI_RC11 = {
      version: VERSION,
      release: RELEASE,
      track: track,
      qualify: qualify,
      submitLead: submitLead,
      attribution: attribution,
      loadEvidenceGraph: loadEvidenceGraph,
      evidenceForClaim: evidenceForClaim,
      getEvidenceGraph: function () { return evidenceGraph; }
    };
  }

  captureAttribution();
  expose();
  function boot() {
    installTrustLinks();
    installCtaTracking();
    installAccessibilityGuardrails();
    loadEvidenceGraph();
    track('rc11_runtime_ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
