/**
 * Attribution helper: UTMs, Meta cookies (_fbp, _fbc), and event_id generation.
 * Must load BEFORE pixels.js and checkout.js.
 * Exposes window.CampaignAttribution for use by other scripts.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'campaign_attribution';
  var EVENT_ID_KEY = 'fb_purchase_event_id';
  var PURCHASE_FIRED_KEY = 'fb_purchase_fired';
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // --- Capture UTMs from URL (last-touch: overwrite when present) ---
  try {
    var urlParams = new URLSearchParams(window.location.search);
    var hasAny = false;
    var utmData = {};

    for (var i = 0; i < UTM_KEYS.length; i++) {
      var v = urlParams.get(UTM_KEYS[i]);
      if (v) {
        utmData[UTM_KEYS[i]] = v;
        hasAny = true;
      }
    }

    var fbclid = urlParams.get('fbclid');
    if (fbclid) {
      utmData.fbclid = fbclid;
      hasAny = true;
    }
    var gclid = urlParams.get('gclid');
    if (gclid) {
      utmData.gclid = gclid;
      hasAny = true;
    }

    if (hasAny) {
      var existing = {};
      try { existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (_) {}
      for (var k in utmData) {
        if (utmData.hasOwnProperty(k)) existing[k] = utmData[k];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  } catch (_) {}

  // --- Build _fbc from fbclid if the cookie doesn't exist yet ---
  function getMetaCookies() {
    var fbp = getCookie('_fbp');
    var fbc = getCookie('_fbc');
    if (!fbc) {
      try {
        var p = new URLSearchParams(window.location.search);
        var fbcl = p.get('fbclid');
        if (fbcl) {
          fbc = 'fb.1.' + Date.now() + '.' + fbcl;
        }
      } catch (_) {}
    }
    return { fbp: fbp, fbc: fbc };
  }

  // --- Public API ---
  window.CampaignAttribution = {
    getUTMs: function () {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch (_) {
        return {};
      }
    },

    getMetaCookies: getMetaCookies,

    /** Generate a new purchase event_id and persist in sessionStorage. */
    generatePurchaseEventId: function () {
      var id = generateUUID();
      try { sessionStorage.setItem(EVENT_ID_KEY, id); } catch (_) {}
      return id;
    },

    /** Retrieve the stored purchase event_id (for the thank-you page). */
    getPurchaseEventId: function () {
      try { return sessionStorage.getItem(EVENT_ID_KEY) || ''; } catch (_) { return ''; }
    },

    /** Mark that the browser-side Purchase pixel has already fired this session. */
    markPurchaseFired: function () {
      try { sessionStorage.setItem(PURCHASE_FIRED_KEY, '1'); } catch (_) {}
    },

    /** Check if Purchase pixel already fired (prevent double-fire on refresh). */
    hasPurchaseFired: function () {
      try { return sessionStorage.getItem(PURCHASE_FIRED_KEY) === '1'; } catch (_) { return false; }
    },

    /** Clean up session keys after Purchase is done (next checkout starts fresh). */
    clearPurchaseSession: function () {
      try {
        sessionStorage.removeItem(EVENT_ID_KEY);
        sessionStorage.removeItem(PURCHASE_FIRED_KEY);
      } catch (_) {}
    },

    /**
     * Build the full attribution payload for the checkout flow.
     * Generates a new event_id each call (call once per checkout flow).
     */
    buildCheckoutPayload: function () {
      var utms = this.getUTMs();
      var meta = this.getMetaCookies();
      var eventId = this.generatePurchaseEventId();
      return {
        fb_event_id: eventId,
        fbp: meta.fbp,
        fbc: meta.fbc,
        utm_source: utms.utm_source || '',
        utm_medium: utms.utm_medium || '',
        utm_campaign: utms.utm_campaign || '',
        utm_term: utms.utm_term || '',
        utm_content: utms.utm_content || ''
      };
    },

    generateUUID: generateUUID
  };
})();
