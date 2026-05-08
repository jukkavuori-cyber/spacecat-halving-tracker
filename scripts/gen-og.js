import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '../og-image.html');
const outPath  = path.resolve(__dirname, '../public/og-image.png');

const HALVING_BLOCK = 1_050_000;
const HALVING_START =   840_000;

// ── Fetch live data ──────────────────────────────────────────────────────────
let block = 948_000;
let price = 80_000;

try {
  const r = await fetch('https://mempool.space/api/blocks/tip/height');
  if (r.ok) block = await r.json();
  console.log(`📦 Live block: ${block}`);
} catch (e) { console.warn('⚠️  Block fetch failed:', e.message); }

try {
  const r = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
  if (r.ok) { const d = await r.json(); price = Math.round(parseFloat(d.price)); }
  console.log(`💰 Live price: $${price.toLocaleString()}`);
} catch (e) { console.warn('⚠️  Price fetch failed:', e.message); }

const blocksLeft = Math.max(0, HALVING_BLOCK - block);
const days       = Math.round((blocksLeft * 10) / (60 * 24));
const pct        = Math.min(100, ((block - HALVING_START) / (HALVING_BLOCK - HALVING_START) * 100));

const data = {
  block: block.toLocaleString('en-US'),
  price: '$' + price.toLocaleString('en-US'),
  days:  '~' + days + ' days',
  pct:   pct.toFixed(1) + '%',
};

console.log('📊 OG data:', data);

// ── Screenshot ───────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const page    = await browser.newPage();

await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(`file://${htmlPath}`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(600);

// Inject live values into the template
await page.evaluate((d) => {
  document.querySelector('[data-og="block"]').textContent = d.block;
  document.querySelector('[data-og="price"]').textContent = d.price;
  document.querySelector('[data-og="days"]').textContent  = d.days;
  document.querySelector('[data-og="pct"]').textContent   = d.pct;
}, data);

await page.waitForTimeout(200);
await page.screenshot({ path: outPath, clip: { x:0, y:0, width:1200, height:630 } });
await browser.close();

console.log(`✅  og-image.png saved → ${outPath}`);
