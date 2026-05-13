'use strict';
// ╔════════════════════════════════════════════════════╗
// ║  SpaceCat v3 — Core Logic                          ║
// ╚════════════════════════════════════════════════════╝

const LAST_HALVING   = 840_000;
const NEXT_HALVING   = 1_050_000;
const BLOCKS_PER_DAY = 144;
const REFRESH_MS     = 30_000;
const DEMO = { block: 940_000, difficulty: 1.21e14, diffChange: 2.3, diffBlocks: 1204, fee: 25 };

// Honour ?block= URL param for sharing
const urlBlock = parseInt(new URLSearchParams(location.search).get('block'));
const initBlock = (urlBlock > LAST_HALVING && urlBlock < NEXT_HALVING) ? urlBlock : DEMO.block;

const state = {
  currentBlock: initBlock, lastBlock: initBlock - 1,
  isLive: false, wsConnected: false, lastBlockMs: Date.now(),
};
const catState = {
  face: '🐱', helmetColor: 'cyan', rocketStyle: 'standard', meowEnabled: true,
};

const el  = id => document.getElementById(id);
const fmt = n  => Number(n).toLocaleString();

// ── HALVING MATH ──────────────────────────────────────────────────────────────
function halvingProgress(block) {
  const total     = NEXT_HALVING - LAST_HALVING;
  const elapsed   = Math.max(0, block - LAST_HALVING);
  const progress  = Math.min(1, elapsed / total);
  const remaining = Math.max(0, NEXT_HALVING - block);
  return { progress, elapsed, remaining, daysLeft: Math.round(remaining / BLOCKS_PER_DAY) };
}
function blockReward(h) { return 50 / Math.pow(2, Math.floor(h / 210_000)); }
function totalBTCMined(h) {
  let total = 0, reward = 50, b = 0;
  while (b + 210_000 <= h) { total += reward * 210_000; reward /= 2; b += 210_000; }
  return total + reward * (h - b);
}

// ── API FETCHES ───────────────────────────────────────────────────────────────
async function apiFetch(url, fallback) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch { return fallback; }
}
const fetchBlock  = () => apiFetch('https://mempool.space/api/blocks/tip/height', null);
const fetchDiff   = () => apiFetch('https://mempool.space/api/v1/difficulty-adjustment', {
  currentDifficulty: DEMO.difficulty, difficultyChange: DEMO.diffChange, remainingBlocks: DEMO.diffBlocks,
});
const fetchFees   = () => apiFetch('https://mempool.space/api/v1/fees/recommended', { halfHourFee: DEMO.fee });
// Binance weekly klines — 2v historiaa, oikeat huippu/sulkemishinnat, ei rate-limittejä
const fetchPrices = () => apiFetch(
  'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=104', null
);
// Halving III cycle (May 11 2020 = 1589155200000): 104 viikkoa = ~2 vuotta
const fetchPrevCycle = () => apiFetch(
  'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=104&startTime=1589155200000', null
);
// Fear & Greed Index — alternative.me (ilmainen, ei avain)
const fetchFearGreed = () => apiFetch('https://api.alternative.me/fng/?limit=1', null);
// CoinGecko global — BTC dominance
const fetchGlobal = () => apiFetch('https://api.coingecko.com/api/v3/global', null);

// ── WEBSOCKET (real-time blocks) ──────────────────────────────────────────────
let wsInstance;
function initWebSocket() {
  try {
    wsInstance = new WebSocket('wss://mempool.space/api/v1/ws');
    wsInstance.onopen = () => {
      wsInstance.send(JSON.stringify({ action: 'want', data: ['blocks'] }));
      state.wsConnected = true;
      el('wsTag').textContent = 'WS●';
      el('wsTag').style.color = 'var(--green)';
    };
    wsInstance.onmessage = e => {
      try {
        const data = JSON.parse(e.data);
        if (data.block) {
          el('liveIndicator').style.opacity = '1';
          const h = data.block.height;
          if (h > state.currentBlock) {
            state.lastBlock    = state.currentBlock;
            state.lastBlockMs  = Date.now();
            state.currentBlock = h;
            onNewBlock(h);
            updateStats(h);
          }
        }
      } catch {}
    };
    wsInstance.onerror = () => {};
    wsInstance.onclose = () => {
      state.wsConnected = false;
      el('wsTag').textContent = 'WS○';
      el('wsTag').style.color = 'var(--text-dim)';
      setTimeout(initWebSocket, 8000); // reconnect
    };
  } catch {}
}

