const API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || 'a45420333457411e78d5ad35d6c51a2d';
const BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const requestCache = new Map();
const resolvedDataCache = new Map();
const logoCache = new Map();

export const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

function buildQuery(params = {}) {
  const sp = new URLSearchParams({ api_key: API_KEY, language: 'en-US' });
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  return sp.toString();
}

export async function tmdb(path, params = {}, { signal } = {}) {
  const url = `${BASE}${path}?${buildQuery(params)}`;
  if (!signal && resolvedDataCache.has(url)) {
    return resolvedDataCache.get(url);
  }
  if (!signal && requestCache.has(url)) {
    return requestCache.get(url);
  }
  const promise = fetch(url, { signal })
    .then(async (res) => {
      if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
      const json = await res.json();
      resolvedDataCache.set(url, json);
      return json;
    })
    .catch((err) => {
      requestCache.delete(url);
      throw err;
    });

  if (!signal) requestCache.set(url, promise);
  return promise;
}

export const IMG = {
  poster: (p, size = 'w342') => (p ? `${IMAGE_BASE}/${size}${p}` : null),
  backdrop: (p, size = 'w1280') => (p ? `${IMAGE_BASE}/${size}${p}` : null),
  still: (p, size = 'w500') => (p ? `${IMAGE_BASE}/${size}${p}` : null),
  logo: (p, size = 'w500') => (p ? `${IMAGE_BASE}/${size}${p}` : null),
  profile: (p, size = 'w185') => (p ? `${IMAGE_BASE}/${size}${p}` : null),
  profileLg: (p) => (p ? `${IMAGE_BASE}/h632${p}` : null),
};

export function titleOf(item) {
  return item?.title || item?.name || item?.original_title || item?.original_name || 'Untitled';
}

export function yearOf(item) {
  const d = item?.release_date || item?.first_air_date || item?.year || '';
  return d ? String(d).slice(0, 4) : '';
}

export function mediaTypeOf(item, fallback = 'movie') {
  if (item?.type === 'movie' || item?.type === 'tv') return item.type;
  if (item?.media_type === 'movie' || item?.media_type === 'tv') return item.media_type;
  if (item?.first_air_date !== undefined) return 'tv';
  if (item?.release_date !== undefined) return 'movie';
  return fallback;
}

export function isAnimeItem(item) {
  if (!item) return false;
  if (item.isAnime) return true;
  const genreIds = item.genre_ids || (item.genres || []).map((g) => g.id);
  const animated = Array.isArray(genreIds) && genreIds.includes(16);
  const ja =
    item.original_language === 'ja' ||
    (Array.isArray(item.origin_country) && item.origin_country.includes('JP'));
  return Boolean(animated && ja);
}

export function formatScore(val) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n.toFixed(1) : null;
}

export function formatRuntime(mins) {
  const m = Number(mins);
  if (!Number.isFinite(m) || m <= 0) return null;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h > 0 ? `${h}h ${rem}m` : `${rem}m`;
}

export function extractCertification(detail, type) {
  if (!detail) return null;
  if (type === 'movie') {
    const list = detail.release_dates?.results || [];
    const preferred =
      list.find((r) => r.iso_3166_1 === 'IN') ||
      list.find((r) => r.iso_3166_1 === 'US') ||
      list[0];
    const cert = preferred?.release_dates?.find((d) => d.certification)?.certification;
    return cert || (detail.adult ? 'A' : 'U/A 13+');
  }
  const ratings = detail.content_ratings?.results || [];
  const preferred =
    ratings.find((r) => r.iso_3166_1 === 'IN') ||
    ratings.find((r) => r.iso_3166_1 === 'US') ||
    ratings[0];
  return preferred?.rating || 'U/A 16+';
}

export function pickBestLogo(images) {
  const logos = images?.logos || [];
  if (!logos.length) return null;
  const en = logos
    .filter((l) => l.iso_639_1 === 'en' && l.file_path && !l.file_path.endsWith('.svg'))
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  if (en.length) return en[0].file_path;
  const neutral = logos.filter((l) => !l.iso_639_1 && l.file_path && !l.file_path.endsWith('.svg'));
  if (neutral.length) return neutral[0].file_path;
  return logos[0]?.file_path || null;
}

