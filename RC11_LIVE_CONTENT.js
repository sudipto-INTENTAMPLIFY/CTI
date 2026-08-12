(function () {
  'use strict';
  var PATH = '/data/live-content.json';

  function track(name, data) {
    if (window.CTI_RC11 && window.CTI_RC11.track) window.CTI_RC11.track(name, data || {});
  }

  function ageHours(ts) { return (Date.now() - Date.parse(ts)) / 3600000; }

  function safeLink(a) {
    try {
      var u = new URL(a.href, location.origin);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch (_) { return false; }
  }

  function render(root, data) {
    root.textContent = '';
    var heading = document.createElement('h2');
    heading.textContent = root.getAttribute('data-live-heading') || 'Live Events & Campaign Programs';
    root.appendChild(heading);

    var meta = document.createElement('p');
    meta.textContent = 'Synchronized from CyberTech Intelligence production content. Last refresh: ' + new Date(data.generatedAt).toLocaleString() + '.';
    root.appendChild(meta);

    data.sources.forEach(function (source) {
      var section = document.createElement('section');
      var h = document.createElement('h3');
      h.textContent = source.title || source.id;
      section.appendChild(h);
      var list = document.createElement('ul');
      (source.links || []).filter(safeLink).slice(0, 12).forEach(function (item) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label;
        a.rel = 'noopener noreferrer';
        a.setAttribute('data-live-content-source', source.canonicalUrl);
        a.addEventListener('click', function () { track('live_campaign_click', { source: source.id, destination: item.href }); });
        li.appendChild(a); list.appendChild(li);
      });
      section.appendChild(list);
      root.appendChild(section);
    });
  }

  function load() {
    var roots = document.querySelectorAll('[data-cti-live-content]');
    if (!roots.length) return;
    fetch(PATH, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('live_content_http_' + r.status); return r.json(); })
      .then(function (data) {
        if (data.schema !== 'cti.live_content.v1') throw new Error('live_content_schema');
        if (ageHours(data.generatedAt) > Number((data.policy && data.policy.staleAfterHours) || 36)) throw new Error('live_content_stale');
        if ((data.sources || []).some(function (s) { return s.status !== 'healthy'; })) throw new Error('live_content_degraded');
        roots.forEach(function (root) { render(root, data); });
        track('live_content_loaded', { sources: data.sources.length, generatedAt: data.generatedAt });
      })
      .catch(function (err) {
        roots.forEach(function (root) { root.setAttribute('data-live-content-status', 'unavailable'); });
        track('live_content_unavailable', { error: String(err && err.message || err) });
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
