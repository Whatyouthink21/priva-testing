const API_KEY = "a45420333457411e78d5ad35d6c51a2d";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export const img = {
  backdrop: (path, size="original") => path ? `${IMAGE_BASE}/${size}${path}` : null,
  poster: (path, size="w500") => path ? `${IMAGE_BASE}/${size}${path}` : null,
  profile: (path, size="w185") => path ? `${IMAGE_BASE}/${size}${path}` : null,
  logo: (path, size="w300") => path ? `${IMAGE_BASE}/${size}${path}` : null,
};

async function tmdbFetch(path, params={}) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  Object.entries(params).forEach(([k,v])=> {
    if(v!==undefined && v!==null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  if(!res.ok) throw new Error(`TMDB ${path} ${res.status}`);
  return res.json();
}

// Trending
export const getTrending = (mediaType="all", window="day") => tmdbFetch(`/trending/${mediaType}/${window}`);
export const getTrendingMovies = () => tmdbFetch("/trending/movie/day");
export const getTrendingTV = () => tmdbFetch("/trending/tv/day");

// Discover
export const getPopularMovies = (page=1) => tmdbFetch("/movie/popular", { page });
export const getPopularTV = (page=1) => tmdbFetch("/tv/popular", { page });
export const getTopRatedMovies = (page=1) => tmdbFetch("/movie/top_rated", { page });
export const getTopRatedTV = (page=1) => tmdbFetch("/tv/top_rated", { page });
export const getNowPlaying = (page=1) => tmdbFetch("/movie/now_playing", { page });
export const getOnTheAir = (page=1) => tmdbFetch("/tv/on_the_air", { page });
export const getUpcoming = (page=1) => tmdbFetch("/movie/upcoming", { page });

// Details
export const getMovieDetails = (id) => tmdbFetch(`/movie/${id}`, { append_to_response: "credits,videos,images,recommendations,similar,external_ids,watch/providers,release_dates" });
export const getTVDetails = (id) => tmdbFetch(`/tv/${id}`, { append_to_response: "credits,videos,images,recommendations,similar,external_ids,aggregate_credits,content_ratings" });
export const getPersonDetails = (id) => tmdbFetch(`/person/${id}`, { append_to_response: "combined_credits,images,external_ids" });
export const getSeasonDetails = (tvId, seasonNum) => tmdbFetch(`/tv/${tvId}/season/${seasonNum}`);

// Search
export const searchMulti = (q, page=1) => tmdbFetch("/search/multi", { query: q, page, include_adult: false });
export const searchMovie = (q, page=1) => tmdbFetch("/search/movie", { query: q, page, include_adult: false });
export const searchTV = (q, page=1) => tmdbFetch("/search/tv", { query: q, page, include_adult: false });
export const searchPerson = (q, page=1) => tmdbFetch("/search/person", { query: q, page, include_adult: false });

// Discover by provider / genre / etc
export const discoverMovies = (params) => tmdbFetch("/discover/movie", params);
export const discoverTV = (params) => tmdbFetch("/discover/tv", params);

// Providers list
export const getMovieWatchProviders = () => tmdbFetch("/watch/providers/movie");
export const getTVWatchProviders = () => tmdbFetch("/watch/providers/tv");

// Configuration helpers
export const getGenresMovie = () => tmdbFetch("/genre/movie/list");
export const getGenresTV = () => tmdbFetch("/genre/tv/list");

// Recommendations
export const getRecommendationsMovie = (id, page=1) => tmdbFetch(`/movie/${id}/recommendations`, { page });
export const getRecommendationsTV = (id, page=1) => tmdbFetch(`/tv/${id}/recommendations`, { page });

export function formatRuntime(minutes) {
  if(!minutes) return null;
  const h = Math.floor(minutes/60);
  const m = minutes % 60;
  if(h===0) return `${m}m`;
  if(m===0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function yearFromDate(dateStr) {
  if(!dateStr) return null;
  return new Date(dateStr).getFullYear();
}
