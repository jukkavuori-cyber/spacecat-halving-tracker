#!/usr/bin/env python3
"""Hybrid favicon set:
- Small sizes (16/32/48 + favicon.ico) use the simpler character (19.03 image)
  → cleaner shape, readable at tiny sizes.
- Large sizes (96/180/192/512 + logo.png) use the detailed astronaut (18.47 image)
  → impressive at big sizes and as the page-header logo."""
from PIL import Image, ImageDraw
import os

PUBLIC = "/Users/macmini/SpaceCat/public"
SRC_SMALL = os.path.join(PUBLIC, "ChatGPT Image 14.5.2026 klo 19.03.16.png")
SRC_LARGE = os.path.join(PUBLIC, "ChatGPT Image 14.5.2026 klo 18.47.08.png")

def remove_white(im, threshold=240, soft=15):
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

def prep(src_path, scrub_bg=True):
    """Simple character → scrub white bg, bbox-crop, pad to square (preserves
    full character with transparent bg).
    Detailed astronaut → center-crop to a square focused on the character
    (keeps the original dark cosmic backdrop)."""
    im = Image.open(src_path).convert("RGBA")
    work = im.copy()
    work.thumbnail((1024, 1024), Image.LANCZOS)

    if scrub_bg:
        work = remove_white(work)
        bbox = work.getbbox()
        if bbox:
            work = work.crop(bbox)
        w, h = work.size
        side = max(w, h)
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        square.paste(work, ((side - w) // 2, (side - h) // 2), work)
        return square

    # Detailed astronaut path: center-crop to square (no padding)
    w, h = work.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return work.crop((left, top, left + side, top + side))

def to_circle(img, size):
    img = img.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out

# ── Prepare both source images ─────────────────────────────────────────
print("Preparing sources…")
small_sq = prep(SRC_SMALL, scrub_bg=True)
large_sq = prep(SRC_LARGE, scrub_bg=False)  # original already has dark bg gradient

# ── SMALL favicons: use the simpler character image ─────────────────────
print("Small (simpler character):")
for name, size in [
    ("favicon-16x16.png", 16),
    ("favicon-32x32.png", 32),
    ("favicon-48x48.png", 48),
]:
    out = small_sq.resize((size, size), Image.LANCZOS)
    out.save(os.path.join(PUBLIC, name), "PNG", optimize=True)
    print(f"  → {name} ({size}×{size})")

ico_sizes = [(16, 16), (32, 32), (48, 48)]
imgs = [small_sq.resize(s, Image.LANCZOS) for s in ico_sizes]
imgs[0].save(
    os.path.join(PUBLIC, "favicon.ico"),
    format="ICO", sizes=ico_sizes, append_images=imgs[1:],
)
print("  → favicon.ico (16,32,48)")

# ── LARGE favicons: use the detailed astronaut image ────────────────────
print("Large (detailed astronaut):")
for name, size in [
    ("favicon-96x96.png", 96),
    ("apple-touch-icon.png", 180),
    ("android-chrome-192x192.png", 192),
    ("android-chrome-512x512.png", 512),
]:
    out = to_circle(large_sq, size)
    out.save(os.path.join(PUBLIC, name), "PNG", optimize=True)
    print(f"  → {name} ({size}×{size})")

# Logo.png — keep as detailed astronaut square (not circular) for header
logo = large_sq.resize((512, 512), Image.LANCZOS)
logo.save(os.path.join(PUBLIC, "logo.png"), "PNG", optimize=True)
print("  → logo.png (512×512, square)")

print("Done.")
