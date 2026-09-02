// <scenario-map>: a dark-tinted OpenStreetMap view (via Leaflet, loaded
// lazily from a CDN) that flies between the three thesis scenarios.
(() => {
  const CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  const CSS_HASH = 'sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H';
  const JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  const JS_HASH = 'sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH';

  const VIEWS = {
    Melaten:   { center: [50.7842, 6.0500], zoom: 15 },
    Aachen:    { center: [50.7787, 6.0789], zoom: 15.5 },
    Jackerath: { center: [51.0305, 6.4740], zoom: 14 }
  };

  let cssPromise, jsPromise;
  const loadCss = () => cssPromise || (cssPromise = new Promise((res) => {
    if (document.querySelector('link[data-leaflet]')) return res();
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = CSS; l.integrity = CSS_HASH; l.crossOrigin = 'anonymous';
    l.setAttribute('data-leaflet', '');
    l.onload = res; l.onerror = res;
    document.head.appendChild(l);
  }));
  const loadJs = () => jsPromise || (jsPromise = new Promise((res, rej) => {
    if (window.L) return res(window.L);
    const s = document.createElement('script');
    s.src = JS; s.integrity = JS_HASH; s.crossOrigin = 'anonymous';
    s.onload = () => res(window.L); s.onerror = rej;
    document.head.appendChild(s);
  }));

  class ScenarioMap extends HTMLElement {
    static get observedAttributes() { return ['scenario']; }

    connectedCallback() {
      if (this._built) return;
      this._built = true;
      this.style.display = 'block';
      if (getComputedStyle(this).position === 'static') this.style.position = 'relative';
      this.style.background = '#0f1118';
      this.style.overflow = 'hidden';

      this._host = document.createElement('div');
      Object.assign(this._host.style, {
        position: 'absolute', inset: '0',
        filter: 'invert(1) hue-rotate(200deg) brightness(0.88) contrast(1.22) saturate(0.55)'
      });
      this.appendChild(this._host);

      this._tint = document.createElement('div');
      Object.assign(this._tint.style, {
        position: 'absolute', inset: '0', pointerEvents: 'none',
        background: '#7c6cf0', mixBlendMode: 'color', opacity: '0.4'
      });
      this.appendChild(this._tint);

      this._vig = document.createElement('div');
      Object.assign(this._vig.style, {
        position: 'absolute', inset: '0', pointerEvents: 'none',
        background: 'radial-gradient(ellipse 92% 92% at 50% 45%, transparent 45%, rgba(15,17,24,0.5) 100%)'
      });
      this.appendChild(this._vig);

      this._status = document.createElement('div');
      Object.assign(this._status.style, {
        position: 'absolute', inset: '0', display: 'flex', alignItems: 'center',
        justifyContent: 'center', font: '500 11px/1 Sora, system-ui, sans-serif',
        letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6d7183', pointerEvents: 'none'
      });
      this._status.textContent = 'Karte wird geladen';
      this.appendChild(this._status);

      loadCss();
      loadJs().then((L) => {
        const v = VIEWS[this.getAttribute('scenario')] || VIEWS.Melaten;
        this._map = L.map(this._host, {
          zoomControl: false, attributionControl: true, keyboard: false,
          scrollWheelZoom: false, center: v.center, zoom: v.zoom
        });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors', maxZoom: 19
        }).addTo(this._map);
        L.control.zoom({ position: 'bottomright' }).addTo(this._map);
        this._map.on('click', () => this._map.scrollWheelZoom.enable());
        this._map.on('mouseout', () => this._map.scrollWheelZoom.disable());
        this._status.remove();
        this._ro = new ResizeObserver(() => this._map.invalidateSize());
        this._ro.observe(this);
      }).catch(() => { this._status.textContent = 'Karte nicht verfügbar'; });
    }

    attributeChangedCallback(n, o, v) {
      if (n !== 'scenario' || !this._map || o === v) return;
      const view = VIEWS[v];
      if (view) this._map.flyTo(view.center, view.zoom, { duration: 0.9 });
    }

    disconnectedCallback() { if (this._ro) this._ro.disconnect(); }
  }

  if (!customElements.get('scenario-map')) customElements.define('scenario-map', ScenarioMap);
})();
