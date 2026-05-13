// Recent blocks + mining pool distribution from mempool.space.
// Refreshes every 60s and on new block events.

const API = 'https://mempool.space/api';

function fmt(n) { return n.toLocaleString('en-US'); }

function ago(ts) {
  const s = Math.max(1, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

let lastBlockSeen = null;

export async function refreshRecentBlocks() {
  const ul = document.getElementById('recentBlocks');
  if (!ul) return;
  try {
    const r = await fetch(`${API}/v1/blocks`);
    if (!r.ok) return;
    const blocks = await r.json();
    const top = blocks.slice(0, 10);
    ul.innerHTML = '';
    for (const b of top) {
      const isNew = lastBlockSeen != null && b.height > lastBlockSeen;
      const shortHash = (b.id || '').slice(0, 8) + '…' + (b.id || '').slice(-6);
      const poolName = (b.extras && b.extras.pool && b.extras.pool.name) || 'Unknown';
      const li = document.createElement('li');
      if (isNew) li.classList.add('new');
      li.innerHTML = `
        <span class="rb-h">#${fmt(b.height)}</span>
        <span class="rb-hash" title="${b.id || ''}">${shortHash}</span>
        <span class="rb-pool">${poolName}</span>
        <span class="rb-age">${ago(b.timestamp)}</span>
      `;
      ul.appendChild(li);
    }
    if (top.length) lastBlockSeen = top[0].height;
  } catch {
    if (ul.children.length === 0 || ul.firstChild.classList?.contains('rb-placeholder')) {
      ul.innerHTML = '<li class="rb-placeholder">Unable to load blocks.</li>';
    }
  }
}

export async function refreshMiningPools() {
  const root = document.getElementById('poolList');
  if (!root) return;
  try {
    const r = await fetch(`${API}/v1/mining/pools/24h`);
    if (!r.ok) return;
    const data = await r.json();
    const pools = (data.pools || []).slice(0, 8);
    const total = pools.reduce((s, p) => s + (p.blockCount || 0), 0) || 1;
    root.innerHTML = '';
    for (const p of pools) {
      const pct = (p.blockCount / total) * 100;
      const row = document.createElement('div');
      row.className = 'pool-row';
      row.innerHTML = `
        <div class="pool-bar" style="width:${pct.toFixed(1)}%"></div>
        <span class="pool-name">${p.name}</span>
        <span class="pool-pct">${pct.toFixed(1)}%</span>
      `;
      root.appendChild(row);
    }
  } catch {
    if (root.children.length === 0 || root.firstChild.classList?.contains('rb-placeholder')) {
      root.innerHTML = '<div class="rb-placeholder">Unable to load pool data.</div>';
    }
  }
}

export function startLiveData() {
  refreshRecentBlocks();
  refreshMiningPools();
  setInterval(refreshRecentBlocks, 60_000);
  setInterval(refreshMiningPools, 5 * 60_000);
}