// ── STATS RIBBON ──────────────────────────────────────────────────────────────
function updateRibbon(diffData, feeData) {
  const diff   = diffData.currentDifficulty || DEMO.difficulty;
  const hrEH   = (diff * Math.pow(2, 32) / 600 / 1e18).toFixed(0);
  const change = diffData.difficultyChange ?? DEMO.diffChange;
  const remBlk = diffData.remainingBlocks  ?? DEMO.diffBlocks;
  const fee    = feeData.halfHourFee || DEMO.fee;
  const mined  = totalBTCMined(state.currentBlock);
  el('rHashrate').textContent = hrEH + ' EH/s';
  el('rReward').textContent   = blockReward(state.currentBlock) + ' BTC';
  el('rMined').textContent    = (mined / 1e6).toFixed(4) + 'M BTC';
  el('rFee').textContent      = fee + ' sat/vB';
  el('rDiff').textContent     = (change >= 0 ? '+' : '') + Number(change).toFixed(1) + '% · ' + fmt(remBlk) + ' blks';
  el('rDiff').className       = 'rv ' + (change >= 0 ? 'c-green' : 'c-red');
}

// ── SPACECAT POSITION ─────────────────────────────────────────────────────────
function updateStats(block) {
  const { progress, remaining, daysLeft } = halvingProgress(block);
  const pct = progress * 100;
  el('headerBlock').textContent   = '#' + fmt(block);
  el('statBlock').textContent     = fmt(block);
  el('statPct').textContent       = pct.toFixed(2) + '%';
  el('statRemaining').textContent = fmt(remaining);
  el('statDays').textContent      = fmt(daysLeft);
  el('vFill').style.height        = pct + '%';
  el('vPct').textContent          = Math.round(pct) + '%';
  positionCat(progress);
  startCountdown(remaining);
  checkMilestones(block);
}

// ── MILESTONES ────────────────────────────────────────────────────────────────
const MILESTONES = [900_000, 950_000, 1_000_000, 1_050_000];
const celebratedMs = new Set(
  JSON.parse(localStorage.getItem('spacecat_milestones') || '[]')
);

const MS_DATA = {
  900_000:   { icon: '🎯', msg: 'Three-quarters of the journey done!\nOnly 150,000 blocks to the next halving.' },
  950_000:   { icon: '🔥', msg: 'Just 100,000 blocks left!\nThe halving is getting close.' },
  1_000_000: { icon: '🌙', msg: 'ONE MILLION BLOCKS MINED!\nBitcoin\'s most iconic milestone.' },
  1_050_000: { icon: '🎆', msg: 'BITCOIN HALVING V!\nBlock reward halved to 1.5625 BTC.' },
};

function checkMilestones(block) {
  MILESTONES.forEach(m => {
    if (block >= m && !celebratedMs.has(m)) {
      celebratedMs.add(m);
      localStorage.setItem('spacecat_milestones', JSON.stringify([...celebratedMs]));
      showMilestoneCelebration(m);
    }
  });
}

function showMilestoneCelebration(block) {
  const d = MS_DATA[block] || { icon: '🚀', msg: 'Milestone reached!' };
  el('msIcon').textContent  = d.icon;
  el('msBlock').textContent = 'Block ' + fmt(block);
  el('msMsg').textContent   = d.msg;
  el('milestoneOverlay').classList.add('show');
  popMeow('excited');
}

function positionCat(progress) {
  const tc     = el('trackCol');
  const cat    = el('catWrapper');
  const usable = Math.max(0, tc.offsetHeight - 125 - 55 - 95);
  cat.style.position = 'absolute';
  cat.style.bottom   = (55 + progress * usable) + 'px';
  renderTrail(progress, usable);
  renderMilestones(usable);
}

function renderTrail(progress, usable) {
  el('trackCol').querySelectorAll('.tdot').forEach(d => d.remove());
  if (progress <= 0.01) return;
  const tc = el('trackCol');
  for (let i = 0; i < 11; i++) {
    const t  = (i + 1) / 12;
    const sz = 1.5 + (1 - t) * 3.5;
    const d  = document.createElement('div');
    d.className = 'tdot';
    d.style.cssText = `bottom:${55 + progress * t * usable + 47}px;width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px;opacity:${(0.75*(1-t*0.65)).toFixed(2)};animation-delay:${i*0.18}s`;
    tc.appendChild(d);
  }
}

function renderMilestones(usable) {
  el('trackCol').querySelectorAll('.mstone').forEach(d => d.remove());
  if (!usable) return;
  const tc = el('trackCol');
  [0.25, 0.5, 0.75].forEach(t => {
    const blk = LAST_HALVING + Math.round(t * (NEXT_HALVING - LAST_HALVING));
    const m   = document.createElement('div');
    m.className = 'mstone';
    m.style.cssText = `position:absolute;bottom:${55+t*usable+47}px;left:50%;transform:translateX(-50%);display:flex;align-items:center;pointer-events:none;`;
    m.innerHTML = `<div class="mstone-tick"></div><span class="mstone-lbl">${Math.round(t*100)}% · ${fmt(blk)}</span>`;
    tc.appendChild(m);
  });
}

