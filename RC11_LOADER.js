(function () {
  'use strict';
  function load(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  load('/CONVERSION_LAYER_CONFIG.js')
    .then(function () { return load('/RC11_RUNTIME.js'); })
    .catch(function (err) {
      try { window.dispatchEvent(new CustomEvent('cti:rc11-loader-error', { detail: { message: String(err && err.message || err) } })); } catch (_) {}
    });
})();
