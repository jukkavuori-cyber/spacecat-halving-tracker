#!/usr/bin/env python3
"""Hybrid favicon set:
- Small sizes (16/32/48 + favicon.ico) use the simpler character (19.03 image)
- Large favicons (96/180/192/512) use the detailed astronaut (18.47 image)
- logo.png uses the simpler character (latest upload, matches what's on page header)"""
from PIL import Image, ImageDraw
import os

PUBLIC = "/Users/macmini/SpaceCat/public"
SRC_BTC      = os.path.join(PUBLIC, "ChatGPT Image 14.5.2026 klo 19.28.42.png")  # for small favicons
SRC_SIMPLE   = os.path.join(PUBLIC, "ChatGPT Image 14.5.2026 klo 19.03.16.png")  # logo + small fallback
SRC_DETAILED = os.path.join(PUBLIC, "ChatGPT Image 14.5.2026 klo 18.47.08.png")  # large favicons

def remove_white(im, threshold=220, soft=30):
    pix = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                pix[x, y] = (r, g, b, 0)
            elif r >= threshold - soft and g >= threshold - soft and b >= threshold - soft:
                avg = (r + g + b) / 3
                frac = (threshold - avg) / soft
                pix[x, y] = (r, g, b, int(a * frac))
    return im

def tight_bbox(im, alpha_threshold=120):
    """Find the bbox of pixels whose alpha is at least the threshold.
    Avoids faint sparkles/glow from inflating the bbox."""
    a = im.split()[3]  # alpha channel
    # Build a binary mask of "strong" pixels
    mask = a.point(lambda v: 255 if v >= alpha_threshold else 0)
    return mask.getbbox()

def prep_transparent(src_path):
    """Scrub near-white bg, find tight bbox of the main subject, pad to square."""
    im = Image.open(src_path).convert("RGBA")
    work = im.copy()
    work.thumbnail((1024, 1024), Image.LANCZOS)
    work = remove_white(work)

    bbox = tight_bbox(work, alpha_threshold=140)
    if bbox:
        # Add small breathing room around the tight bbox
        pad = int(min(work.size) * 0.02)
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(work.size[0], bbox[2] + pad),
            min(work.size[1], bbox[3] + pad),
        )
        work = work.crop(bbox)

    w, h = work.size
    side = max(w, h)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(work, ((side - w) // 2, (side - h) // 2), work)
    return square

def prep_center_crop(src_path):
    """Center-crop to square (keeps backdrop, no padding)."""
    im = Image.open(src_path).convert("RGBA")
    work = im.copy()
    work.thumbnail((1024, 1024), Image.LANCZOS)
    w, h = work.size
    side = min(w, h)
    left = (w - side) // 2
    top  = (h - side) // 2
    return work.crop((left, top, left + side, top + side))

def to_circle(img, size):
    img = img.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out

def on_cosmic_disc(character_img, size):
    """Render the character on a dark cosmic disc with cyan rim — readable on
    both light and dark browser tab backgrounds (Chrome, Brave, Safari, etc.)."""
    # Render at 4x for crisp edges, then downscale
    SS = 4
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = s / 2, s / 2
    r = s / 2 - 1

    # Radial gradient: purple center → deep navy edge
    for i in range(int(r), 0, -1):
        t = 1 - (i / r)
        rr = int(20 + 90 * t)
        gg = int(8  + 30 * t)
        bb = int(50 + 180 * t)
        draw.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(rr, gg, bb, 255))

    # Cyan rim
    rim_w = max(SS, s // 32)
    for i in range(rim_w):
        a = int(255 * (1 - i / rim_w))
        draw.ellipse([i, i, s - 1 - i, s - 1 - i],
                     outline=(64, 200, 224, a), width=SS)

    # Resize character to fit inside the disc (~84% of size) and paste centered
    char_size = int(s * 0.86)
    ch = character_img.resize((char_size, char_size), Image.LANCZOS)
    offset = (s - char_size) // 2
    img.paste(ch, (offset, offset), ch)

    # Mask to circle so the character doesn't bleed past the rim
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, s, s], fill=255)
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)

    return out.resize((size, size), Image.LANCZOS)

print("Preparing sources…")
btc_sq      = prep_transparent(SRC_BTC)
simple_sq   = prep_transparent(SRC_SIMPLE)
detailed_sq = prep_center_crop(SRC_DETAILED)

# ── SMALL favicons (BTC logo — readable at 16px in Chrome) ─────────────
print("Small (BTC logo):")
for name, size in [
    ("favicon-16x16.png", 16),
    ("favicon-32x32.png", 32),
    ("favicon-48x48.png", 48),
]:
    out = btc_sq.resize((size, size), Image.LANCZOS)
    out.save(os.path.join(PUBLIC, name), "PNG", optimize=True)
    print(f"  → {name} ({size}×{size})")

ico_sizes = [(16, 16), (32, 32), (48, 48)]
imgs = [btc_sq.resize(s, Image.LANCZOS) for s in ico_sizes]
imgs[0].save(
    os.path.join(PUBLIC, "favicon.ico"),
    format="ICO", sizes=ico_sizes, append_images=imgs[1:],
)
print("  → favicon.ico (16,32,48)")

# ── LARGE favicons (detailed astronaut, circular) ──────────────────────
print("Large (detailed astronaut):")
for name, size in [
    ("favicon-96x96.png", 96),
    ("apple-touch-icon.png", 180),
    ("android-chrome-192x192.png", 192),
    ("android-chrome-512x512.png", 512),
]:
    out = to_circle(detailed_sq, size)
    out.save(os.path.join(PUBLIC, name), "PNG", optimize=True)
    print(f"  → {name} ({size}×{size})")

# ── Logo (page header) — use the SIMPLE character (latest upload) ──────
logo = simple_sq.resize((512, 512), Image.LANCZOS)
logo.save(os.path.join(PUBLIC, "logo.png"), "PNG", optimize=True)
print("  → logo.png (512×512, simple character, transparent bg)")

print("Done.")