// ── COUNTDOWN ─────────────────────────────────────────────────────────────────
let cdInterval;
function startCountdown(remainingBlocks) {
  const target = Date.now() + remainingBlocks * 10 * 60 * 1000;
  clearInterval(cdInterval);
  cdInterval = setInterval(() => {
    const ms = Math.max(0, target - Date.now());
    el('cdD').textContent = String(Math.floor(ms / 86400000)).padStart(3,'0');
    el('cdH').textContent = String(Math.floor((ms % 86400000) / 3600000)).padStart(2,'0');
    el('cdM').textContent = String(Math.floor((ms % 3600000) / 60000)).padStart(2,'0');
    el('cdS').textContent = String(Math.floor((ms % 60000) / 1000)).padStart(2,'0');
  }, 1000);
}

// ── NEW BLOCK ANIMATIONS ──────────────────────────────────────────────────────
function onNewBlock(block) {
  const inner = el('catInner');
  inner.classList.remove('jumping');
  void inner.offsetWidth;
  inner.classList.add('jumping');
  setTimeout(() => inner.classList.remove('jumping'), 900);

  const fast = (Date.now() - state.lastBlockMs) < 420_000;
  el('catWrapper').classList.toggle('speed-boost', fast);
  if (fast) setTimeout(() => el('catWrapper').classList.remove('speed-boost'), 7000);

  popMeow(fast ? 'excited' : 'happy');
  showToast('⛏ NEW BLOCK MINED', `Block #${fmt(block)} confirmed`);

  const hb = el('headerBlock');
  hb.classList.add('flash');
  setTimeout(() => hb.classList.remove('flash'), 700);
}

function showToast(title, body) {
  el('tTitle').textContent = title;
  el('tBody').textContent  = body;
  const t = el('toast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4200);
}

// ── MEOW SYNTHESIZER ──────────────────────────────────────────────────────────
const MEOW_TEXTS = ['miu~', 'nyaa~', 'purr~', 'mrrr~', 'miau!', '≽^·⩊·^≼', '~nya!'];

// Formanttisynteesi — jäljittelee kissan äänitorven resonansseja
function synthMeow(ctx, t0, { vol = 0.32, dur = 0.9, baseFreq = 370, peakFreq = 680, pitch = 1 } = {}) {
  const bf = baseFreq * pitch;
  const pf = peakFreq  * pitch;

  // Pääoskillaattori — sawtooth antaa yläsävelet kuten kissan äänihuulet
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';

  // Sävelkorkeuskirjekuori: m(matala) → i(nousu) → a(huippu) → u/w(lasku)
  osc.frequency.setValueAtTime(bf * 0.72, t0);
  osc.frequency.linearRampToValueAtTime(bf,        t0 + 0.06);   // "m" → suuaukko
  osc.frequency.linearRampToValueAtTime(pf * 0.85, t0 + 0.22);   // "i" nousu
  osc.frequency.linearRampToValueAtTime(pf,        t0 + dur*0.4); // "a" huippu
  osc.frequency.linearRampToValueAtTime(bf * 1.05, t0 + dur*0.7); // "u" lasku
  osc.frequency.linearRampToValueAtTime(bf * 0.75, t0 + dur);     // "~" häivy

  // Vibrato — kissan luontainen sävelvärähtely ~5.5 Hz
  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();
  lfo.frequency.value = 5.5;
  lfoG.gain.setValueAtTime(0,          t0);
  lfoG.gain.linearRampToValueAtTime(pf * 0.022, t0 + 0.3);
  lfoG.gain.setValueAtTime(pf * 0.022, t0 + dur * 0.72);
  lfoG.gain.linearRampToValueAtTime(0, t0 + dur);
  lfo.connect(lfoG);
  lfoG.connect(osc.frequency);

  // Formantti 1 — äänitorven ensimmäinen resonanssi (~900 Hz, "a"-vokaali)
  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass'; f1.frequency.value = 900; f1.Q.value = 3.5;

  // Formantti 2 — ylempi resonanssi (~1800 Hz, kissamainen "iä"-väri)
  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass'; f2.frequency.value = 1800; f2.Q.value = 5;

  // Softclipperi — pehmentää sawtoothin terävyyttä
  const wsh = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 255 - 1;
    curve[i] = (Math.PI + 80) * x / (Math.PI + 80 * Math.abs(x));
  }
  wsh.curve = curve;

  // Amplitudikirjekuori
  const env = ctx.createGain();
  env.gain.setValueAtTime(0,   t0);
  env.gain.linearRampToValueAtTime(vol, t0 + 0.052);
  env.gain.setValueAtTime(vol, t0 + dur * 0.58);
  env.gain.exponentialRampToValueAtTime(0.001, t0 + dur + 0.06);

  // Reititys: osc → wsh → f1+f2 → env → output
  osc.connect(wsh);
  wsh.connect(f1); wsh.connect(f2);
  f1.connect(env); f2.connect(env);
  env.connect(ctx.destination);

  osc.start(t0); osc.stop(t0 + dur + 0.1);
  lfo.start(t0); lfo.stop(t0 + dur + 0.1);
}

