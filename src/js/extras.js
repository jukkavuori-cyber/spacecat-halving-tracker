// SpaceCat extras: easter eggs, achievements, notifications, cycle phase.
// All client-side; persists state to localStorage.

const LS_KEY = 'spacecat:extras:v1';

const state = (() => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
})();
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

function showToast(title, body, duration = 3200) {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('tTitle').textContent = title;
  document.getElementById('tBody').textContent = body;
  t.classList.add('show');
  clearTimeout(showToast._h);
  showToast._h = setTimeout(() => t.classList.remove('show'), duration);
}

// ── 1. Click counter + achievements ─────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_meow',  at:   1, title: 'First Meow! 🐾',         body: 'Welcome aboard, captain.' },
  { id: 'meow_10',     at:  10, title: 'Petting Pro 🐱',          body: 'The cat appreciates the attention.' },
  { id: 'meow_50',     at:  50, title: 'Cat Whisperer 🌙',        body: '50 meows and counting!' },
  { id: 'meow_100',    at: 100, title: 'Rainbow Mode Unlocked! 🌈', body: 'Quantum thrusters are now permanent.' },
  { id: 'meow_500',    at: 500, title: 'Astral Bond ✨',          body: 'You and the cat share a cosmic frequency.' },
];

export function trackClick() {
  state.clicks = (state.clicks || 0) + 1;
  save();
  for (const a of ACHIEVEMENTS) {
    if (state.clicks === a.at && !state[`ach:${a.id}`]) {
      state[`ach:${a.id}`] = Date.now();
      save();
      showToast(a.title, a.body, 4200);
      if (a.id === 'meow_100') {
        // Permanent quantum thrusters
        const w = document.getElementById('catWrapper');
        if (w) {
          [...w.classList].filter(c => c.startsWith('rocket-')).forEach(c => w.classList.remove(c));
          w.classList.add('rocket-quantum');
          try { window.localStorage.setItem('spacecat:rocketUnlocked', 'quantum'); } catch {}
        }
      }
    }
  }
}

// Restore unlocked rocket on load
export function restoreUnlocks() {
  try {
    const unlocked = localStorage.getItem('spacecat:rocketUnlocked');
    if (unlocked) {
      const w = document.getElementById('catWrapper');
      if (w) w.classList.add('rocket-' + unlocked);
    }
  } catch {}
}

// ── 2. Konami code easter egg ───────────────────────────────────────────────
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let kbuf = [];
export function initKonami() {
  window.addEventListener('keydown', (e) => {
    kbuf.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (kbuf.length > KONAMI.length) kbuf.shift();
    if (KONAMI.every((k, i) => k === kbuf[i])) {
      kbuf = [];
      const w = document.getElementById('catWrapper');
      if (!w) return;
      [...w.classList].filter(c => c.startsWith('rocket-')).forEach(c => w.classList.remove(c));
      w.classList.add('rocket-quantum');
      document.body.classList.add('konami-flash');
      setTimeout(() => document.body.classList.remove('konami-flash'), 1800);
      showToast('🌈 KONAMI MODE', 'Quantum rocket engaged!', 4000);
    }
  });
}

// ── 3. Cycle phase indicator ────────────────────────────────────────────────
// Maps halving cycle progress (0..1) → market phase. Loose mapping based on
// previous cycles: 0-25% recovery, 25-50% expansion, 50-75% bull, 75-100% peak/cool.
export function cyclePhase(progress) {
  if (progress < 0.25) return { name: 'Accumulation', emoji: '🌱', color: 'oklch(.7 .2 145)', desc: 'Post-halving recovery' };
  if (progress < 0.55) return { name: 'Expansion',    emoji: '📈', color: 'oklch(.78 .22 195)', desc: 'Early cycle growth' };
  if (progress < 0.82) return { name: 'Bull Run',     emoji: '🚀', color: 'oklch(.82 .25 50)', desc: 'Peak season approaching' };
  return                       { name: 'Distribution',emoji: '🏁', color: 'oklch(.72 .25 25)', desc: 'Late-cycle, cool-off' };
}

export function renderCyclePhase(progress) {
  const target = document.getElementById('cyclePhase');
  if (!target) return;
  const p = cyclePhase(progress);
  target.innerHTML = `
    <span class="cp-emoji">${p.emoji}</span>
    <span class="cp-name" style="color:${p.color}">${p.name}</span>
    <span class="cp-desc">${p.desc}</span>
  `;
}

// ── 4. Browser notifications ────────────────────────────────────────────────
export function initNotifications() {
  const btn = document.getElementById('notifyBtn');
  if (!btn) return;

  const setBtn = (granted) => {
    btn.textContent = granted ? '🔔 NOTIFIED' : '🔔 NOTIFY';
    btn.classList.toggle('on', granted);
  };

  const granted = Notification && Notification.permission === 'granted';
  setBtn(granted);
  state.notifyOptIn = granted;

  btn.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      showToast('Not supported', 'Your browser does not support notifications.');
      return;
    }
    if (Notification.permission === 'denied') {
      showToast('Notifications blocked', 'Enable them in your browser settings.', 5000);
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      state.notifyOptIn = true; save();
      setBtn(true);
      showToast('🔔 Notifications on', 'You will be alerted on big milestones.', 3500);
      new Notification('SpaceCat is watching 🐱', {
        body: 'You will be notified when major blocks are mined.',
        icon: '/android-chrome-192x192.png',
        silent: true,
      });
    }
  });
}

export function notifyMilestone(title, body) {
  if (!state.notifyOptIn) return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-96x96.png',
      tag: 'spacecat-milestone',
      requireInteraction: false,
    });
  } catch {}
}

// Trigger on milestone blocks (every 10k from launchpad)
export function maybeNotifyBlock(block) {
  if (!block) return;
  if (block % 10_000 !== 0) return;
  const lastSent = state.lastNotifiedBlock || 0;
  if (block <= lastSent) return;
  state.lastNotifiedBlock = block;
  save();
  notifyMilestone(
    `🚀 Block ${block.toLocaleString()} mined!`,
    'Another milestone reached on the way to the next halving.'
  );
}
