/**
 * TMDB -> AniList/MAL mapping for the anime server.
 *
 * The anime embed (src/lib/sources.js `megaplayUrl`) is addressed by
 * AniList or MAL id + episode number, while Priva is TMDB-based. AniList's
 * public GraphQL API needs no key and allows browser calls, so we search it
 * by title and pick the best candidate:
 *
 *  - normalised title match against TMDB's original + English titles
 *    (romaji / english / native / synonyms on the AniList side)
 *  - format match (MOVIE vs TV) and season-year proximity as tie-breakers
 *  - for season > 1 we first try a season-specific match (AniList usually
 *    lists each season as its own entry, e.g. "… Season 2") and then use
 *    the per-season episode number; otherwise the season-1 entry with an
 *    absolute episode number.
 *
 * Results (including "no match") are cached in memory + localStorage so a
 * title is only resolved once per browser.
 */

const ANILIST = 'https://graphql.anilist.co';
const CACHE_PREFIX = 'priva:anilist:';
const memory = new Map();

const QUERY = `
query ($search: String) {
  Page(page: 1, perPage: 8) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      id
      idMal
      format
      episodes
      seasonYear
      title { romaji english native }
      synonyms
    }
  }
}`;

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function titleScore(candidate, wanted) {
  const names = [
    candidate.title?.romaji,
    candidate.title?.english,
    candidate.title?.native,
    ...(candidate.synonyms || []),
  ]
    .filter(Boolean)
    .map(normalize);
  const targets = wanted.filter(Boolean).map(normalize);
  let best = 0;
  for (const name of names) {
    for (const target of targets) {
      if (!name || !target) continue;
      if (name === target) return 100;
      const nameWords = new Set(name.split(' '));
      const targetWords = target.split(' ');
      const overlap = targetWords.filter((w) => nameWords.has(w)).length;
      const ratio = overlap / Math.max(targetWords.length, nameWords.size);
      best = Math.max(best, Math.round(ratio * 80));
    }
  }
  return best;
}

function pickBest(candidates, { wanted, type, year, season }) {
  let best = null;
  for (const candidate of candidates) {
    let score = titleScore(candidate, wanted);
    if (score < 35) continue;
    if (type === 'movie' && candidate.format === 'MOVIE') score += 15;
    if (type === 'tv' && ['TV', 'TV_SHORT', 'ONA'].includes(candidate.format)) score += 10;
    if (year && candidate.seasonYear) {
      const expected = season > 1 ? year + (season - 1) : year;
      score -= Math.min(20, Math.abs(candidate.seasonYear - expected) * 4);
    }
    if (!best || score > best.score) best = { candidate, score };
  }
  return best?.candidate || null;
}

async function searchAniList(search, signal) {
  const res = await fetch(ANILIST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { search } }),
    signal,
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const json = await res.json();
  return json?.data?.Page?.media || [];
}

function cacheKey(type, tmdbId, season) {
  return `${CACHE_PREFIX}${type}:${tmdbId}:s${season || 1}`;
}

function readCache(key) {
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const value = JSON.parse(raw);
      memory.set(key, value);
      return value;
    }
  } catch {
    /* storage unavailable */
  }
  return undefined;
}

function writeCache(key, value) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / disabled */
  }
}

/**
 * Resolve a TMDB anime title to { anilistId, malId, episodeMode } or null.
 * episodeMode: 'season'  -> use the per-season episode number
 *              'absolute'-> use absoluteEpisode() from sources.js
 */
export async function resolveAnime(detail, { type = 'tv', season = 1 } = {}) {
  if (!detail) return null;
  const key = cacheKey(type, detail.id, type === 'tv' ? season : 1);
  const cached = readCache(key);
  if (cached !== undefined) return cached;

  const wanted = [
    detail.original_name || detail.original_title,
    detail.name || detail.title,
  ];
  const year = Number(String(detail.first_air_date || detail.release_date || '').slice(0, 4)) || null;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 9000);

  let result = null;
  try {
    if (type === 'tv' && season > 1) {
      // AniList normally has a separate entry per season.
      for (const base of wanted.filter(Boolean)) {
        const media = await searchAniList(`${base} Season ${season}`, controller.signal);
        const hit = pickBest(media, {
          wanted: [`${base} Season ${season}`, `${base} ${season}`, base],
          type,
          year,
          season,
        });
        if (hit) {
          result = { anilistId: hit.id, malId: hit.idMal || null, episodeMode: 'season' };
          break;
        }
      }
    }

    if (!result) {
      for (const base of wanted.filter(Boolean)) {
        const media = await searchAniList(base, controller.signal);
        const hit = pickBest(media, { wanted, type, year, season: 1 });
        if (hit) {
          result = {
            anilistId: hit.id,
            malId: hit.idMal || null,
            episodeMode: type === 'tv' && season > 1 ? 'absolute' : 'season',
          };
          break;
        }
      }
    }
  } catch {
    result = null;
  } finally {
    window.clearTimeout(timer);
  }

  // Only cache definitive answers. A network failure also lands here as
  // null; caching it per-title is still preferable to retry-storming
  // AniList on every visit, and users can use the other servers meanwhile.
  writeCache(key, result);
  return result;
}
