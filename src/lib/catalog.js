import { api, normalizeItem } from './tmdb';

export const STUDIOS = [
  {
    slug: 'disney',
    name: 'Disney+',
    providerId: '337',
    companyId: '2',
    gradient: 'from-[#062366] via-[#0b3ba8] to-[#081226]',
    glow: 'rgba(29, 108, 255, 0.55)',
    wordmark: 'DISNEY+',
    tagline: 'Originals & Blockbusters',
  },
  {
    slug: 'hbomax',
    name: 'HBO Max',
    providerId: '1899',
    networkId: '49',
    gradient: 'from-[#280b5e] via-[#4c1d95] to-[#0f1021]',
    glow: 'rgba(139, 92, 246, 0.55)',
    wordmark: 'HBO MAX',
    tagline: 'Prestige Series & Cinema',
  },
  {
    slug: 'netflix',
    name: 'Netflix',
    providerId: '8',
    networkId: '213',
    gradient: 'from-[#5c080e] via-[#991b1b] to-[#120b0d]',
    glow: 'rgba(239, 68, 68, 0.55)',
    wordmark: 'NETFLIX',
    tagline: 'Global Originals',
  },
  {
    slug: 'prime',
    name: 'Prime Video',
    providerId: '9',
    networkId: '1024',
    gradient: 'from-[#053559] via-[#0284c7] to-[#09131f]',
    glow: 'rgba(56, 189, 248, 0.55)',
    wordmark: 'PRIME VIDEO',
    tagline: 'Amazon MGM Studios',
  },
  {
    slug: 'appletv',
    name: 'Apple TV+',
    providerId: '350',
    networkId: '2552',
    gradient: 'from-[#1f2430] via-[#323847] to-[#0e1015]',
    glow: 'rgba(226, 232, 240, 0.4)',
    wordmark: ' tv+',
    tagline: 'Apple Originals',
  },
  {
    slug: 'paramount',
    name: 'Paramount+',
    providerId: '531',
    companyId: '4',
    gradient: 'from-[#002970] via-[#0055cc] to-[#091224]',
    glow: 'rgba(59, 130, 246, 0.55)',
    wordmark: 'PARAMOUNT+',
    tagline: 'A Mountain of Entertainment',
  },
  {
    slug: 'hulu',
    name: 'Hulu',
    providerId: '15',
    networkId: '453',
    gradient: 'from-[#063e29] via-[#059669] to-[#091813]',
    glow: 'rgba(28, 231, 131, 0.5)',
    wordmark: 'hulu',
    tagline: 'FX & Hit Series',
  },
  {
    slug: 'peacock',
    name: 'Peacock',
    providerId: '386',
    companyId: '33',
    gradient: 'from-[#231942] via-[#334155] to-[#0f1014]',
    glow: 'rgba(250, 204, 21, 0.42)',
    wordmark: 'PEACOCK',
    tagline: 'Universal & NBC',
  },
  {
    slug: 'marvel',
    name: 'Marvel Studios',
    companyId: '420',
    gradient: 'from-[#6b0f12] via-[#b91c1c] to-[#140a0b]',
    glow: 'rgba(248, 113, 113, 0.55)',
    wordmark: 'MARVEL',
    tagline: 'Cinematic Universe',
  },
  {
    slug: 'pixar',
    name: 'Pixar',
    companyId: '3',
    gradient: 'from-[#0e3958] via-[#1d4ed8] to-[#0b1324]',
    glow: 'rgba(96, 165, 250, 0.5)',
    wordmark: 'P I X A R',
    tagline: 'Animation Studios',
  },
];

