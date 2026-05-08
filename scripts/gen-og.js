import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '../og-image.html');
const outPath  = path.resolve(__dirname, '../public/og-image.png');

const browser = await chromium.launch();
const page    = await browser.newPage();

await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(`file://${htmlPath}`);

// wait for Google Fonts
await page.waitForLoadState('networkidle');
await page.waitForTimeout(600);

await page.screenshot({ path: outPath, clip: { x:0, y:0, width:1200, height:630 } });
await browser.close();

console.log(`✅  og-image.png saved to ${outPath}`);
