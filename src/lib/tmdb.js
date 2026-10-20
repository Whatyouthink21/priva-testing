const API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || 'a45420333457411e78d5ad35d6c51a2d';
const BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

/** In-memory request cache + de-duplication. */
const cache = new Map();

function qs(params = {}) {
  const search = new URLSearchParams({ api_key: API_KEY, language: 'en-US' });
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    search.set(k, v);
  });
  return search.toString();
}

export async function tmdb(path, params = {}, { signal } = {}) {
  const url = `${BASE}${path}?${qs(params)}`;
  if (cache.has(url)) return cache.get(url);

  const request = fetch(url, { signal })
    .then(async (res) => {
      if (!res.ok) throw new Error(`TMDB ${res.status} — ${path}`);
      return res.json();
    })
    .catch((err) => {
      cache.delete(url);
      throw err;
    });

  cache.set(url, request);
  return request;
}

export const IMG = {
  poster: (p, w = 'w500') => (p ? `${IMAGE_BASE}/${w}${p}` : null),
  backdrop: (p, w = 'w1280') => (p ? `${IMAGE_BASE}/${w}${p}` : null),
  profile: (p, w = 'w185') => (p ? `${IMAGE_BASE}/${w}${p}` : null),
  logo: (p, w = 'w500') => (p ? `${IMAGE_BASE}/${w}${p}` : null),
  provider: (p, w = 'w154') => (p ? `${IMAGE_BASE}/${w}${p}` : null),
};

export const titleOf = (item) => item?.title || item?.name || item?.original_title || item?.original_name || '';
export const dateOf = (item) => item?.release_date || item?.first_air_date || '';
export const yearOf = (item) => (dateOf(item) ? String(dateOf(item)).slice(0, 4) : '');
export const typeOf = (item) =>
  item?.media_type && item.media_type !== 'person'
    ? item.media_type
    : item?.first_air_date
      ? 'tv'
      : 'movie';

export const rating = (n) => {
  const value = Number(n);
  return Number.isFinite(value) && value > 0 ? value.toFixed(1) : null;
};

export const runtimeLabel = (mins) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

export function money(value) {
  if (!value) return null;
  return `$${Number(value).toLocaleString('en-US')}`;
}

export function normalize(item, fallbackType) {
  const type = typeOf(item) || fallbackType || 'movie';
  return {
    id: item.id,
    type,
    title: titleOf(item),
    poster: item.poster_path || null,
    backdrop: item.backdrop_path || null,
    rating: item.vote_average || 0,
    votes: item.vote_count || 0,
    year: yearOf(item),
    overview: item.overview || '',
  };
}

/* ------------------------------------------------------------------ */
/* Endpoint helpers                                                    */
/* ------------------------------------------------------------------ */

export const api = {
  trending: (media = 'all', window = 'week') => tmdb(`/trending/${media}/${window}`),
  nowPlaying: (page = 1) => tmdb('/movie/now_playing', { page, region: 'US' }),
  popular: (type = 'movie', page = 1) => tmdb(`/${type}/popular`, { page }),
  topRated: (type = 'movie', page = 1) => tmdb(`/${type}/top_rated`, { page }),
  upcoming: (page = 1) => tmdb('/movie/upcoming', { page }),
  discover: (type = 'movie', params = {}) =>
    tmdb(`/discover/${type}`, { sort_by: 'popularity.desc', ...params }),
  search: (query, page = 1, type = 'multi') =>
    type === 'multi'
      ? tmdb('/search/multi', { query, page, include_adult: false })
      : tmdb(`/search/${type}`, { query, page, include_adult: false }),
  details: (type, id) => tmdb(`/${type}/${id}`),
  credits: (type, id) => tmdb(`/${type}/${id}/credits`),
  videos: (type, id) => tmdb(`/${type}/${id}/videos`),
  reviews: (type, id) => tmdb(`/${type}/${id}/reviews`, { page: 1 }),
  similar: (type, id) => tmdb(`/${type}/${id}/similar`),
  recommendations: (type, id) => tmdb(`/${type}/${id}/recommendations`),
  season: (id, season) => tmdb(`/tv/${id}/season/${season}`),
  images: (type, id) =>
    tmdb(`/${type}/${id}/images`, { include_image_language: 'en,null' }),
  genres: (type = 'movie') => tmdb(`/genre/${type}/list`),
  providers: (region = 'US') =>
    tmdb('/watch/providers/movie', { watch_region: region }),
  person: (id) => tmdb(`/person/${id}`, { append_to_response: 'combined_credits,external_ids' }),
  movieProviders: (id) => tmdb(`/movie/${id}/watch/providers`),
  tvProviders: (id) => tmdb(`/tv/${id}/watch/providers`),
};
