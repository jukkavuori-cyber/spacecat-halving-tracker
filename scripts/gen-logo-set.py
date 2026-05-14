#!/usr/bin/env python3
"""Generate logo + large favicons from the new SpaceCat hero image.
- /public/logo.png : 512px square (header use, retina)
- 96/180/192/512 favicons: replaced with the new logo
- 16/32/48 favicons: kept as the simple gold ₿ disc (legibility)
"""
from PIL import Image, ImageDraw
import os

PUBLIC = "/Users/macmini/SpaceCat/public"
SRC = os.path.join(PUBLIC, "ChatGPT Image 14.5.2026 klo 18.47.08.png")

src = Image.open(SRC).convert("RGBA")
sw, sh = src.size
print(f"Source: {sw}x{sh}")

# Crop to a square focused on the cat character.
# The character sits roughly centered horizontally, slightly above middle vertically.
# Use the smaller of width/height; bias the y-anchor up slightly.
size = min(sw, sh)
left = (sw - size) // 2
top  = max(0, (sh - size) // 2 - int(size * 0.02))
square = src.crop((left, top, left + size, top + size))

# Round-mask to a circle for non-rectangular favicon use (PNGs look better
# when they're not surrounded by a hard rectangle on light tab backgrounds).
def make_circular(img, size):
    img = img.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out

# 1) Logo for header (square, kept rectangular — looks good as-is)
logo = square.resize((512, 512), Image.LANCZOS)
logo.save(os.path.join(PUBLIC, "logo.png"), "PNG", optimize=True)
print("  → logo.png (512×512)")

# 2) Replace large favicons with the rounded logo
for name, sz in [
    ("favicon-96x96.png", 96),
    ("apple-touch-icon.png", 180),
    ("android-chrome-192x192.png", 192),
    ("android-chrome-512x512.png", 512),
]:
    out = make_circular(square, sz)
    out.save(os.path.join(PUBLIC, name), "PNG", optimize=True)
    print(f"  → {name} ({sz}×{sz})")

print("Done. (16/32/48 favicons + favicon.ico are unchanged.)")
