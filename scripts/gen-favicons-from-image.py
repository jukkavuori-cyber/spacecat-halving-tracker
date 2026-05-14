#!/usr/bin/env python3
"""Generate full favicon set from the simpler character logo.
Auto-crops to the cat's bounding box, removes the off-white background,
then renders 16/32/48/96/180/192/512 + favicon.ico."""
from PIL import Image, ImageDraw
import os

PUBLIC = "/Users/macmini/SpaceCat/public"
SRC = os.path.join(PUBLIC, "ChatGPT Image 14.5.2026 klo 19.03.16.png")

src = Image.open(SRC).convert("RGBA")
sw, sh = src.size
print(f"Source: {sw}x{sh}")

# ── Remove near-white background (the image has a white halo) ────────────
def remove_white(im, threshold=240, soft=20):
    pix = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                pix[x, y] = (r, g, b, 0)
            elif r >= threshold - soft and g >= threshold - soft and b >= threshold - soft:
                # soft fade for near-white edges
                avg = (r + g + b) / 3
                frac = (threshold - avg) / soft
                pix[x, y] = (r, g, b, int(a * frac))
    return im

# To keep it fast, downscale first then clean
work = src.copy()
work.thumbnail((900, 900), Image.LANCZOS)
work = remove_white(work, threshold=240, soft=15)

# Auto-crop to non-transparent bbox
bbox = work.getbbox()
if bbox:
    work = work.crop(bbox)

# Pad to square (centered)
cw, ch = work.size
side = max(cw, ch)
pad_x = (side - cw) // 2
pad_y = (side - ch) // 2
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(work, (pad_x, pad_y), work)

# ── Generate PNG sizes ──────────────────────────────────────────────────
def make_size(size):
    return square.resize((size, size), Image.LANCZOS)

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
    img = make_size(size)
    img.save(os.path.join(PUBLIC, name), "PNG", optimize=True)
    print(f"  → {name} ({size}×{size})")

# Multi-resolution ICO
ico_sizes = [(16, 16), (32, 32), (48, 48)]
imgs = [make_size(s[0]) for s in ico_sizes]
imgs[0].save(
    os.path.join(PUBLIC, "favicon.ico"),
    format="ICO",
    sizes=ico_sizes,
    append_images=imgs[1:],
)
print("  → favicon.ico (16,32,48)")

# Also refresh logo.png with a clean 512px
logo = make_size(512)
logo.save(os.path.join(PUBLIC, "logo.png"), "PNG", optimize=True)
print("  → logo.png (512×512)")

print("Done.")
