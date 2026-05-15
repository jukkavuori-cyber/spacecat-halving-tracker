// Keep /es/, /fi/, ... index.html in sync with root /index.html so we don't
// maintain near-identical HTML files. Runs before `vite dev` and `vite build`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const LANGS = [
  { code: 'es', canonicalSuffix: '/es/' },
  { code: 'fi', canonicalSuffix: '/fi/' },
  { code: 'pt', canonicalSuffix: '/pt/' },
];

// Build the canonical hreflang block once, shared by all language pages
const hreflangLines = [
  `<link rel="alternate" hreflang="en" href="https://spacecat.academy/" />`,
  ...LANGS.map(l => `<link rel="alternate" hreflang="${l.code}" href="https://spacecat.academy${l.canonicalSuffix}" />`),
  `<link rel="alternate" hreflang="x-default" href="https://spacecat.academy/" />`,
].map(s => '  ' + s).join('\n');

// Read root and clean any prior hreflang block
const enPath = resolve(root, 'index.html');
let enHtml = readFileSync(enPath, 'utf8');
// Strip consecutive <link rel="alternate"...> lines (with their indent + newline)
enHtml = enHtml.replace(/(?:^[ \t]*<link rel="alternate"[^>]*\/>\n)+/m, '');
// Inject the fresh hreflang block right after canonical
enHtml = enHtml.replace(
  /(<link rel="canonical" [^>]+\/>)/,
  `$1\n${hreflangLines}`
);
writeFileSync(enPath, enHtml);
console.log('  → root index.html: hreflang refreshed');

// Now generate each lang variant from this cleaned source
const source = enHtml;

for (const { code, canonicalSuffix } of LANGS) {
  const outDir = resolve(root, code);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const html = source
    .replace(/<html lang="[a-zA-Z-]+">/, `<html lang="${code}">`)
    // Absolute paths so /es/ and /fi/ folders can still resolve src/* assets
    .replace(/(src|href)="src\//g, '$1="/src/')
    // Canonical → language sub-path
    .replace(
      /<link rel="canonical" href="https:\/\/spacecat\.academy\/" \/>/,
      `<link rel="canonical" href="https://spacecat.academy${canonicalSuffix}" />`
    );

  writeFileSync(resolve(outDir, 'index.html'), html);
  console.log(`  → ${code}/index.html generated`);
}

console.log('Done.');
