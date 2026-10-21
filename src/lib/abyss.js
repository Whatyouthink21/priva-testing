/**
 * Server 3 — personal library resolver.
 *
 * This server plays files from the site owner's own Abyss library
 * (abyssplayer.com is the library's custom player domain). Abyss has no
 * TMDB-id catalog: every uploaded file gets its own slug, so playback is a
 * two-step resolve:
 *
 *   1. List the library once via GET {VITE_ABYSS_API_BASE}/v1/resources
 *      (cached in memory; the API allows 1,200 req / 5 min).
 *   2. Match a file to the requested title by file name:
 *        - file name contains the TMDB id             (strongest)
 *        - normalised title (+ year for movies)
 *        - SxxExx / 1x02 patterns for episodes
 *      Naming uploads like `Inception (2010) [27205].mkv` or
 *      `The Flash S01E02 [60735].mkv` makes matches exact.
 *
 * The API key is supplied ONLY via the VITE_ABYSS_API_KEY environment
 * variable — never commit a real key. Without it this module reports
 * 'unconfigured' and the UI explains Server 3 is unavailable. Note that
 * VITE_* variables are embedded in the client bundle; the key can read the
 * library catalog from any visitor's browser, which is why the API call
 * itself is read-only (GET) here.
 *
 * The Abyss docs don't publish the auth scheme, so the first successful
 * strategy (Bearer header, apiKey header, then query param) is remembered.
 */

const API_BASE = (import.meta.env.VITE_ABYSS_API_BASE || 'https://api.abyss.to').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_ABYSS_API_KEY || '';
const PLAYER_BASE = (import.meta.env.VITE_ABYSS_PLAYER_BASE || 'https://abyssplayer.com').replace(/\/$/, '');
const EMBED_TEMPLATE = import.meta.env.VITE_ABYSS_EMBED_TEMPLATE || '';

export const ABYSS_CONFIGURED = Boolean(API_KEY);

let catalogPromise = null;
let authStrategy = 0;

function applyAuth(url, headers, strategy) {
  const nextUrl = new URL(url);
  const nextHeaders = { ...headers };
  if (strategy === 0) nextHeaders.Authorization = `Bearer ${API_KEY}`;
  else if (strategy === 1) nextHeaders.apiKey = API_KEY;
  else if (strategy === 2) nextHeaders['x-api-key'] = API_KEY;
  else nextUrl.searchParams.set('apiKey', API_KEY);
  return [nextUrl.toString(), nextHeaders];
}

async function apiGet(path) {
  const order = [authStrategy, 0, 1, 2, 3].filter((v, i, a) => a.indexOf(v) === i);
  let lastError = null;
  for (const strategy of order) {
    const [url, headers] = applyAuth(`${API_BASE}${path}`, { Accept: 'application/json' }, strategy);
    try {
      const res = await fetch(url, { headers });
      if (res.status === 401 || res.status === 403) {
        lastError = new Error(`auth ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`Abyss API ${res.status}`);
      authStrategy = strategy;
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Abyss API unreachable');
}

/** Recursively collect anything that looks like a file record. */
function collectFiles(node, out = [], depth = 0) {
  if (!node || depth > 6) return out;
  if (Array.isArray(node)) {
    node.forEach((item) => collectFiles(item, out, depth + 1));
    return out;
  }
  if (typeof node === 'object') {
    const name = node.name || node.title || node.fileName || node.file_name || node.originalName;
    const id = node.slug || node.code || node._id || node.id;
    const looksLikeFile =
      name && id && (node.type === 'file' || node.mime || node.size !== undefined || /\.[a-z0-9]{2,4}$/i.test(String(name)) || node.embed || node.url);
    if (looksLikeFile) {
      out.push({
        name: String(name),
        slug: String(node.slug || node.code || id),
        embed: embedFromRecord(node, id),
      });
    }
    Object.values(node).forEach((value) => {
      if (value && typeof value === 'object') collectFiles(value, out, depth + 1);
    });
  }
  return out;
}

function embedFromRecord(record, fallbackId) {
  // Prefer a ready-made embed/player URL if the API provides one.
  for (const key of ['embed', 'embedUrl', 'embed_url', 'player', 'playerUrl', 'url', 'link']) {
    const value = record?.[key];
    if (typeof value === 'string' && /^https?:\/\//i.test(value) && /abyss/i.test(value)) return value;
  }
  const slug = String(record?.slug || record?.code || fallbackId || '');
  if (!slug) return null;
  if (EMBED_TEMPLATE) return EMBED_TEMPLATE.replace('{slug}', slug).replace('{id}', slug);
  return `${PLAYER_BASE}/${slug}`;
}

async function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = apiGet('/v1/resources')
      .then((json) => collectFiles(json))
      .catch((err) => {
        catalogPromise = null; // allow a retry on the next title
        throw err;
      });
  }
  return catalogPromise;
}

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,4}$/i, '')
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function episodePatterns(season, episode) {
  const s = String(season);
  const ss = s.padStart(2, '0');
  const e = String(episode);
  const ee = e.padStart(2, '0');
  return [
    new RegExp(`s0?${s}\\s?e0?${e}(\\D|$)`, 'i'),
    new RegExp(`\\b${s}x${ee}\\b`, 'i'),
    new RegExp(`season\\s?${s}\\s?(episode|ep)\\s?${e}\\b`, 'i'),
    ...(season === 1 ? [new RegExp(`\\b(ep|episode)\\s?0?${e}\\b`, 'i')] : []),
  ];
}

function scoreFile(file, { tmdbId, title, year, type, season, episode }) {
  const name = normalize(file.name);
  let score = 0;

  if (tmdbId && new RegExp(`(^|\\D)${tmdbId}(\\D|$)`).test(name)) score += 60;

  const wanted = normalize(title);
  if (wanted) {
    if (name.includes(wanted)) score += 40;
    else {
      const words = wanted.split(' ').filter(Boolean);
      const hit = words.filter((w) => name.split(' ').includes(w)).length;
      score += words.length ? Math.round((hit / words.length) * 30) : 0;
    }
  }

  if (type === 'movie' && year && name.includes(String(year))) score += 10;

  if (type === 'tv') {
    if (episodePatterns(season, episode).some((re) => re.test(file.name))) score += 35;
    else score -= 50; // wrong episode of the right show is not a match
  }

  return score;
}

/**
 * Resolve a title to a library embed URL.
 * Returns { status: 'found', url } | { status: 'not-found' } |
 *         { status: 'unconfigured' } | { status: 'error' }
 */
export async function resolveAbyss({ tmdbId, title, year, type = 'movie', season = 1, episode = 1 } = {}) {
  if (!ABYSS_CONFIGURED) return { status: 'unconfigured' };
  if (!title && !tmdbId) return { status: 'not-found' };
  try {
    const files = await loadCatalog();
    let best = null;
    for (const file of files) {
      if (!file.embed) continue;
      const score = scoreFile(file, { tmdbId, title, year, type, season, episode });
      if (!best || score > best.score) best = { file, score };
    }
    const threshold = type === 'tv' ? 60 : 40;
    if (best && best.score >= threshold) return { status: 'found', url: best.file.embed };
    return { status: 'not-found' };
  } catch {
    return { status: 'error' };
  }
}