// Kissan siritysääni — "brrt!" uuden blokin löytyessä
// Kissat tekevät tätä "chattering"-ääntä kun näkevät saaliin/jotain jännää
function synthChirp(ctx, t0, { vol = 0.38 } = {}) {
  // Nopeat peräkkäiset nousevat pulssit
  [0, 0.11, 0.22].forEach((offset, i) => {
    const t  = t0 + offset;
    const osc = ctx.createOscillator();
    const f   = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(780 + i * 130, t);
    osc.frequency.exponentialRampToValueAtTime(1500 + i * 100, t + 0.075);

    f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 2.5;

    env.gain.setValueAtTime(0,                   t);
    env.gain.linearRampToValueAtTime(vol - i*0.06, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.001,  t + 0.09);

    osc.connect(f); f.connect(env); env.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.11);
  });

  // Lyhyt "miau!" perään ~0.4s jälkeen
  synthMeow(ctx, t0 + 0.42, { vol: 0.28, dur: 0.65, baseFreq: 420, peakFreq: 780, pitch: 1 });
}

// Real meow audio — alternates between two recordings so it doesn't feel repetitive
const MEOW_FILES = ['/meow1.mp3', '/meow2.mp3'];
const meowPool = MEOW_FILES.map(src => {
  const a = new Audio(src);
  a.preload = 'auto';
  return a;
});
let lastMeowIdx = -1;

function playMeow(type = 'gentle') {
  if (!catState.meowEnabled) return;

  // All meow types now use real audio, alternating between samples
  try {
    let idx;
    do { idx = Math.floor(Math.random() * meowPool.length); }
    while (meowPool.length > 1 && idx === lastMeowIdx);
    lastMeowIdx = idx;

    const a = meowPool[idx];
    a.currentTime = 0;
    a.volume = type === 'excited' ? 0.95 : (type === 'happy' ? 0.85 : 0.55);
    a.play().catch(() => {});
  } catch {}
}

// Hero frame animation: 1 → 2 → 3 → 4 → 5 → 6 → 1 (idle)
const HERO_FRAMES = [
  '/hero/frame1.png','/hero/frame2.png','/hero/frame3.png',
  '/hero/frame4.png','/hero/frame5.png','/hero/frame6.png'
];
const HERO_DURATIONS = [80, 100, 360, 240, 140, 120]; // ms per frame (linger on SPEAK/HOLD)
let heroAnimating = false;
function animateHeroMeow() {
  const hero = el('heroFrame');
  if (!hero || heroAnimating) return;
  heroAnimating = true;
  let i = 0;
  const step = () => {
    if (i >= HERO_FRAMES.length) {
      hero.src = HERO_FRAMES[0];
      heroAnimating = false;
      return;
    }
    hero.src = HERO_FRAMES[i];
    setTimeout(step, HERO_DURATIONS[i]);
    i++;
  };
  step();
}

function popMeow(soundType = 'gentle') {
  playMeow(soundType);
  const bubble = el('meowBubble');
  bubble.textContent = MEOW_TEXTS[Math.floor(Math.random() * MEOW_TEXTS.length)];
  bubble.classList.remove('pop');
  void bubble.offsetWidth;
  bubble.classList.add('pop');
  setTimeout(() => bubble.classList.remove('pop'), 1400);
  animateHeroMeow();
}

// ── CAT THEMES ────────────────────────────────────────────────────────────────
const HELMET_COLORS = {
  cyan:    'oklch(0.82 0.22 195)',
  pink:    'oklch(0.75 0.28 340)',
  gold:    'oklch(0.85 0.18 85)',
  emerald: 'oklch(0.82 0.28 142)',
  red:     'oklch(0.72 0.25 25)',
};

window.setHelmetColor = color => {
  catState.helmetColor = color;
  document.documentElement.style.setProperty('--hc', HELMET_COLORS[color] || HELMET_COLORS.cyan);
  document.querySelectorAll('.hcolor-btn').forEach(b => b.classList.toggle('active', b.dataset.color === color));
};

window.setCatFace = face => {
  catState.face = face;
  const legacy = el('catFaceEmoji');
  if (legacy) legacy.textContent = face;
  document.querySelectorAll('.face-btn').forEach(b => b.classList.toggle('active', b.dataset.face === face));
  popMeow('gentle');
};

window.setRocketStyle = style => {
  catState.rocketStyle = style;
  const w = el('catWrapper');
  // Strip existing rocket classes
  [...w.classList].filter(c => c.startsWith('rocket-')).forEach(c => w.classList.remove(c));
  if (style !== 'standard') w.classList.add('rocket-' + style);
  document.querySelectorAll('.rocket-btn').forEach(b => b.classList.toggle('active', b.dataset.style === style));
};

window.toggleMeow = btn => {
  catState.meowEnabled = !catState.meowEnabled;
  btn.textContent = catState.meowEnabled ? '🔊 Meow: ON' : '🔇 Meow: OFF';
  btn.classList.toggle('active', catState.meowEnabled);
  if (catState.meowEnabled) playMeow('gentle');
};

window.testMeow = () => popMeow('happy');

