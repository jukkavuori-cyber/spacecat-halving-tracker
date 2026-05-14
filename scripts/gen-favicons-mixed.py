#!/usr/bin/env python3
"""Hybrid favicon set:
- Small sizes (16/32/48 + favicon.ico) use the simpler character (19.03 image)
- Large favicons (96/180/192/512) use the detailed astronaut (18.47 image)
- logo.png uses the simpler character (latest upload, matches what's on page header)"""
from PIL import Image, ImageDraw
import os

PUBLIC = "/Users/macmini/SpaceCat/public"
SRC_SIMPLE   = os.path.join(PUBLIC, "ChatGPT Image 14.5.2026 klo 19.03.16.png")
SRC_DETAILED = os.path.join(PUBLIC, "ChatGPT Image 14.5.2026 klo 18.47.08.png")

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

print("Preparing sources…")
simple_sq   = prep_transparent(SRC_SIMPLE)
detailed_sq = prep_center_crop(SRC_DETAILED)

# ── SMALL favicons (simple character) ──────────────────────────────────
print("Small (simple character):")
for name, size in [
    ("favicon-16x16.png", 16),
    ("favicon-32x32.png", 32),
    ("favicon-48x48.png", 48),
]:
    out = simple_sq.resize((size, size), Image.LANCZOS)
    out.save(os.path.join(PUBLIC, name), "PNG", optimize=True)
    print(f"  → {name} ({size}×{size})")

ico_sizes = [(16, 16), (32, 32), (48, 48)]
imgs = [simple_sq.resize(s, Image.LANCZOS) for s in ico_sizes]
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
