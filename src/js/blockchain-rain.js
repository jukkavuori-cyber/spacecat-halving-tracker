// Ambient "blockchain rain" — falling hex characters on the right edge.
// Inspired by Matrix rain, themed for Bitcoin (hex digits + ₿).

const CHARS = '0123456789abcdef'.split('');
const BTC = '₿';

export function startBlockchainRain() {
  if (window.innerWidth < 1380) return null;

  const canvas = document.createElement('canvas');
  canvas.id = 'blockchainRain';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    width: '140px',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '1',
    opacity: '0.85',
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const FONT_SIZE = 14;

  let W, H, COLS, trails;

  function resize() {
    W = canvas.offsetWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.font = `bold ${FONT_SIZE}px "Space Mono", monospace`;
    ctx.textBaseline = 'top';

    COLS = Math.floor(W / FONT_SIZE);
    trails = new Array(COLS).fill(0).map((_, i) => makeTrail(i, true));
  }

  function makeTrail(col, firstSpawn = false) {
    return {
      x: col * FONT_SIZE + 2,
      // First spawn: scatter across the full height so columns fill immediately.
      // Respawn: start above viewport so we see the head emerge.
      y: firstSpawn ? Math.random() * H : -Math.random() * 200 - 20,
      speed: 0.9 + Math.random() * 1.4, // px per frame ≈ 54-138 px/s
      length: 10 + Math.floor(Math.random() * 16),
      chars: [],
      gold: Math.random() < 0.22,
    };
  }

  function randChar() {
    return Math.random() < 0.06 ? BTC : CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  let raf = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H); // fully transparent each frame

    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];

      // Advance head
      t.y += t.speed;

      // Append new char when head moves to a new cell
      const headCell = Math.floor(t.y / FONT_SIZE);
      if (t.chars.length === 0 || t.chars[0].cell !== headCell) {
        t.chars.unshift({ cell: headCell, ch: randChar() });
        if (t.chars.length > t.length) t.chars.pop();
      }

      // Reset trail when fully off-screen
      const tailCell = headCell - t.length;
      if (tailCell * FONT_SIZE > H) {
        trails[i] = makeTrail(i);
        continue;
      }

      // Draw chars (head at index 0, brightest)
      for (let j = 0; j < t.chars.length; j++) {
        const y = t.chars[j].cell * FONT_SIZE;
        if (y < -FONT_SIZE || y > H) continue;

        const tNorm = 1 - j / t.length; // 1.0 head → 0 tail
        if (j === 0) {
          ctx.fillStyle = `rgba(245, 250, 255, 0.98)`;
        } else if (t.gold) {
          ctx.fillStyle = `rgba(230, 180, 60, ${0.15 + 0.6 * tNorm})`;
        } else {
          ctx.fillStyle = `rgba(110, 220, 240, ${0.15 + 0.55 * tNorm})`;
        }
        ctx.fillText(t.chars[j].ch, t.x, y);
      }

      // Occasionally refresh the head character
      if (Math.random() < 0.15 && t.chars[0]) {
        t.chars[0].ch = randChar();
      }
    }

    raf = requestAnimationFrame(draw);
  }

  resize();
  draw();

  let resizeTO;
  const onResize = () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      if (window.innerWidth < 1380) {
        cancelAnimationFrame(raf);
        canvas.remove();
        window.removeEventListener('resize', onResize);
        return;
      }
      resize();
    }, 200);
  };
  window.addEventListener('resize', onResize);

  return () => { cancelAnimationFrame(raf); canvas.remove(); };
}
