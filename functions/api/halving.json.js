// SpaceCat Public API — Bitcoin halving live data.
// Cloudflare Pages Function. Served at https://spacecat.academy/api/halving.json
//
// CORS-enabled, cached at the edge for 30s. Free to use, attribution appreciated.
//
// Response example:
// {
//   "halving": {
//     "currentBlock": 949812,
//     "lastHalvingBlock": 840000,
//     "nextHalvingBlock": 1050000,
//     "blocksRemaining": 100188,
//     "blocksMined": 109812,
//     "progressPercent": 52.29,
//     "estimatedDaysLeft": 695.75,
//     "estimatedDate": "2028-04-15T...",
//     "currentReward": 3.125,
//     "nextReward": 1.5625
//   },
//   "price": { "btcUsd": 80123.4 },
//   "cycle": { "phase": "Expansion", "label": "Early cycle growth" },
//   "meta": { "source": "spacecat.academy", ... }
// }

const NEXT_HALVING  = 1_050_000;
const LAST_HALVING  =   840_000;
const BLOCKS_PER_DAY = 144;
const CURRENT_REWARD = 3.125;
const NEXT_REWARD    = 1.5625;
const HALVING_IV_DATE = '2024-04-19T16:13:00Z';

function cyclePhase(progress) {
  if (progress < 0.25) return { phase: 'Accumulation', label: 'Post-halving recovery' };
  if (progress < 0.55) return { phase: 'Expansion',    label: 'Early cycle growth' };
  if (progress < 0.82) return { phase: 'Bull Run',     label: 'Peak season approaching' };
  return                      { phase: 'Distribution', label: 'Late-cycle, cool-off' };
}

export async function onRequest(context) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    // Edge-cache for 30 s so repeated callers don't hammer upstream APIs
    'cache-control': 'public, max-age=30, s-maxage=30',
  };

  // Preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  let currentBlock = null;
  let btcPrice = null;

  // Block height (mempool.space)
  try {
    const r = await fetch('https://mempool.space/api/blocks/tip/height', { cf: { cacheTtl: 30 } });
    if (r.ok) currentBlock = await r.json();
  } catch {}

  // BTC/USD spot (Binance)
  try {
    const r = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { cf: { cacheTtl: 30 } });
    if (r.ok) {
      const d = await r.json();
      if (d && d.price) btcPrice = parseFloat(d.price);
    }
  } catch {}

  if (typeof currentBlock !== 'number' || currentBlock <= 0) {
    return new Response(
      JSON.stringify({ error: 'Block data temporarily unavailable. Please retry.' }),
      { status: 503, headers: { ...headers, 'cache-control': 'no-store' } }
    );
  }

  const remainingBlocks = Math.max(0, NEXT_HALVING - currentBlock);
  const blocksMined = currentBlock - LAST_HALVING;
  const totalBlocks = NEXT_HALVING - LAST_HALVING;
  const progress = blocksMined / totalBlocks;
  const daysLeft = remainingBlocks / BLOCKS_PER_DAY;
  const estDate = new Date(Date.now() + daysLeft * 86400e3).toISOString();
  const phase = cyclePhase(progress);

  const data = {
    halving: {
      currentBlock,
      lastHalvingBlock: LAST_HALVING,
      lastHalvingDate: HALVING_IV_DATE,
      nextHalvingBlock: NEXT_HALVING,
      blocksRemaining: remainingBlocks,
      blocksMined,
      progressPercent: Math.round(progress * 10000) / 100, // 2-decimal
      estimatedDaysLeft: Math.round(daysLeft * 100) / 100,
      estimatedDate: estDate,
      currentReward: CURRENT_REWARD,
      nextReward: NEXT_REWARD,
    },
    price: {
      btcUsd: btcPrice,
      satsPerUsd: btcPrice ? Math.round(100_000_000 / btcPrice) : null,
    },
    cycle: phase,
    meta: {
      source: 'spacecat.academy',
      docs: 'https://spacecat.academy/about/',
      sources: ['mempool.space', 'binance.com'],
      license: 'Free to use, attribution appreciated.',
      updatedAt: new Date().toISOString(),
    },
  };

  return new Response(JSON.stringify(data, null, 2), { headers });
}
