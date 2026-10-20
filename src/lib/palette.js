/**
 * Adaptive colour palettes.
 *
 * Every movie / TV page samples its own artwork and paints itself with the
 * colours found in that poster, so two titles never look the same.
 */

const cache = new Map();
const SAMPLES = 96;
const LOAD_TIMEOUT = 9000;

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
  `#${[r, g, b]
    .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;

const triple = ([r, g, b]) =>
  `${clamp(Math.round(r), 0, 255)} ${clamp(Math.round(g), 0, 255)} ${clamp(Math.round(b), 0, 255)}`;

const hslTriple = (h, s, l) => triple(hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1)));

/** Vivid, legible version of a sampled colour. */
function tune(h, s, l, light = 0, sat = 0) {
  return {
    h,
    s: clamp(s + sat, 0.42, 0.88),
    l: clamp(l + light, 0.5, 0.66),
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
    if (data[i + 3] < 180) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 24) continue; // pure black
    if (min > 240) continue; // blown-out white

    const [h, s, l] = rgbToHsl(r, g, b);
    if (l < 0.1 || l > 0.95) continue;

    neutral.r += r;
    neutral.g += g;
    neutral.b += b;
    neutral.n += 1;

    if (s < 0.12) continue; // washed-out pixels

    const key = Math.round(h / 12) % 30;
    // How much of the poster this hue covers (area), plus a gentle nudge for
    // vivid, mid-tone pixels so a small bright accent can still make the cut.
    const weight = 1 + s * 0.9 + (l > 0.25 && l < 0.8 ? 0.4 : 0);
    const bucket = buckets.get(key) || { count: 0, h: 0, s: 0, l: 0, n: 0 };
    bucket.count += weight;
    bucket.h += h * weight;
    bucket.s += s * weight;
    bucket.l += l * weight;
    bucket.n += weight;
    buckets.set(key, bucket);
  }

  if (!buckets.size && neutral.n) {
    const avg = [neutral.r / neutral.n, neutral.g / neutral.n, neutral.b / neutral.n];
    const [h, s, l] = rgbToHsl(...avg);
    return [{ count: 1, h, s: Math.max(s, 0.16), l: clamp(l, 0.45, 0.66) }];
  }

  return [...buckets.values()]
    .map((b) => ({ count: b.count, h: b.h / b.n, s: b.s / b.n, l: b.l / b.n }))
    .sort((a, b) => b.count - a.count);
}

const hueDistance = (a, b) => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

function buildPalette(image) {
  const buckets = samplePixels(image);
  if (!buckets || !buckets.length) return null;

  // Only hues with real pigment count as colours; a greyscale poster keeps a
  // subdued tint rather than a rainbow that isn't in the artwork.
  const vivid = buckets.filter((b) => b.s >= 0.2);

  if (!vivid.length) {
    const base = buckets[0];
    const hue = base.h;
    const levels = [0.62, 0.48, 0.7, 0.4];
    const triples = levels.map((l) => hslTriple(hue, 0.13, l));
    return {
      triples,
      colors: triples.map((t) => `rgb(${t})`),
      hex: {
        primary: hex(hslToRgb(hue, 0.13, 0.62)),
        secondary: hex(hslToRgb(hue, 0.13, 0.48)),
        tertiary: hex(hslToRgb(hue, 0.13, 0.7)),
        quaternary: hex(hslToRgb(hue, 0.13, 0.4)),
      },
      tokens: {
        '--brand': triples[0],
        '--brand-400': hslTriple(hue, 0.15, 0.72),
        '--brand-600': hslTriple(hue, 0.13, 0.5),
        '--accent-2': triples[1],
        '--accent-3': triples[2],
        '--accent-4': triples[3],
      },
    };
  }

  // Keep four well-separated hues, most-covered first, so the page gets a real
  // mix that reflects the artwork rather than one stray highlight.
  const picked = [];
  for (const bucket of vivid) {
    if (picked.length >= 4) break;
    if (picked.every((p) => hueDistance(p.h, bucket.h) > 24)) picked.push(bucket);
  }

  const base = picked[0] || vivid[0];
  const offsets = [28, -34, 66, -72, 120, -140, 180];
  let guard = 0;
  while (picked.length < 4 && guard < 12) {
    guard += 1;
    const chosen =
      offsets
        .map((o) => (((base.h + o) % 360) + 360) % 360)
        .find((hue) => picked.every((p) => hueDistance(p.h, hue) > 22)) ??
      (((base.h + offsets[picked.length % offsets.length]) % 360) + 360) % 360;

    picked.push({
      h: chosen,
      s: clamp(base.s * 0.88, 0.42, 0.86),
      l: clamp(base.l + (picked.length % 2 ? 0.05 : -0.03), 0.48, 0.64),
    });
  }

  const [p1, p2, p3, p4] = picked;

  const primary = tune(p1.h, p1.s, p1.l, 0.02, 0.14);
  const secondary = tune(p2.h, p2.s, p2.l, 0.05, 0.1);
  const tertiary = tune(p3.h, p3.s, p3.l, 0.06, 0.08);
  const quaternary = tune(p4.h, p4.s, p4.l, 0.04, 0.06);
  const tuned = [primary, secondary, tertiary, quaternary];

  const triples = tuned.map((c) => hslTriple(c.h, c.s, c.l));

  return {
    triples,
    colors: triples.map((t) => `rgb(${t})`),
    hex: {
      primary: hex(hslToRgb(primary.h, primary.s, primary.l)),
      secondary: hex(hslToRgb(secondary.h, secondary.s, secondary.l)),
      tertiary: hex(hslToRgb(tertiary.h, tertiary.s, tertiary.l)),
      quaternary: hex(hslToRgb(quaternary.h, quaternary.s, quaternary.l)),
    },
    tokens: {
      '--brand': triples[0],
      '--brand-400': hslTriple(primary.h, primary.s * 0.95, primary.l + 0.1),
      '--brand-600': hslTriple(primary.h, primary.s, primary.l - 0.1),
      '--accent-2': triples[1],
      '--accent-3': triples[2],
      '--accent-4': triples[3],
    },
  };
}

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = window.setTimeout(() => done(null), LOAD_TIMEOUT);

    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      window.clearTimeout(timer);
      done(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      done(null);
    };
    img.src = url;
  });
}

/**
 * Some CDNs refuse cross-origin pixel reads. These proxies re-serve the image
 * with permissive CORS headers so sampling still works.
 */
function proxyUrls(url) {
  const bare = url.replace(/^https?:\/\//, '');
  return [
    `https://wsrv.nl/?url=${encodeURIComponent(bare)}&w=140&h=200&fit=cover&output=jpg`,
    `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&w=140&h=200&fit=cover&output=jpg`,
  ];
}

