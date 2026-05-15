// SpaceCat i18n — runtime translation system.
// Reads <html lang="..."> attribute, loads matching JSON, and replaces:
//  - text in elements with data-i18n="key"
//  - attribute values via data-i18n-attr="attr:key"
//  - aria-label via data-i18n-aria="key"
//
// For dynamic strings used in JS, use the `t(key, vars?)` function.

import en from '../i18n/en.json';
import es from '../i18n/es.json';

const DICTS = { en, es };
const DEFAULT_LANG = 'en';

function detectLang() {
  // 1. URL path: /es/, /es ... → 'es'
  const path = location.pathname.split('/').filter(Boolean);
  if (path[0] && DICTS[path[0]]) return path[0];

  // 2. <html lang="..."> attribute
  const htmlLang = document.documentElement.lang?.split('-')[0]?.toLowerCase();
  if (htmlLang && DICTS[htmlLang]) return htmlLang;

  // 3. localStorage saved choice
  try {
    const saved = localStorage.getItem('spacecat:lang');
    if (saved && DICTS[saved]) return saved;
  } catch {}

  // 4. Browser language as a last resort
  const nav = navigator.language?.split('-')[0]?.toLowerCase();
  if (nav && DICTS[nav]) return nav;

  return DEFAULT_LANG;
}

export const currentLang = detectLang();
const dict = DICTS[currentLang] || DICTS[DEFAULT_LANG];

// Set <html lang> if it doesn't already match (helps SEO + screenreaders)
if (document.documentElement.lang?.split('-')[0]?.toLowerCase() !== currentLang) {
  document.documentElement.lang = currentLang;
}

// ── Translate a key with optional {var} interpolation ────────────────────
export function t(key, vars) {
  let s = dict[key] ?? DICTS[DEFAULT_LANG][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return s;
}

// ── Walk the DOM and replace tagged strings ──────────────────────────────
export function applyTranslations(root = document) {
  // Text content
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  // Attribute interpolation: data-i18n-attr="title:tip.copy" → title attr
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const specs = el.getAttribute('data-i18n-attr').split(',');
    for (const spec of specs) {
      const [attr, key] = spec.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });

  // aria-label shortcut
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
}

// ── Switch language: navigate to the URL prefix for the chosen lang ──────
export function switchLang(lang) {
  if (!DICTS[lang]) return;
  try { localStorage.setItem('spacecat:lang', lang); } catch {}

  // Preserve current page (e.g., /price/) when switching
  let path = location.pathname;
  // Strip current lang prefix
  for (const key of Object.keys(DICTS)) {
    if (key === DEFAULT_LANG) continue;
    if (path.startsWith(`/${key}/`) || path === `/${key}`) {
      path = path.replace(new RegExp(`^/${key}`), '') || '/';
      break;
    }
  }
  // Prefix with chosen lang (default = no prefix)
  const newPath = lang === DEFAULT_LANG ? path : `/${lang}${path}`;
  location.href = newPath;
}

// Auto-apply when DOM is ready (or immediately if already parsed)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => applyTranslations());
} else {
  applyTranslations();
}