// ── FEAR & GREED + SATS ───────────────────────────────────────────────────────
function updateFearGreed(data) {
  const fgEl = el('rFearGreed');
  if (!fgEl || !data?.data?.[0]) return;
  const v     = parseInt(data.data[0].value);
  const label = data.data[0].value_classification;
  const cls   = v < 25 ? 'c-red' : v < 45 ? '' : v < 55 ? '' : v < 75 ? 'c-green' : 'c-green';
  const emoji = v < 25 ? '😱' : v < 45 ? '😟' : v < 55 ? '😐' : v < 75 ? '🙂' : '🤑';
  fgEl.textContent = `${v} · ${label}`;
  fgEl.className   = 'rv ' + cls;
  const labelEl = fgEl.closest('.ritem')?.querySelector('.rl');
  if (labelEl) labelEl.textContent = emoji + ' Fear & Greed';
}

function updateSats(price) {
  const sEl = el('rSats');
  if (!sEl || !price) return;
  sEl.textContent = fmt(Math.round(1e8 / price)) + ' sat';
}

function updateDominance(data) {
  const domEl = el('mktDom');
  if (!domEl || !data?.data?.market_cap_percentage?.btc) return;
  domEl.textContent = data.data.market_cap_percentage.btc.toFixed(1) + '%';
}

// ── CHART ─────────────────────────────────────────────────────────────────────
const FB_LABELS = ['Apr\'24','May\'24','Jun\'24','Jul\'24','Aug\'24','Sep\'24','Oct\'24','Nov\'24','Dec\'24','Jan\'25','Feb\'25','Mar\'25','Apr\'25'];
const FB_DATA   = [63700,61500,67200,66000,59500,62300,72000,96400,101200,108786,97000,82500,94280];
// Viikkodata: 1M≈5vk, 3M≈13vk, 6M≈26vk, 1Y≈52vk, 2Y=104vk
const RANGES    = { '1M': 5, '3M': 13, '6M': 26, '1Y': 52, '2Y': 104 };
let btcChart, chartLabels = FB_LABELS, chartData = FB_DATA, activeRange = '1Y';
let prevCycleKlines = null; // Halving III cycle data