async function attempt(urls) {
  for (const candidate of urls) {
    const img = await loadImage(candidate);
    if (!img) continue;
    const palette = buildPalette(img);
    if (palette) return palette;
  }
  return null;
}

/** Returns a cached promise resolving to a palette (or null on failure). */
export function extractPalette(url) {
  if (!url) return Promise.resolve(null);
  if (cache.has(url)) return cache.get(url);

  const promise = attempt([url])
    .then((direct) => (direct ? direct : attempt(proxyUrls(url))))
    .catch(() => null);

  cache.set(url, promise);
  return promise;
}

/** Inline style object that re-tints every `brand-*` utility inside a subtree. */
export function paletteStyle(palette) {
  return palette?.tokens || undefined;
}

/**
 * One soft blob: the colour fades out across 85% of the radius, so overlapping
 * blobs melt into each other instead of leaving visible edges or bands.
 */
function blob(triple, x, y, w, h, alpha) {
  const a = clamp(alpha, 0, 0.6);
  const mid = (a * 0.58).toFixed(3);
  const low = (a * 0.2).toFixed(3);
  return `radial-gradient(${w}% ${h}% at ${x}% ${y}%, rgb(${triple} / ${a.toFixed(3)}) 0%, rgb(${triple} / ${mid}) 30%, rgb(${triple} / ${low}) 58%, rgb(${triple} / 0) 86%)`;
}

/**
 * The whole page wash: four overlapping blobs, one per sampled colour, placed
 * so they cross over each other in the middle. No hard stops anywhere.
 */
export function ambientBackground(palette, strength = 1) {
  if (!palette) return undefined;
  const [a, b, c, d] = palette.triples;
  return [
    blob(a, 8, -2, 80, 62, 0.34 * strength),
    blob(b, 96, 6, 66, 52, 0.28 * strength),
    blob(c, 48, 30, 92, 58, 0.2 * strength),
    blob(d, 18, 74, 74, 56, 0.17 * strength),
  ].join(', ');
}

/** Hero lighting: denser mix for artwork, meant for `mix-blend-mode: color`. */
export function heroWash(palette, strength = 1) {
  if (!palette) return undefined;
  const [a, b, c, d] = palette.triples;
  return [
    blob(a, 14, 4, 74, 80, 0.55 * strength),
    blob(b, 88, 12, 70, 74, 0.5 * strength),
    blob(c, 52, 46, 96, 76, 0.36 * strength),
    blob(d, 26, 96, 86, 66, 0.3 * strength),
  ].join(', ');
}

/** Small, muted dots showing the sampled hues (never hard colour bars). */
export function swatchDots(palette) {
  return palette?.colors || [];
}
