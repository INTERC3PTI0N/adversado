/**
 * Placeholder brand lockups for the Gallery Tunnel's walls, drawn to canvas at
 * runtime rather than fetched.
 *
 * The tunnel is a gallery, and a gallery of flat squares reads as nothing at
 * all at speed — the eye needs to catch *something* on each wall for the ride
 * to feel like it's passing work rather than passing wallpaper. So each tile is
 * a mark plus a wordmark plus a line of small type, the shape of a brand page,
 * in invented names. Generating them here means no network dependency and no
 * question about whose logo is on the wall.
 *
 * The names are deliberately fake. Anything recognisable would read as a client
 * claim the site can't back up.
 */

const NAMES = [
  "NOVARA", "HELIOS", "AXIOM", "VERTA", "LUMEN", "ORBIS",
  "KESTREL", "SOLARIS", "MERIDIAN", "ATLAS", "VANTA", "CIRRUS",
  "OBSIDIAN", "PRAXIS", "AURELIA", "NIMBUS",
];

/** Lorem-ipsum-ish strap lines — long enough to read as type, short enough to
 * stay legible at the size a tunnel wall actually gets seen at. */
const STRAPS = [
  "STRATEGY · IDENTITY", "BRAND SYSTEM", "END TO END", "CAMPAIGN",
  "DIGITAL · FILM", "REBRAND 2024", "PACKAGING", "ART DIRECTION",
];

/** Brand palette, plus two supporting tones so consecutive walls don't repeat. */
const FIELDS = [
  { bg: "#0b1524", ink: "#e6b325", sub: "#f9f7f2" },
  { bg: "#e6b325", ink: "#0b1524", sub: "#1f355e" },
  { bg: "#1f355e", ink: "#f9f7f2", sub: "#e6b325" },
  { bg: "#f9f7f2", ink: "#1f355e", sub: "#2b6cff" },
  { bg: "#2b6cff", ink: "#f9f7f2", sub: "#0b1524" },
  { bg: "#12101a", ink: "#f9f7f2", sub: "#e6b325" },
];

/** Deterministic per-tile PRNG — the same index always draws the same tile, so
 * a re-render doesn't reshuffle the walls mid-ride. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The mark above the wordmark. Four flat geometric forms rather than anything
 * illustrative — at tunnel speed a silhouette is all that survives. */
function drawMark(
  ctx: CanvasRenderingContext2D,
  kind: number,
  cx: number,
  cy: number,
  r: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  switch (kind % 4) {
    case 0: // ring
      ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 1: // triangle
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.92, cy + r * 0.7);
      ctx.lineTo(cx - r * 0.92, cy + r * 0.7);
      ctx.closePath();
      ctx.fill();
      break;
    case 2: // stacked bars
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(cx - r, cy - r + i * r * 0.78, r * 2 * (1 - i * 0.22), r * 0.44);
      }
      break;
    default: // diamond
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
  }
}

/** Letter-spaced centred text — `letterSpacing` on a 2D context isn't reliable
 * across browsers, so the advance is walked by hand. */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  tracking: number
) {
  const chars = [...text];
  const width =
    chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + Math.max(0, chars.length - 1) * tracking;
  let x = cx - width / 2;
  for (const c of chars) {
    ctx.fillText(c, x, y);
    x += ctx.measureText(c).width + tracking;
  }
}

export function generateBrandTiles(count = 10, size = 512): string[] {
  const urls: string[] = [];

  for (let i = 0; i < count; i++) {
    // A fresh canvas per tile: toDataURL is synchronous, but reusing one canvas
    // means every tile inherits whatever the last one left in the alpha channel
    // on fields that don't fully repaint.
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    const rand = mulberry32(i * 977 + 13);
    const field = FIELDS[i % FIELDS.length];
    const name = NAMES[i % NAMES.length];
    const strap = STRAPS[i % STRAPS.length];

    ctx.fillStyle = field.bg;
    ctx.fillRect(0, 0, size, size);

    // A soft off-centre wash, so a wall isn't a dead flat colour under the
    // tunnel's own lighting.
    const g = ctx.createRadialGradient(
      size * (0.3 + rand() * 0.4),
      size * 0.3,
      0,
      size * 0.5,
      size * 0.5,
      size * 0.8
    );
    g.addColorStop(0, "rgba(255,255,255,0.10)");
    g.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // Hairline frame — reads as a mounted plate rather than a painted wall.
    ctx.strokeStyle = field.ink;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = size * 0.008;
    ctx.strokeRect(size * 0.07, size * 0.07, size * 0.86, size * 0.86);
    ctx.globalAlpha = 1;

    drawMark(ctx, i, size * 0.5, size * 0.37, size * 0.1, field.ink);

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    ctx.fillStyle = field.ink;
    ctx.font = `800 ${Math.round(size * 0.105)}px Montserrat, Arial, sans-serif`;
    drawTracked(ctx, name, size * 0.5, size * 0.6, size * 0.012);

    ctx.fillStyle = field.sub;
    ctx.globalAlpha = 0.8;
    ctx.font = `500 ${Math.round(size * 0.038)}px Montserrat, Arial, sans-serif`;
    drawTracked(ctx, strap, size * 0.5, size * 0.71, size * 0.014);
    ctx.globalAlpha = 1;

    // Rule and a case-study number, to give the plate somewhere to end.
    ctx.strokeStyle = field.sub;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = size * 0.004;
    ctx.beginPath();
    ctx.moveTo(size * 0.36, size * 0.79);
    ctx.lineTo(size * 0.64, size * 0.79);
    ctx.stroke();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = field.sub;
    ctx.font = `600 ${Math.round(size * 0.032)}px Montserrat, Arial, sans-serif`;
    drawTracked(ctx, `NO. ${String(i + 1).padStart(2, "0")}`, size * 0.5, size * 0.855, size * 0.02);
    ctx.globalAlpha = 1;

    urls.push(canvas.toDataURL("image/jpeg", 0.86));
  }

  return urls;
}
