/**
 * Adaptive colour palettes.
 *
 * Every movie / TV page samples its own artwork and tints the whole page with
 * the colours found in that poster, so two titles never look the same.
 */

const cache = new Map();
const SAMPLES = 96;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

const hex = ([r, g, b]) =>
  `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;

const triple = ([r, g, b]) => `${clamp(Math.round(r), 0, 255)} ${clamp(Math.round(g), 0, 255)} ${clamp(Math.round(b), 0, 255)}`;

function hslTriple(h, s, l) {
  return triple(hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1)));
}

/** Vivid, legible version of a sampled colour. */
function tune(h, s, l, { light = 0, sat = 0 } = {}) {
  return {
    h,
    s: clamp(s + sat, 0.4, 0.86),
    l: clamp(l + light, 0.48, 0.63),
  };
}

function samplePixels(image) {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLES;
  canvas.height = Math.round(SAMPLES * 1.45);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const { width, height } = canvas;
  const ratio = Math.max(width / image.width, height / image.height);
  const dw = image.width * ratio;
  const dh = image.height * ratio;
  ctx.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh);

  let data;
  try {
    data = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return null; // tainted canvas (image without CORS headers)
  }

  const buckets = new Map();
  const neutral = { r: 0, g: 0, b: 0, n: 0 };

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 180) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 26 || min > 238) continue; // near-black / near-white

    const [h, s, l] = rgbToHsl(r, g, b);
    if (l < 0.12 || l > 0.94) continue;

    // Keep a neutral average so black-and-white artwork still gets its own
    // (muted) tint instead of falling back to the site default.
    neutral.r += r;
    neutral.g += g;
    neutral.b += b;
    neutral.n += 1;

    if (s < 0.12) continue; // washed-out pixels

    const key = Math.round(h / 15) % 24;
    const weight =
      1 + s * 2.4 + (l > 0.3 && l < 0.72 ? 0.9 : 0) + (max / 255) * 0.4;
    const bucket = buckets.get(key) || { weight: 0, r: 0, g: 0, b: 0, h: 0, s: 0, l: 0, n: 0 };
    bucket.weight += weight;
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
    bucket.h += h * weight;
    bucket.s += s * weight;
    bucket.l += l * weight;
    bucket.n += weight;
    buckets.set(key, bucket);
  }

  if (!buckets.size && neutral.n) {
    const avg = [neutral.r / neutral.n, neutral.g / neutral.n, neutral.b / neutral.n];
    const [h, s, l] = rgbToHsl(...avg);
    return [
      {
        weight: 1,
        h,
        s: Math.max(s, 0.26),
        l: clamp(l, 0.42, 0.7),
        rgb: avg,
      },
    ];
  }

  return [...buckets.values()]
    .map((b) => ({
      weight: b.weight,
      h: b.h / b.n,
      s: b.s / b.n,
      l: b.l / b.n,
      rgb: [b.r / b.n, b.g / b.n, b.b / b.n],
    }))
    .sort((a, b) => b.weight - a.weight);
}

const hueDistance = (a, b) => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

function buildPalette(image) {
  const buckets = samplePixels(image);
  if (!buckets || !buckets.length) return null;

  // Pick well-separated hues, strongest first, so the page gets a real mix.
  const picked = [];
  for (const bucket of buckets) {
    if (picked.length >= 4) break;
    if (picked.every((p) => hueDistance(p.h, bucket.h) > 26)) picked.push(bucket);
  }
  while (picked.length < 4) {
    const base = picked[0] || buckets[0];
    // Generated accents must also stay clear of hues we already picked.
    const offsets = [26, -32, 62, -68, 120, -140, 180];
    const chosen =
      offsets
        .map((o) => ((base.h + o) % 360 + 360) % 360)
        .find((hue) => picked.every((p) => hueDistance(p.h, hue) > 22)) ??
      ((base.h + offsets[picked.length % offsets.length]) % 360 + 360) % 360;
    picked.push({
      h: chosen,
      s: clamp(base.s * 0.85, 0.4, 0.85),
      l: clamp(base.l + (picked.length % 2 ? 0.05 : -0.03), 0.48, 0.64),
      rgb: hslToRgb(chosen, base.s, base.l),
    });
  }

  const [p1, p2, p3, p4] = picked;

  const primary = tune(p1.h, p1.s, p1.l, { light: 0.02, sat: 0.12 });
  const secondary = tune(p2.h, p2.s, p2.l, { light: 0.04, sat: 0.08 });
  const tertiary = tune(p3.h, p3.s, p3.l, { light: 0.05, sat: 0.06 });
  const quaternary = tune(p4.h, p4.s, p4.l, { light: 0.03, sat: 0.06 });

  return {
    // sorted by prominence, for gradient text / mesh layers
    colors: [primary, secondary, tertiary, quaternary].map(
      (c) => `rgb(${hslTriple(c.h, c.s, c.l)})`
    ),
    tokens: {
      '--brand': hslTriple(primary.h, primary.s, primary.l),
      '--brand-400': hslTriple(primary.h, primary.s * 0.92, primary.l + 0.1),
      '--brand-600': hslTriple(primary.h, primary.s, primary.l - 0.1),
      '--accent-2': hslTriple(secondary.h, secondary.s, secondary.l),
      '--accent-3': hslTriple(tertiary.h, tertiary.s, tertiary.l),
      '--accent-4': hslTriple(quaternary.h, quaternary.s, quaternary.l),
    },
    hex: {
      primary: hex(hslToRgb(primary.h, primary.s, primary.l)),
      secondary: hex(hslToRgb(secondary.h, secondary.s, secondary.l)),
      tertiary: hex(hslToRgb(tertiary.h, tertiary.s, tertiary.l)),
      quaternary: hex(hslToRgb(quaternary.h, quaternary.s, quaternary.l)),
    },
  };
}

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Returns a cached promise resolving to a palette (or null on failure). */
export function extractPalette(url) {
  if (!url) return Promise.resolve(null);
  if (cache.has(url)) return cache.get(url);

  const promise = loadImage(url)
    .then((img) => (img ? buildPalette(img) : null))
    .catch(() => null);

  cache.set(url, promise);
  return promise;
}

/** Inline style object that re-tints every `brand-*` utility inside a subtree. */
export function paletteStyle(palette) {
  return palette?.tokens || undefined;
}

/** Full-bleed, multi-colour wash built from the sampled palette. */
export function meshBackground(palette) {
  if (!palette) return undefined;
  const c = palette.colors;
  return [
    `radial-gradient(58% 42% at 8% 0%, ${c[1]}55, transparent 72%)`,
    `radial-gradient(46% 38% at 92% 4%, ${c[2]}4d, transparent 70%)`,
    `radial-gradient(64% 48% at 46% 18%, ${c[0]}3d, transparent 74%)`,
    `radial-gradient(52% 40% at 18% 62%, ${c[3]}33, transparent 76%)`,
  ].join(', ');
}
