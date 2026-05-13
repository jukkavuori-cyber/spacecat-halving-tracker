#!/usr/bin/env python3
"""Crop sprite sheet into 6 frames and remove background with rembg."""
from PIL import Image
from rembg import remove
import io, os

SRC = "/Users/macmini/SpaceCat/public/ChatGPT Image 13.5.2026 klo 18.47.08.png"
OUT_DIR = "/Users/macmini/SpaceCat/public/hero"
os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
W, H = img.size
print(f"Source: {W}x{H}")

CW, CH = W // 3, H // 2
TRIM_TOP, TRIM_BOTTOM, TRIM_SIDES = 70, 80, 30

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