export function normalizeItem(raw, fallbackType = 'movie') {
  if (!raw) return null;
  const type = mediaTypeOf(raw, fallbackType);
  const anime = isAnimeItem(raw);
  const genreNames = raw.genres
    ? raw.genres.map((g) => g.name)
    : (raw.genre_ids || []).map((id) => GENRE_MAP[id]).filter(Boolean);

  const cachedLogo = logoCache.get(`${type}:${raw.id}`);
  return {
    id: raw.id,
    type,
    isAnime: anime,
    badge: anime ? 'Anime' : type === 'tv' ? 'Series' : 'Movie',
    title: titleOf(raw),
    poster: raw.poster || raw.poster_path || null,
    backdrop: raw.backdrop || raw.backdrop_path || null,
    logo: raw.logo || (typeof cachedLogo === 'string' ? cachedLogo : null),
    rating: Number(raw.vote_average ?? raw.rating ?? 0),
    year: yearOf(raw),
    overview: raw.overview || '',
    genres: genreNames.slice(0, 3),
    original_language: raw.original_language || '',
  };
}

/**
 * Synchronously prepares up to 10 hero slides immediately with zero network wait.
 */
export function prepareHeroSlides(items = [], fallbackType = 'movie', count = 10) {
  return items
    .filter((x) => x && (x.backdrop_path || x.backdrop || x.poster_path || x.poster))
    .slice(0, count)
    .map((x) => normalizeItem(x, fallbackType));
}

export async function fetchLogoPath(type, id) {
  const key = `${type}:${id}`;
  if (logoCache.has(key)) {
    const val = logoCache.get(key);
    return val instanceof Promise ? val : Promise.resolve(val);
  }
  const p = tmdb(`/${type}/${id}/images`, { include_image_language: 'en,null' })
    .then((img) => {
      const picked = pickBestLogo(img) || '';
      logoCache.set(key, picked);
      return picked || null;
    })
    .catch(() => {
      logoCache.delete(key);
      return null;
    });
  logoCache.set(key, p);
  return p;
}

export const api = {
  trendingAll: (page = 1) => tmdb('/trending/all/day', { page }),
  trendingMovies: (page = 1) => tmdb('/trending/movie/day', { page }),
  trendingTv: (page = 1) => tmdb('/trending/tv/day', { page }),
  nowPlayingMovies: (page = 1) => tmdb('/movie/now_playing', { page }),
  popularMovies: (page = 1) => tmdb('/movie/popular', { page }),
  upcomingMovies: (page = 1) => tmdb('/movie/upcoming', { page }),
  topRatedMovies: (page = 1) => tmdb('/movie/top_rated', { page }),
  popularTv: (page = 1) => tmdb('/tv/popular', { page }),
  onTheAirTv: (page = 1) => tmdb('/tv/on_the_air', { page }),
  topRatedTv: (page = 1) => tmdb('/tv/top_rated', { page }),
  discover: (type = 'movie', params = {}) =>
    tmdb(`/discover/${type}`, {
      include_adult: false,
      sort_by: 'popularity.desc',
      ...params,
    }),
  animeSeries: (page = 1, extra = {}) =>
    tmdb('/discover/tv', {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
      page,
      ...extra,
    }),
  animeTopSeries: (page = 1) =>
    tmdb('/discover/tv', {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'vote_average.desc',
      'vote_count.gte': 300,
      page,
    }),
  animeMovies: (page = 1) =>
    tmdb('/discover/movie', {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'vote_average.desc',
      'vote_count.gte': 250,
      page,
    }),
  fullDetail: (type, id) =>
    tmdb(`/${type}/${id}`, {
      append_to_response:
        type === 'movie'
          ? 'images,videos,credits,recommendations,similar,release_dates'
          : 'images,videos,credits,recommendations,similar,content_ratings',
      include_image_language: 'en,null',
    }),
  season: (id, seasonNumber = 1) => tmdb(`/tv/${id}/season/${seasonNumber}`),
  collection: (id) => tmdb(`/collection/${id}`),
  person: (id) =>
    tmdb(`/person/${id}`, {
      append_to_response: 'combined_credits',
    }),
  searchMulti: (query, page = 1, options = {}) =>
    tmdb('/search/multi', { query, page, include_adult: false }, options),
  searchTyped: (type, query, page = 1, options = {}) =>
    tmdb(`/search/${type}`, { query, page, include_adult: false }, options),
  recommendationsFor: async (type, id) => {
    const [rec, sim] = await Promise.all([
      tmdb(`/${type}/${id}/recommendations`).catch(() => ({ results: [] })),
      tmdb(`/${type}/${id}/similar`).catch(() => ({ results: [] })),
    ]);
    const seen = new Set([Number(id)]);
    const merged = [];
    for (const item of [...(rec.results || []), ...(sim.results || [])]) {
      if (!item?.id || seen.has(item.id) || !item.poster_path) continue;
      seen.add(item.id);
      merged.push(normalizeItem(item, type));
      if (merged.length >= 20) break;
    }
    return merged;
  },
};
