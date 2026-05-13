#!/usr/bin/env python3
"""Crop sprite sheet into 6 frames and remove background with rembg.
Preserves ear tips by painting over the number badge BEFORE cropping."""
from PIL import Image, ImageDraw
from rembg import remove
import io, os

SRC = "/Users/macmini/SpaceCat/public/ChatGPT Image 13.5.2026 klo 18.47.08.png"
OUT_DIR = "/Users/macmini/SpaceCat/public/hero"
os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
W, H = img.size
print(f"Source: {W}x{H}")

CW, CH = W // 3, H // 2

# Paint the number badge area (top-left of each cell) white so it disappears
# during background removal. This lets us keep a smaller TRIM_TOP and preserve
# ear tips.
draw = ImageDraw.Draw(img)
BADGE_W, BADGE_H = 78, 68   # generous area around the badge
for idx in range(6):
    col = idx % 3
    row = idx // 3
    x0 = col * CW
    y0 = row * CH
    draw.rectangle([x0, y0, x0 + BADGE_W, y0 + BADGE_H], fill=(255, 255, 255, 255))

# Also paint the LABEL strip at the bottom of each cell white
LABEL_H = 60
for idx in range(6):
    col = idx % 3
    row = idx // 3
    x0 = col * CW
    y1 = (row + 1) * CH
    draw.rectangle([x0, y1 - LABEL_H, x0 + CW, y1], fill=(255, 255, 255, 255))

# Crop with much less aggressive top trim to keep ear tips
TRIM_TOP, TRIM_BOTTOM, TRIM_SIDES = 18, 18, 18

for idx in range(6):
    col = idx % 3
    row = idx // 3
    left = col * CW + TRIM_SIDES
    upper = row * CH + TRIM_TOP
    right = (col + 1) * CW - TRIM_SIDES
    lower = (row + 1) * CH - TRIM_BOTTOM
    frame = img.crop((left, upper, right, lower))

    # AI background removal
    buf = io.BytesIO()
    frame.save(buf, format="PNG")
    out_bytes = remove(buf.getvalue())
    result = Image.open(io.BytesIO(out_bytes))

    # Auto-crop to content bbox
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)

    out = os.path.join(OUT_DIR, f"frame{idx+1}.png")
    result.save(out, "PNG", optimize=True)
    print(f"  → frame{idx+1}.png ({result.size[0]}×{result.size[1]})")

print("Done.")
