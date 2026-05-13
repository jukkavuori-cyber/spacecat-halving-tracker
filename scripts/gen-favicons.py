#!/usr/bin/env python3
"""Generate full favicon set.
Simple, high-contrast design that stays readable at 16x16."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math

PUBLIC = "/Users/macmini/SpaceCat/public"
os.makedirs(PUBLIC, exist_ok=True)

# Try to find a bold font that supports ₿
FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Black.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial Black.ttf",
]
def draw_btc_symbol(draw_canvas, img, cx, cy, size, color):
    """Draw a ₿ symbol centered at (cx, cy) using a font-rendered 'B' + two
    extending vertical strokes (the ₿ tells) on top and bottom.
    Font-independent: works even when the system font lacks U+20BF."""
    # Pick best available font that renders a clean bold B
    font_size = int(size * 1.1)
    font = find_font(font_size)

    # Use the regular B letter (always available)
    text = "B"
    bbox = draw_canvas.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2 - bbox[0]
    ty = cy - th / 2 - bbox[1]
    draw_canvas.text((tx, ty), text, font=font, fill=color)

    # Add two vertical strokes top and bottom (turning B → ₿)
    # Stroke widths/positions calibrated to look natural with bold B
    bar_w = max(2, size * 0.07)
    bar_h = size * 0.18
    # The two strokes should be inside the width of the B, near the left vertical
    bar_x1 = cx - size * 0.20
    bar_x2 = cx - size * 0.02
    # Top
    draw_canvas.rectangle([bar_x1 - bar_w / 2, cy - size / 2 - bar_h * 0.55,
                            bar_x1 + bar_w / 2, cy - size / 2 + bar_h * 0.45], fill=color)
    draw_canvas.rectangle([bar_x2 - bar_w / 2, cy - size / 2 - bar_h * 0.55,
                            bar_x2 + bar_w / 2, cy - size / 2 + bar_h * 0.45], fill=color)
    # Bottom
    draw_canvas.rectangle([bar_x1 - bar_w / 2, cy + size / 2 - bar_h * 0.45,
                            bar_x1 + bar_w / 2, cy + size / 2 + bar_h * 0.55], fill=color)
    draw_canvas.rectangle([bar_x2 - bar_w / 2, cy + size / 2 - bar_h * 0.45,
                            bar_x2 + bar_w / 2, cy + size / 2 + bar_h * 0.55], fill=color)


def find_font(size):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

def make_favicon(size):
    """Render the simple SpaceCat favicon at the given pixel size."""
    # Render at 4x then downscale for crisp edges
    SS = 4
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = s / 2, s / 2
    r = s / 2 - 1

    # Cosmic gradient disc
    for i in range(int(r), 0, -1):
        t = 1 - (i / r)
        # purple center → deep navy edge
        rr = int(20 + 90 * t)
        gg = int(8 + 30 * t)
        bb = int(50 + 180 * t)
        draw.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(rr, gg, bb, 255))

    # Cyan rim
    rim_w = max(SS, s // 32)
    for i in range(rim_w):
        a = int(255 * (1 - i / rim_w))
        draw.ellipse(
            [i, i, s - 1 - i, s - 1 - i],
            outline=(64, 200, 224, a),
            width=SS,
        )

    # BOLD cat ears — left & right triangles at top
    # Scale ear coordinates from 64x64 SVG viewBox
    def scale(p):
        x, y = p
        return (x / 64 * s, y / 64 * s)

    left_ear  = [scale((16, 22)), scale((23, 6)),  scale((30, 22))]
    right_ear = [scale((48, 22)), scale((41, 6)),  scale((34, 22))]
    for tri in (left_ear, right_ear):
        draw.polygon(tri, fill=(10, 10, 26, 255), outline=(64, 200, 224, 255))

    # Bitcoin disc (gold)
    bc_cx, bc_cy = scale((32, 36))
    bc_r = (16 / 64) * s
    # Gold gradient via two ellipses with mask
    gold_top, gold_bot = (255, 211, 90), (214, 138, 24)
    for i in range(int(bc_r), 0, -1):
        t = i / bc_r
        rr = int(gold_top[0] * t + gold_bot[0] * (1 - t))
        gg = int(gold_top[1] * t + gold_bot[1] * (1 - t))
        bbc = int(gold_top[2] * t + gold_bot[2] * (1 - t))
        y_offset = (bc_r - i) * .6
        draw.ellipse(
            [bc_cx - i, bc_cy - i + y_offset * .5, bc_cx + i, bc_cy + i + y_offset * .5],
            fill=(rr, gg, bbc, 255),
        )
    # Disc outline
    draw.ellipse(
        [bc_cx - bc_r, bc_cy - bc_r, bc_cx + bc_r, bc_cy + bc_r],
        outline=(10, 10, 26, 255), width=max(SS, int(bc_r * 0.06)),
    )

    # Bitcoin ₿ symbol — font B + manual vertical strokes
    draw_btc_symbol(draw, img, bc_cx, bc_cy, bc_r * 1.2, (10, 10, 26, 255))

    # Downscale with antialiasing
    out = img.resize((size, size), Image.LANCZOS)
    return out

# ── Generate all sizes ──────────────────────────────────────────────────────
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

# Multi-resolution ICO
ico_sizes = [(16, 16), (32, 32), (48, 48)]
imgs = [make_favicon(s[0]) for s in ico_sizes]
imgs[0].save(
    os.path.join(PUBLIC, "favicon.ico"),
    format="ICO",
    sizes=ico_sizes,
    append_images=imgs[1:],
)
print("  → favicon.ico (16,32,48)")

print("Done.")
