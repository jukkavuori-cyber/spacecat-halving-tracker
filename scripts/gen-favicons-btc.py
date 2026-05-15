#!/usr/bin/env python3
"""Generate the favicon set from the official Bitcoin SVG using rsvg-convert.
Source: https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg
"""
import os, subprocess, io
from PIL import Image

PUBLIC = "/Users/macmini/SpaceCat/public"
SVG_PATH = os.path.join(PUBLIC, "favicon.svg")
RSVG = "/opt/homebrew/bin/rsvg-convert"

# Copy SVG to public/
with open("/tmp/btc.svg", "rb") as src, open(SVG_PATH, "wb") as dst:
    dst.write(src.read())
print(f"  → favicon.svg copied")

def render(size):
    out = subprocess.check_output([RSVG, "-w", str(size), "-h", str(size), SVG_PATH])
    return Image.open(io.BytesIO(out)).convert("RGBA")

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
    img = render(size)
    img.save(os.path.join(PUBLIC, name), "PNG", optimize=True)
    print(f"  → {name} ({size}×{size})")

ico_sizes = [(16, 16), (32, 32), (48, 48)]
imgs = [render(s[0]) for s in ico_sizes]
imgs[0].save(
    os.path.join(PUBLIC, "favicon.ico"),
    format="ICO", sizes=ico_sizes, append_images=imgs[1:],
)
print("  → favicon.ico (16,32,48)")

print("Done.")