function initChart(prices) {
  // Binance klines: [openTime, open, high, low, close, ...]
  if (Array.isArray(prices) && prices.length > 0) {
    chartLabels = prices.map(k =>
      new Date(k[0]).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    chartData = prices.map(k => Math.round(parseFloat(k[4]))); // weekly close
    if (btcChart) {
      const n = RANGES[activeRange] || chartData.length;
      btcChart.data.labels = chartLabels.slice(-n);
      btcChart.data.datasets[0].data = chartData.slice(-n);
      btcChart.update('active');
      return;
    }
  }
  if (btcChart) return;
  const ctx  = el('priceChart').getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, 'oklch(0.82 0.22 195 / 0.38)');
  grad.addColorStop(1, 'oklch(0.82 0.22 195 / 0.02)');
  btcChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels.slice(-RANGES['1Y']),
      datasets: [{
        data: chartData.slice(-RANGES['1Y']),
        borderColor: 'oklch(0.82 0.22 195)', borderWidth: 2,
        backgroundColor: grad, fill: true, tension: 0.42,
        pointBackgroundColor: 'oklch(0.82 0.22 195)',
        pointBorderColor: '#02020e', pointBorderWidth: 2,
        pointRadius: 4, pointHoverRadius: 7, pointHoverBackgroundColor: '#fff',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'oklch(0.08 0.06 285 / 0.96)',
          borderColor: 'oklch(0.72 0.28 285 / 0.35)', borderWidth: 1,
          titleColor: 'oklch(0.72 0.28 285)', bodyColor: 'oklch(0.93 0.02 260)', padding: 10,
          titleFont: { family: "'Orbitron',sans-serif", size: 10 },
          bodyFont:  { family: "'Space Mono',monospace", size: 11 },
          callbacks: {
            label: c => `  ${c.dataset.label || 'BTC'}: $${c.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: { grid: { color: 'oklch(0.72 0.28 285 / 0.06)' }, ticks: { color: 'oklch(0.55 0.05 260)', font: { family: "'Space Mono',monospace", size: 9 } }, border: { color: 'oklch(0.72 0.28 285 / 0.12)' } },
        y: { position: 'right', grid: { color: 'oklch(0.72 0.28 285 / 0.06)' }, ticks: { color: 'oklch(0.55 0.05 260)', font: { family: "'Space Mono',monospace", size: 9 }, callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) }, border: { color: 'oklch(0.72 0.28 285 / 0.12)' } }
      }
    }
  });
}

window.setRange = (btn, range) => {
  activeRange = range;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');

  if (range === 'CYC3') {
    showCycleComparison();
    return;
  }
  // Normaalinäkymä — poista mahdollinen cycle III -dataset
  if (btcChart.data.datasets.length > 1) {
    btcChart.data.datasets.splice(1);
  }
  const n = RANGES[range] || chartLabels.length;
  btcChart.data.labels   = chartLabels.slice(-n);
  btcChart.data.datasets[0].data = chartData.slice(-n);
  btcChart.data.datasets[0].label = 'Cycle IV';
  btcChart.update('active');
};

function showCycleComparison() {
  if (!btcChart) return;
  const curr = chartData.slice(); // kaikki viikot
  const prev = prevCycleKlines
    ? prevCycleKlines.map(k => Math.round(parseFloat(k[4])))
    : [];
  const n = Math.min(curr.length, prev.length || curr.length);
  const weeks = Array.from({ length: n }, (_, i) => `W+${i + 1}`);

  btcChart.data.labels = weeks;
  btcChart.data.datasets[0].data  = curr.slice(0, n);
  btcChart.data.datasets[0].label = 'Cycle IV (now)';

  if (prev.length) {
    const prevDataset = {
      label: 'Cycle III (2020)',
      data: prev.slice(0, n),
      borderColor: 'oklch(0.85 0.18 85 / 0.65)',
      borderWidth: 1.5,
      borderDash: [5, 4],
      backgroundColor: 'transparent',
      fill: false, tension: 0.42,
      pointRadius: 0, pointHoverRadius: 4,
      pointHoverBackgroundColor: 'var(--gold)',
    };
    if (btcChart.data.datasets.length > 1) {
      btcChart.data.datasets[1] = prevDataset;
    } else {
      btcChart.data.datasets.push(prevDataset);
    }
  }
  btcChart.update('active');
}

// Päivittää kaavion viimeisen pisteen live-hinnalla
function updateChartCurrentPrice(price) {
  if (!btcChart || !price) return;
  const last = chartData.length - 1;
  chartData[last] = Math.round(price);
  const n = RANGES[activeRange] || chartLabels.length;
  const idx = btcChart.data.datasets[0].data.length - 1;
  if (idx >= 0) {
    btcChart.data.datasets[0].data[idx] = Math.round(price);
    btcChart.update('none'); // silent update, ei animaatiota
  }
}

// ── STARFIELD ─────────────────────────────────────────────────────────────────
function initStarfield() {
  const cv = el('starfield'), cx = cv.getContext('2d');
  const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
  resize(); window.addEventListener('resize', resize);
  const S = Array.from({ length: 240 }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    r: Math.random() * 1.5 + 0.2, tw: Math.random() * Math.PI * 2,
    ts: Math.random() * 0.018 + 0.004,
    hue: Math.random() > 0.88 ? 130 + Math.random() * 200 : null,
  }));
  (function draw() {
    cx.clearRect(0, 0, cv.width, cv.height);
    S.forEach(s => {
      s.tw += s.ts;
      const a = 0.25 + 0.75 * Math.abs(Math.sin(s.tw));
      cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      cx.fillStyle = s.hue ? `hsl(${s.hue},75%,${60 + Math.sin(s.tw)*15}%)` : `rgba(255,255,255,${(a*.75).toFixed(2)})`;
      cx.fill();
    });
    requestAnimationFrame(draw);
  })();
}

// ── MARKET DATA (CoinGecko) ───────────────────────────────────────────────────
const TICKER_COINS = [
  { id: 'bitcoin',       sym: 'BTC'  },
  { id: 'ethereum',      sym: 'ETH'  },
  { id: 'solana',        sym: 'SOL'  },
  { id: 'binancecoin',   sym: 'BNB'  },
  { id: 'cardano',       sym: 'ADA'  },
  { id: 'dogecoin',      sym: 'DOGE' },
  { id: 'avalanche-2',   sym: 'AVAX' },
  { id: 'chainlink',     sym: 'LINK' },
  { id: 'polkadot',      sym: 'DOT'  },
  { id: 'matic-network', sym: 'POL'  },
];

const DEMO_MARKET = {
  bitcoin:       { usd: 94280,  usd_24h_change:  2.4,  usd_market_cap: 1.87e12 },
  ethereum:      { usd: 3210,   usd_24h_change:  1.1  },
  solana:        { usd: 178,    usd_24h_change: -0.8  },
  binancecoin:   { usd: 612,    usd_24h_change:  0.5  },
  cardano:       { usd: 0.48,   usd_24h_change: -1.2  },
  dogecoin:      { usd: 0.17,   usd_24h_change:  3.1  },
  'avalanche-2': { usd: 38.40,  usd_24h_change:  0.9  },
  chainlink:     { usd: 14.22,  usd_24h_change: -0.3  },
  polkadot:      { usd: 8.14,   usd_24h_change:  1.7  },
  'matic-network':{ usd: 0.92,  usd_24h_change: -0.5  },
};

// BTC hinta Binancesta (ilmainen, ei rate-limittejä)
async function fetchBTCPrice() {
  const d = await apiFetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', null);
  if (!d) return null;
  return {
    usd:            parseFloat(d.lastPrice),
    usd_24h_change: parseFloat(d.priceChangePercent),
    usd_market_cap: null, // ei saatavilla Binancesta
  };
}

// Altcoin ticker + BTC market cap CoinGeckosta (5min välein)
async function fetchMarketData() {
  const ids = TICKER_COINS.map(c => c.id).join(',');
  return apiFetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
    null
  );
}

function fmtPrice(n) {
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1)    return '$' + n.toFixed(2);
  return '$' + n.toFixed(4);
}

function fmtChange(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
}

function fmtMarketCap(n) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(0) + 'B';
  return '$' + n.toLocaleString();
}

function renderTicker(data) {
  const T = TICKER_COINS.map(c => {
    const d      = data[c.id] || {};
    const price  = d.usd != null ? fmtPrice(d.usd) : '—';
    const change = d.usd_24h_change != null ? fmtChange(d.usd_24h_change) : '—';
    const up     = (d.usd_24h_change ?? 0) >= 0 ? 1 : 0;
    return { n: c.sym, p: price, c: change, u: up };
  });
  const html = arr => arr.map(t =>
    `<span class="ti"><span class="tn">${t.n}</span><span class="tp">${t.p}</span><span class="tc ${t.u?'up':'dn'}">${t.c}</span></span><span class="ts">◆</span>`
  ).join('');
  el('tickerInner').innerHTML = html(T) + html(T);
}

function updateMarketStats(data) {
  const btc = data.bitcoin;
  if (!btc) return;

  if (btc.usd != null) {
    const up = (btc.usd_24h_change ?? 0) >= 0;
    const priceEl  = el('mktPrice');
    const changeEl = el('mktPriceChange');
    if (priceEl)  priceEl.textContent  = fmtPrice(btc.usd);
    if (changeEl) {
      changeEl.textContent = (up ? '▲ ' : '▼ ') + Math.abs(btc.usd_24h_change ?? 0).toFixed(1) + '% today';
      changeEl.className   = 'bc ' + (up ? 'up' : 'dn');
    }
    updateChartCurrentPrice(btc.usd); // synkronoi kaavio live-hintaan
  }

  if (btc.usd_market_cap != null) {
    const up    = (btc.usd_24h_change ?? 0) >= 0;
    const mcEl  = el('mktCap');
    const mcChEl = el('mktCapChange');
    if (mcEl)   mcEl.textContent   = fmtMarketCap(btc.usd_market_cap);
    if (mcChEl) {
      mcChEl.textContent = (up ? '▲ ' : '▼ ') + Math.abs(btc.usd_24h_change ?? 0).toFixed(1) + '% 24h';
      mcChEl.className   = 'bc ' + (up ? 'up' : 'dn');
    }
  }
}

function updateCycleATH(prices) {
  // Binance klines: [openTime, open, HIGH, low, close, ...]
  if (!Array.isArray(prices) || !prices.length) return;
  const halvingTs   = new Date('2024-04-20').getTime();
  const postHalving = prices.filter(k => k[0] >= halvingTs);
  if (!postHalving.length) return;
  // Käytetään viikon HIGH-hintaa (index 2) — näyttää todellisen ATH:n
  const ath      = Math.max(...postHalving.map(k => parseFloat(k[2])));
  const athWeek  = postHalving.find(k => parseFloat(k[2]) === ath);
  const athDate  = athWeek ? new Date(athWeek[0]).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
  const athEl    = el('mktATH');
  const athDtEl  = el('mktATHDate');
  if (athEl)   athEl.textContent   = '$' + Math.round(ath).toLocaleString();
  if (athDtEl) athDtEl.textContent = athDate;
}

async function refreshMarketData() {
  // BTC hinta Binancesta — ilmainen, luotettava, ei rate-limittejä
  const btcData = await fetchBTCPrice();
  if (btcData) {
    updateMarketStats({ bitcoin: btcData });
    updateSats(btcData.usd);
  }

  // Altcoin ticker, Fear&Greed, Global market — rinnakkain 5min välein
  const [tickerData, fgData, globalData] = await Promise.all([
    fetchMarketData(),
    fetchFearGreed(),
    fetchGlobal(),
  ]);

  if (tickerData) {
    if (btcData) tickerData.bitcoin = { ...tickerData.bitcoin, ...btcData };
    renderTicker(tickerData);
  }
  updateFearGreed(fgData);
  updateDominance(globalData);
}

// ── SHARE ─────────────────────────────────────────────────────────────────────
window.shareTracker = async () => {
  const url = `${location.origin}${location.pathname}?block=${state.currentBlock}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('🔗 LINK COPIED!', `Sharing block #${fmt(state.currentBlock)}`);
  } catch { prompt('Copy this link:', url); }
};

window.tweetShare = () => {
  const { daysLeft, progress } = halvingProgress(state.currentBlock);
  const pct  = (progress * 100).toFixed(1);
  const text = encodeURIComponent(
    `⚡ ${fmt(daysLeft)} days until the next #Bitcoin halving!\n` +
    `🚀 Block ${fmt(state.currentBlock)} — ${pct}% of the journey done\n` +
    `🐱 Track live → spacecat.academy`
  );
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=560,height=440,noopener');
};

// ── TWEAKS PANEL ──────────────────────────────────────────────────────────────
window.setTheme = theme => {
  document.body.className = document.body.className.replace(/\btheme-\S+/g,'').trim();
  if (theme !== 'cosmic') document.body.classList.add('theme-' + theme);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
};
window.toggleTweaks = () => el('tweaksPanel').classList.toggle('open');

// ── TIP JAR ───────────────────────────────────────────────────────────────────
const TIP_ADDR = 'bc1qu4ckfatwrr4ycmleq0sw4gpv3h05g0dgg7ztx0';

window.toggleTip = () => el('tipPanel').classList.toggle('open');

window.copyTipAddr = async () => {
  try {
    await navigator.clipboard.writeText(TIP_ADDR);
    const btn = el('tipCopyBtn');
    btn.textContent = 'COPIED ✓';
    btn.style.borderColor = 'var(--gold)';
    btn.style.color = 'var(--gold)';
    setTimeout(() => { btn.textContent = 'COPY'; btn.style.borderColor = ''; btn.style.color = ''; }, 2000);
  } catch { prompt('Copy address:', TIP_ADDR); }
};

window.openTipLink = sats => {
  // Bitcoin URI with amount in BTC
  const btc = (sats / 1e8).toFixed(8);
  window.open(`bitcoin:${TIP_ADDR}?amount=${btc}`, '_blank');
};

// ── MOBILE TABS ───────────────────────────────────────────────────────────────
window.setTab = tab => {
  el('journeyPanel').style.display = tab === 'journey' ? '' : 'none';
  el('chartPanel').style.display   = tab === 'chart'   ? '' : 'none';
  document.querySelectorAll('.mtab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
};

// ── MAIN REFRESH (polling fallback) ───────────────────────────────────────────
async function refresh() {
  if (state.wsConnected) return;
  const [block, diff, fees] = await Promise.all([fetchBlock(), fetchDiff(), fetchFees()]);
  if (typeof block === 'number' && block > 0) {
    el('liveIndicator').style.opacity = '1';
    if (block > state.currentBlock) {
      state.lastBlock = state.currentBlock; state.lastBlockMs = Date.now();
      state.currentBlock = block;
      onNewBlock(block);
    } else { state.currentBlock = block; }
  } else {
    state.currentBlock += Math.floor(Math.random() * 2) + 1;
  }
  updateStats(state.currentBlock);
  updateRibbon(diff, fees);
}

// ── INIT ──────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  renderTicker(DEMO_MARKET); // placeholder ennen ensimmäistä API-vastausta

  requestAnimationFrame(() => requestAnimationFrame(() => {
    updateStats(state.currentBlock);
    updateRibbon(
      { currentDifficulty: DEMO.difficulty, difficultyChange: DEMO.diffChange, remainingBlocks: DEMO.diffBlocks },
      { halfHourFee: DEMO.fee }
    );
    document.querySelectorAll('.pill').forEach(p =>
      p.classList.toggle('active', p.textContent.trim() === '1Y'));
    setHelmetColor('cyan'); // init helmet CSS var
  }));

  setTimeout(() => {
    initChart(null);
    fetchPrices().then(d => { if (d) { initChart(d); updateCycleATH(d); } });
    // Halving III vertailudata taustalla
    fetchPrevCycle().then(d => { if (d) prevCycleKlines = d; });
  }, 150);

  // BTC hinta Binancesta joka 30s — ei rate-limittejä
  async function refreshBTC() {
    const btcData = await fetchBTCPrice();
    if (btcData) updateMarketStats({ bitcoin: btcData });
  }
  refreshBTC();
  setInterval(refreshBTC, 30_000);

  // Altcoin ticker CoinGeckosta joka 5min
  refreshMarketData();
  setInterval(refreshMarketData, 5 * 60_000);

  // WebSocket for real-time block push
  initWebSocket();
  // Polling fallback
  refresh();
  setInterval(refresh, REFRESH_MS);

  // Block explorer link — klikkaa blocknumeroa → mempool.space
  const hb = el('headerBlock');
  hb.style.cursor = 'pointer';
  hb.title = 'Open in mempool.space ↗';
  hb.addEventListener('click', () =>
    window.open(`https://mempool.space/block-height/${state.currentBlock}`, '_blank', 'noopener')
  );

  // Cat clickable → meow (new hero img + legacy emoji fallback)
  const heroImg = el('heroFrame');
  if (heroImg) heroImg.addEventListener('click', () => popMeow('happy'));
  const legacyEmoji = el('catFaceEmoji');
  if (legacyEmoji) legacyEmoji.addEventListener('click', () => popMeow('happy'));

  window.addEventListener('resize', () => {
    const { progress } = halvingProgress(state.currentBlock);
    positionCat(progress);
  });

  if (window.innerWidth <= 768) setTab('journey');

  // Demo hook for tweaks panel
  window.state_demo = () => {
    state.currentBlock += 1;
    state.lastBlockMs = Date.now() - 300_000;
    onNewBlock(state.currentBlock);
    updateStats(state.currentBlock);
  };
});