export const POPULAR_GENRES = [
  { slug: 'action', name: 'Action', movieGenre: '28', tvGenre: '10759', color: 'from-rose-950/90 via-orange-950/60', backdrop: '/628Dep6AxEtDxjZoGP78TsOxYbK.jpg' },
  { slug: 'romance', name: 'Romance', movieGenre: '10749', tvGenre: '18', color: 'from-pink-950/90 via-rose-900/60', backdrop: '/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg' },
  { slug: 'drama', name: 'Drama', movieGenre: '18', tvGenre: '18', color: 'from-indigo-950/90 via-slate-900/65', backdrop: '/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg' },
  { slug: 'comedy', name: 'Comedy', movieGenre: '35', tvGenre: '35', color: 'from-amber-950/90 via-yellow-900/55', backdrop: '/ctMserH8g2SeOAnCw5gFjdQF8mo.jpg' },
  { slug: 'thriller', name: 'Thriller', movieGenre: '53', tvGenre: '9648', color: 'from-emerald-950/90 via-teal-950/65', backdrop: '/dKqa850uvbNSCaQCV4Im1XlzEtQ.jpg' },
  { slug: 'sci-fi', name: 'Sci-Fi', movieGenre: '878', tvGenre: '10765', color: 'from-cyan-950/90 via-blue-950/65', backdrop: '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg' },
  { slug: 'horror', name: 'Horror', movieGenre: '27', tvGenre: '9648', color: 'from-red-950/95 via-neutral-950/75', backdrop: '/uL4cIrNi2uaUnWIOQQ28EVnkETG.jpg' },
  { slug: 'crime', name: 'Crime', movieGenre: '80', tvGenre: '80', color: 'from-slate-950/90 via-zinc-900/70', backdrop: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg' },
  { slug: 'fantasy', name: 'Fantasy', movieGenre: '14', tvGenre: '10765', color: 'from-violet-950/90 via-purple-950/65', backdrop: '/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg' },
  { slug: 'adventure', name: 'Adventure', movieGenre: '12', tvGenre: '10759', color: 'from-teal-950/90 via-emerald-900/60', backdrop: '/8rpDcsfLJypbO6vREc0547VKqEv.jpg' },
  { slug: 'mystery', name: 'Mystery', movieGenre: '9648', tvGenre: '9648', color: 'from-blue-950/90 via-indigo-950/70', backdrop: '/wxiBsKFEOOFK8eQStWOykNORlXY.jpg' },
  { slug: 'anime', name: 'Anime', movieGenre: '16', tvGenre: '16', extra: { with_original_language: 'ja' }, color: 'from-fuchsia-950/90 via-indigo-950/65', backdrop: '/w3agwUSMpJ4X9t1jGrDtqqRPjDQ.jpg' },
  { slug: 'animation', name: 'Animation', movieGenre: '16', tvGenre: '16', color: 'from-sky-950/90 via-blue-900/60', backdrop: '/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg' },
  { slug: 'family', name: 'Family', movieGenre: '10751', tvGenre: '10751', color: 'from-blue-950/90 via-cyan-900/55', backdrop: '/c6BPbkO5Npt1OdwttAxCFo06wtH.jpg' },
  { slug: 'reality', name: 'Reality', movieGenre: '99', tvGenre: '10764', color: 'from-purple-950/90 via-pink-950/60', backdrop: '/gPQppUnLx9vqPDLz3WwZ2HJsNbt.jpg' },
  { slug: 'documentary', name: 'Documentary', movieGenre: '99', tvGenre: '99', color: 'from-stone-950/90 via-emerald-950/60', backdrop: '/6GXqVvL20Y0MpyVP30WoI2NPK69.jpg' },
  { slug: 'historical', name: 'Historical', movieGenre: '36', tvGenre: '10768', color: 'from-amber-950/95 via-stone-900/70', backdrop: '/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg' },
  { slug: 'musical', name: 'Musical', movieGenre: '10402', tvGenre: '10402', color: 'from-rose-950/90 via-purple-950/65', backdrop: '/f1AQhx6ZfGhPZFTVKgxG91PhEYc.jpg' },
];

export const POPULAR_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', gradient: 'from-[#0d2859] to-[#0d121d]', backdrop: '/7iwUUcKURMT7aKfCwMy6YnGtchD.jpg' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', gradient: 'from-[#5c1c12] to-[#140e0e]', backdrop: '/hBoY4pwszgeBEXLZ53WDTyLIMhr.jpg' },
  { code: 'ja', name: 'Japanese', native: '日本語', gradient: 'from-[#4a1248] to-[#110e1a]', backdrop: '/w3agwUSMpJ4X9t1jGrDtqqRPjDQ.jpg' },
  { code: 'ko', name: 'Korean', native: '한국어', gradient: 'from-[#0f3847] to-[#0d131a]', backdrop: '/qqHFLg90IUSoTmSMpKOOW5RyqN3.jpg' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', gradient: 'from-[#4d2c0d] to-[#13100d]', backdrop: '/dgUDj84BWtW6EZzee8BkgKnjDhh.jpg' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', gradient: 'from-[#123d30] to-[#0d1412]', backdrop: '/qRN8eqYwG6HPSy0i3fKzuLrUOhp.jpg' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', gradient: 'from-[#163b24] to-[#0d1310]', backdrop: '/6GXqVvL20Y0MpyVP30WoI2NPK69.jpg' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', gradient: 'from-[#522014] to-[#140f0d]', backdrop: '/eqLwFXX0R7U0crdgQcj0Rxjb9uc.jpg' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', gradient: 'from-[#4f370f] to-[#14110c]', backdrop: '/1jANqIbqrWJZb8GM5Kb3L6U8iHi.jpg' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', gradient: 'from-[#1c2b59] to-[#0d101c]', backdrop: '/ch1g1X6TfezRwbmiBiYRpALTQjN.jpg' },
  { code: 'es', name: 'Spanish', native: 'Español', gradient: 'from-[#591628] to-[#140d11]', backdrop: '/uoXXbN2PrOxH6UKyP7kYwmGpAAP.jpg' },
  { code: 'pt', name: 'Portuguese', native: 'Português', gradient: 'from-[#154238] to-[#0d1413]', backdrop: '/3UbHGmu9vIMSC5uNfnGt7DjetqT.jpg' },
];

export const CATEGORY_FETCHERS = {
  'Trending Right Now': (page = 1) =>
    api.trendingAll(page).then((r) => (r.results || []).filter((i) => i.media_type !== 'person').map((i) => normalizeItem(i))),
  'New Movies': (page = 1) =>
    api.nowPlayingMovies(page).then((r) => (r.results || []).map((i) => normalizeItem(i, 'movie'))),
  'Popular Movies': (page = 1) =>
    api.popularMovies(page).then((r) => (r.results || []).map((i) => normalizeItem(i, 'movie'))),
  'Trending Movies': (page = 1) =>
    api.trendingMovies(page).then((r) => (r.results || []).map((i) => normalizeItem(i, 'movie'))),
  'Upcoming Movies': (page = 1) =>
    api.upcomingMovies(page).then((r) => (r.results || []).map((i) => normalizeItem(i, 'movie'))),
  'Top Rated Movies': (page = 1) =>
    api.topRatedMovies(page).then((r) => (r.results || []).map((i) => normalizeItem(i, 'movie'))),
  'Popular TV Shows': (page = 1) =>
    api.popularTv(page).then((r) => (r.results || []).map((i) => normalizeItem(i, 'tv'))),
  'Trending TV Shows': (page = 1) =>
    api.trendingTv(page).then((r) => (r.results || []).map((i) => normalizeItem(i, 'tv'))),
  'Upcoming Series': (page = 1) =>
    api.onTheAirTv(page).then((r) => (r.results || []).map((i) => normalizeItem(i, 'tv'))),
  'Animation TV Shows': (page = 1) =>
    api.discover('tv', { with_genres: '16', page }).then((r) => (r.results || []).map((i) => normalizeItem(i, 'tv'))),
  'Top Rated TV Shows': (page = 1) =>
    api.topRatedTv(page).then((r) => (r.results || []).map((i) => normalizeItem(i, 'tv'))),
  'Trending Anime': (page = 1) =>
    api.animeSeries(page).then((r) => (r.results || []).map((i) => normalizeItem({ ...i, isAnime: true }, 'tv'))),
  'Top Rated Anime Series': (page = 1) =>
    api.animeTopSeries(page).then((r) => (r.results || []).map((i) => normalizeItem({ ...i, isAnime: true }, 'tv'))),
  'Top Rated Anime Movies': (page = 1) =>
    api.animeMovies(page).then((r) => (r.results || []).map((i) => normalizeItem({ ...i, isAnime: true }, 'movie'))),
};
