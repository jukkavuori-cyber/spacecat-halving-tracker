// PWA installation: service worker registration + install prompt UX.
// Service worker is at /sw.js (Vite copies from public/ to dist root).

const INSTALL_DISMISSED_KEY = 'spacecat:installDismissed';
const INSTALL_DELAY_MS = 12_000; // wait this long before showing the install hint

// ── 1. Register the service worker ──────────────────────────────────────
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.hostname === 'localhost' || location.protocol === 'http:') return; // dev — skip
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Auto-detect updates: if a new SW takes over, gently nudge a reload
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          // Subtle hint rather than instant reload so user keeps state
          showUpdateAvailable();
        });

        // Manually check for updates every 30 min while page is open
        setInterval(() => reg.update().catch(() => {}), 30 * 60_000);
      })
      .catch((err) => console.warn('[PWA] SW registration failed:', err));
  });
}

function showUpdateAvailable() {
  if (document.getElementById('pwaUpdateToast')) return;
  const el = document.createElement('div');
  el.id = 'pwaUpdateToast';
  el.innerHTML = `
    <span>🚀 New version available</span>
    <button id="pwaReloadBtn">RELOAD</button>
  `;
  Object.assign(el.style, {
    position: 'fixed', left: '50%', top: '14px', transform: 'translateX(-50%)',
    background: 'oklch(.08 .04 265 / .95)',
    border: '1px solid oklch(.7 .2 145 / .55)',
    color: '#e8e8ff', padding: '10px 16px',
    display: 'flex', alignItems: 'center', gap: '14px',
    fontFamily: '"Space Mono", monospace', fontSize: '.7rem', letterSpacing: '.08em',
    zIndex: '99999', backdropFilter: 'blur(8px)',
    boxShadow: '0 6px 24px oklch(.05 0 0 / .5), 0 0 12px oklch(.7 .2 145 / .25)',
  });
  document.body.appendChild(el);
  document.getElementById('pwaReloadBtn').addEventListener('click', () => {
    location.reload();
  });
  Object.assign(document.getElementById('pwaReloadBtn').style, {
    background: 'transparent', border: '1px solid oklch(.7 .2 145 / .55)',
    color: 'oklch(.7 .2 145)', padding: '4px 10px', fontFamily: 'Orbitron, sans-serif',
    fontSize: '.6rem', letterSpacing: '.16em', cursor: 'pointer',
  });
  setTimeout(() => el.remove(), 30_000);
}

// ── 2. Install prompt (Android/Chrome) ──────────────────────────────────
let deferredPrompt = null;

export function initInstallPrompt() {
  // Already installed → don't show anything
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return; // iOS standalone
  if (localStorage.getItem(INSTALL_DISMISSED_KEY)) return;

  // Android/Chrome: capture the prompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => maybeShowInstallBanner('chrome'), INSTALL_DELAY_MS);
  });

  // iOS: no beforeinstallprompt; we show a different "Add to Home Screen" hint
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  if (isIOS && isSafari) {
    setTimeout(() => maybeShowInstallBanner('ios'), INSTALL_DELAY_MS);
  }

  // After successful install
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    dismissBanner();
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'installed-' + Date.now());
    } catch {}
  });
}

function maybeShowInstallBanner(platform) {
  if (document.getElementById('pwaInstallBanner')) return;
  if (localStorage.getItem(INSTALL_DISMISSED_KEY)) return;

  const el = document.createElement('div');
  el.id = 'pwaInstallBanner';

  const message = platform === 'ios'
    ? `<div class="pwa-text">
         <div class="pwa-title">📱 Install SpaceCat</div>
         <div class="pwa-sub">Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></div>
       </div>`
    : `<div class="pwa-text">
         <div class="pwa-title">📱 Install SpaceCat</div>
         <div class="pwa-sub">Get fast access &amp; offline support</div>
       </div>`;

  const action = platform === 'ios'
    ? ''
    : `<button id="pwaInstallBtn">INSTALL</button>`;

  el.innerHTML = `
    <img src="/android-chrome-192x192.png" class="pwa-logo" alt="" />
    ${message}
    ${action}
    <button id="pwaDismissBtn" class="pwa-x" aria-label="Dismiss">✕</button>
  `;

  Object.assign(el.style, {
    position: 'fixed', left: '14px', right: '14px', bottom: '78px',
    background: 'linear-gradient(135deg, oklch(.08 .04 265 / .96), oklch(.04 .04 265 / .98))',
    border: '1px solid oklch(.45 .12 285 / .55)',
    color: '#e8e8ff',
    padding: '12px 14px',
    display: 'flex', alignItems: 'center', gap: '12px',
    fontFamily: '"Space Mono", monospace',
    zIndex: '120', backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0,0,0,.55), 0 0 18px oklch(.72 .28 285 / .25)',
    maxWidth: '440px', margin: '0 auto',
    animation: 'pwaSlideUp .4s cubic-bezier(.2,.7,.2,1)',
  });
  document.body.appendChild(el);

  // Inject styles for content
  if (!document.getElementById('pwaInstallStyles')) {
    const s = document.createElement('style');
    s.id = 'pwaInstallStyles';
    s.textContent = `
      @keyframes pwaSlideUp { from { transform: translateY(60px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      #pwaInstallBanner .pwa-logo { width: 38px; height: 38px; flex-shrink: 0; filter: drop-shadow(0 0 8px oklch(.72 .28 285 / .4)); }
      #pwaInstallBanner .pwa-text { flex: 1; min-width: 0; }
      #pwaInstallBanner .pwa-title { font-family: Orbitron, sans-serif; font-weight: 700; font-size: .72rem; letter-spacing: .08em; }
      #pwaInstallBanner .pwa-sub { font-size: .58rem; letter-spacing: .04em; color: oklch(.55 .08 265); margin-top: 3px; }
      #pwaInstallBtn {
        background: linear-gradient(100deg, oklch(.72 .28 285), oklch(.82 .22 195));
        color: white; border: 0; padding: 7px 12px; font-family: Orbitron, sans-serif;
        font-size: .58rem; letter-spacing: .12em; cursor: pointer; font-weight: 700;
        box-shadow: 0 0 12px oklch(.72 .28 285 / .35);
      }
      #pwaInstallBtn:hover { filter: brightness(1.1); }
      #pwaDismissBtn.pwa-x {
        background: transparent; border: 0; color: oklch(.55 .08 265);
        font-size: 1rem; cursor: pointer; padding: 4px 6px; line-height: 1;
      }
      #pwaDismissBtn.pwa-x:hover { color: #e8e8ff; }
    `;
    document.head.appendChild(s);
  }

  document.getElementById('pwaDismissBtn').addEventListener('click', () => {
    try { localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now())); } catch {}
    dismissBanner();
  });

  const installBtn = document.getElementById('pwaInstallBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (choice.outcome === 'accepted') {
          dismissBanner();
        } else {
          try { localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now())); } catch {}
          dismissBanner();
        }
      } catch (err) {
        console.warn('[PWA] Install failed:', err);
      }
    });
  }
}

function dismissBanner() {
  const el = document.getElementById('pwaInstallBanner');
  if (el) el.remove();
}
