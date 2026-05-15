// Keep /es/index.html in sync with root /index.html so we don't maintain two
// near-identical HTML files. Runs before `vite build`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const LANGS = [
  { code: 'es', canonicalSuffix: '/es/' },
  // { code: 'fi', canonicalSuffix: '/fi/' }, // enable when ready
];

const source = readFileSync(resolve(root, 'index.html'), 'utf8');

for (const { code, canonicalSuffix } of LANGS) {
  const outDir = resolve(root, code);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  let html = source
    .replace(/<html lang="[a-zA-Z-]+">/, `<html lang="${code}">`)
    // Asset paths in dev/build: src/css and src/js are relative — keep
    // them resolvable from the /es/ folder by upgrading to absolute paths.
    .replace(/(src|href)="src\//g, '$1="/src/')
    // Make the canonical URL point to the language sub-path
    .replace(
      /<link rel="canonical" href="https:\/\/spacecat\.academy\/" \/>/,
      `<link rel="canonical" href="https://spacecat.academy${canonicalSuffix}" />`
    )
    // Add hreflang alternates right after canonical (idempotent: check first)
    .replace(
      /(<link rel="canonical" [^>]+\/>)/,
      `$1\n  <link rel="alternate" hreflang="en" href="https://spacecat.academy/" />\n  <link rel="alternate" hreflang="es" href="https://spacecat.academy/es/" />\n  <link rel="alternate" hreflang="x-default" href="https://spacecat.academy/" />`
    );

  writeFileSync(resolve(outDir, 'index.html'), html);
  console.log(`  → ${code}/index.html generated`);
}

// Also add hreflang to the English root if missing (idempotent)
const enPath = resolve(root, 'index.html');
let enHtml = readFileSync(enPath, 'utf8');
if (!enHtml.includes('hreflang="es"')) {
  enHtml = enHtml.replace(
    /(<link rel="canonical" [^>]+\/>)/,
    `$1\n  <link rel="alternate" hreflang="en" href="https://spacecat.academy/" />\n  <link rel="alternate" hreflang="es" href="https://spacecat.academy/es/" />\n  <link rel="alternate" hreflang="x-default" href="https://spacecat.academy/" />`
  );
  writeFileSync(enPath, enHtml);
  console.log('  → root index.html: hreflang alternates added');
}

console.log('Done.');
