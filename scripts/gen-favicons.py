#!/usr/bin/env python3
"""Generate full favicon set themed for SpaceCat."""
from PIL import Image, ImageDraw, ImageFilter
import os

PUBLIC = "/Users/macmini/SpaceCat/public"
HERO = os.path.join(PUBLIC, "hero", "frame1.png")
os.makedirs(PUBLIC, exist_ok=True)

# ── Theme colors ────────────────────────────────────────────────────────────
BG_DARK    = (2, 2, 14, 255)
ACCENT     = (160, 100, 255, 255)   # purple
CYAN       = (64, 200, 224, 255)    # cyan
GOLD       = (224, 160, 32, 255)    # bitcoin gold

def make_cosmic_bg(size):
    """Circular cosmic background with radial gradient."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2
    r = size / 2

    # Radial gradient from center (lighter purple) → outer (deep navy)
    for i in range(int(r), 0, -1):
        t = 1 - (i / r)  # 0 at edge → 1 at center
        rr = int(20 + (90 * t))
        gg = int(10 + (35 * t))
        bb = int(50 + (170 * t))
        draw.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(rr, gg, bb, 255))

    # Outer ring (cyan glow)
    ring_w = max(2, size // 32)
    for i in range(ring_w):
        alpha = int(255 * (1 - i / ring_w))
        draw.ellipse(
            [i, i, size - 1 - i, size - 1 - i],
            outline=(64, 200, 224, alpha),
            width=1
        )

    # Tiny stars
    import random
    random.seed(42)
    for _ in range(max(2, size // 24)):
        sx, sy = random.uniform(0, size), random.uniform(0, size)
        # Only inside circle
        if (sx - cx) ** 2 + (sy - cy) ** 2 < (r - 4) ** 2:
            s = random.choice([1, 1, 1, 2])
            draw.ellipse([sx, sy, sx + s, sy + s], fill=(255, 255, 255, 220))

    return img

def make_favicon(size):
    """Compose a favicon at the given size."""
    bg = make_cosmic_bg(size)
    hero = Image.open(HERO).convert("RGBA")
    # Crop hero to head/torso (top 55%)
    hw, hh = hero.size
    head_crop = hero.crop((0, 0, hw, int(hh * 0.62)))
    # Scale hero to fit ~78% of canvas height
    target_h = int(size * 0.82)
    ratio = target_h / head_crop.size[1]
    target_w = int(head_crop.size[0] * ratio)
    head = head_crop.resize((target_w, target_h), Image.LANCZOS)
    # Center horizontally, anchor slightly above center
    paste_x = (size - target_w) // 2
    paste_y = int(size * 0.10)
    bg.paste(head, (paste_x, paste_y), head)

    # Mask to circle for clean edges
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(bg, (0, 0), mask)
    return out

# ── Generate all PNG sizes ──────────────────────────────────────────────────
SIZES = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "favicon-48x48.png": 48,
    "favicon-96x96.png": 96,
    "apple-touch-icon.png": 180,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
}

print("Generating favicons…")
for name, size in SIZES.items():
    img = make_favicon(size)
    path = os.path.join(PUBLIC, name)
    img.save(path, "PNG", optimize=True)
    print(f"  → {name} ({size}×{size})")

# ── Multi-resolution ICO ────────────────────────────────────────────────────
ico_sizes = [(16, 16), (32, 32), (48, 48)]
imgs = [make_favicon(s[0]) for s in ico_sizes]
imgs[0].save(
    os.path.join(PUBLIC, "favicon.ico"),
    format="ICO",
    sizes=ico_sizes,
    append_images=imgs[1:],
)
print("  → favicon.ico (16,32,48)")

# ── Updated SVG (themed, vector-only for sharpest small sizes) ──────────────
svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%"  stop-color="#5028b8"/>
      <stop offset="60%" stop-color="#1a0838"/>
      <stop offset="100%" stop-color="#02020e"/>
    </radialGradient>
    <linearGradient id="ear" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#a066ff"/>
      <stop offset="100%" stop-color="#6a44d4"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="1.4"/></filter>
  </defs>
  <!-- Cosmic disk -->
  <circle cx="32" cy="32" r="31" fill="url(#bg)"/>
  <!-- Cyan rim -->
  <circle cx="32" cy="32" r="30.5" fill="none" stroke="#40c8e0" stroke-width="1.2" opacity="0.9"/>
  <!-- Stars -->
  <circle cx="12" cy="14" r=".9" fill="#ffffff" opacity=".95"/>
  <circle cx="50" cy="18" r=".7" fill="#aaddff" opacity=".9"/>
  <circle cx="18" cy="46" r=".7" fill="#ffffff" opacity=".75"/>
  <circle cx="48" cy="50" r=".9" fill="#aaddff" opacity=".9"/>
  <!-- Cat ears -->
  <path d="M21 30 L24 20 L29 28 Z" fill="url(#ear)"/>
  <path d="M43 30 L40 20 L35 28 Z" fill="url(#ear)"/>
  <!-- Inner ear -->
  <path d="M23 28 L24.5 24 L27 27.5 Z" fill="#ffa6d4" opacity=".7"/>
  <path d="M41 28 L39.5 24 L37 27.5 Z" fill="#ffa6d4" opacity=".7"/>
  <!-- Helmet glass dome -->
  <ellipse cx="32" cy="38" rx="13" ry="12" fill="#0a0a1a" opacity=".55"/>
  <ellipse cx="32" cy="38" rx="13" ry="12" fill="none" stroke="#40c8e0" stroke-width="1.6"/>
  <!-- Eyes -->
  <circle cx="27.5" cy="37" r="1.8" fill="#f8c84d"/>
  <circle cx="36.5" cy="37" r="1.8" fill="#f8c84d"/>
  <circle cx="27.6" cy="36.6" r=".7" fill="#02020e"/>
  <circle cx="36.6" cy="36.6" r=".7" fill="#02020e"/>
  <!-- Nose + smile -->
  <path d="M31 41 L32 42 L33 41 Z" fill="#ff95b0"/>
  <path d="M30 43 Q32 45 34 43" stroke="#02020e" stroke-width="0.7" fill="none" stroke-linecap="round"/>
  <!-- Bitcoin badge -->
  <circle cx="32" cy="54" r="5.5" fill="#e0a020" stroke="#02020e" stroke-width=".6"/>
  <text x="32" y="56.6" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="7" fill="#ffffff">₿</text>
</svg>
"""

with open(os.path.join(PUBLIC, "favicon.svg"), "w") as f:
    f.write(svg)
print("  → favicon.svg (themed)")

print("Done.")
