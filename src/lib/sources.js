/**
 * Numbered streaming & download sources for Priva.
 * Provider names are strictly never exposed anywhere in UI labels.
 */

const ACCENT_HEX = '2563EB';

function withQuery(base, params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === false) return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

const LEGACY_SERVERS = [
  {
    id: 1,
    label: 'Server 1',
    buildMovieUrl: (id, { startAt } = {}) =>
      withQuery(`https://vidstuck.cc/embed/movie/${id}`, {
        color: ACCENT_HEX,
        branding: 'Priva',
        subtitle: 'english',
        overlay: 'true',
        progress: startAt && startAt > 15 ? Math.floor(startAt) : undefined,
      }),
    buildTvUrl: (id, season = 1, episode = 1, { startAt, autoplayNext = true } = {}) =>
      withQuery(`https://vidstuck.cc/embed/tv/${id}/${season}/${episode}`, {
        nextEpisode: 'true',
        autoplayNextEpisode: autoplayNext ? 'true' : undefined,
        episodeSelector: 'true',
        overlay: 'true',
        color: ACCENT_HEX,
        branding: 'Priva',
        subtitle: 'english',
        progress: startAt && startAt > 15 ? Math.floor(startAt) : undefined,
      }),
  },
  {
    id: 2,
    label: 'Server 2',
    buildMovieUrl: (id, { startAt } = {}) =>
      withQuery(`https://tgvid.lovable.app/embed/movie/${id}`, {
        color: ACCENT_HEX.toLowerCase(),
        back: 'false',
        t: startAt && startAt > 15 ? Math.floor(startAt) : undefined,
      }),
    buildTvUrl: (id, season = 1, episode = 1, { startAt, autoplayNext = true } = {}) =>
      withQuery(`https://tgvid.lovable.app/embed/tv/${id}/${season}/${episode}`, {
        color: ACCENT_HEX.toLowerCase(),
        back: 'false',
        episodeSelector: 'true',
        autoplayNextEp: autoplayNext ? 'true' : 'false',
        t: startAt && startAt > 15 ? Math.floor(startAt) : undefined,
      }),
  },
  {
    id: 3,
    label: 'Server 3',
    buildMovieUrl: (id) => `https://bingr.one/watch/movie/${id}`,
    buildTvUrl: (id, season = 1, episode = 1) =>
      `https://bingr.one/watch/tv/${id}/${season}/${episode}`,
  },
];

// v2.2: remove Nxsha/Frost, renumber the retained sources, and add frameXTV.
export const SERVERS = [
  { ...LEGACY_SERVERS[2], id: 1, label: 'Server 1', tags: ['Fast', 'High quality', 'Ad free'] },
  { ...LEGACY_SERVERS[0], id: 2, label: 'Server 2' },
  { ...LEGACY_SERVERS[1], id: 3, label: 'Server 3' },
  { id: 4, label: 'Server 4', tags: ['4K', 'Ad free'],
    buildMovieUrl: (id, { startAt } = {}) => withQuery(`https://framextv.xyz/embed/${id}`, {
      autoplay: 1, muted: 0, t: startAt > 0 ? Math.floor(startAt) : undefined,
    }),
    buildTvUrl: (id, season = 1, episode = 1, { startAt } = {}) =>
      withQuery(`https://framextv.xyz/embed/${id}/${season}/${episode}`, {
        autoplay: 1, muted: 0, t: startAt > 0 ? Math.floor(startAt) : undefined,
      }),
  },
];

// Anime embeds use external anime IDs (MAL/AniList), never TMDB IDs.
const validAnimeId = (id) => /^\d+$/.test(String(id)) && Number(id) > 0;
const audioPath = (language) => language === 'dub' ? 'dub' : 'sub';
export function buildAnimeUrl(malId, episode = 1, language = 'sub') {
  if (!validAnimeId(malId)) return '';
  return `https://megaplay.buzz/stream/mal/${malId}/${episode}/${audioPath(language)}`;
}
export function buildShonenUrl(anilistId, episode = 1, language = 'sub', parentOrigin = '') {
  if (!validAnimeId(anilistId)) return '';
  const params = new URLSearchParams({ language: audioPath(language) });
  if (parentOrigin) params.set('parentOrigin', parentOrigin);
  return `https://shonen.to/embed/anilist/${anilistId}/${episode}?${params}`;
}
export function buildTryEmbedUrl(id, episode = 1, language = 'sub', idType = 'anilist') {
  if (!validAnimeId(id)) return '';
  const path = idType === 'mal' ? `mal/${id}` : id;
  return `https://tryembed.us.cc/embed/anime/${path}/${episode}/${audioPath(language)}`;
}

export function buildStreamUrl(serverId, type, id, opts = {}) {
  const srv = SERVERS.find((s) => s.id === Number(serverId)) || SERVERS[0];
  const mediaType = type === 'movie' ? 'movie' : 'tv';
  if (mediaType === 'tv') {
    return srv.buildTvUrl(id, opts.season || 1, opts.episode || 1, opts);
  }
  return srv.buildMovieUrl(id, opts);
}

export const DOWNLOAD_SOURCES = [
  {
    id: 1,
    label: 'Source 1',
    subtitle: 'Multi-quality MP4 / MKV + built-in subtitles (480p · 720p · 1080p)',
    movie: (id) => `https://dl.vidsrc.party/movie/${id}`,
    tv: (id, season = 1, episode = 1) => `https://dl.vidsrc.party/tv/${id}/${season}/${episode}`,
    directQualities: (type, id, season = 1, episode = 1) => {
      const base =
        type === 'movie'
          ? `https://dl.vidsrc.party/download/movie/${id}`
          : `https://dl.vidsrc.party/download/tv/${id}/${season}/${episode}`;
      return [
        { label: '1080p MP4', href: `${base}?quality=1080p` },
        { label: '720p MP4', href: `${base}?quality=720p` },
        { label: '480p MP4', href: `${base}?quality=480p` },
        { label: '1080p MKV (EN Sub)', href: `${base}?quality=1080p&format=mkv&sub=en` },
      ];
    },
  },
  {
    id: 2,
    label: 'Source 2',
    subtitle: 'Instant pre-converted direct downloads (360p · 720p · 1080p)',
    movie: (id) => `https://vidvault.to/movie/${id}`,
    tv: (id, season = 1, episode = 1) => `https://vidvault.to/tv/${id}/${season}/${episode}`,
  },
];

export function buildDownloadUrl(sourceId, type, id, { season = 1, episode = 1 } = {}) {
  const src = DOWNLOAD_SOURCES.find((s) => s.id === Number(sourceId)) || DOWNLOAD_SOURCES[0];
  return type === 'movie' ? src.movie(id) : src.tv(id, season, episode);
}

/**
 * Parse live watch progress events from supported streaming servers:
 * - Server 2 JSON postMessage: { id, type, progress, timestamp, duration, season, episode }
 * - Server 3 postMessage: { type: "TGFLIX_EVENT", event, currentTime, duration, paused }
 * - Server 1 postMessage: { type: "PLAYER_EVENT", data: { event: "playerstatus", currentTime, duration, playing } }
 */
export function parsePlayerMessage(raw) {
  let payload = raw;
  if (typeof raw === 'string') {
    try {
      payload = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!payload || typeof payload !== 'object') return null;

  const inner =
    payload.data && typeof payload.data === 'object'
      ? { ...payload, ...payload.data }
      : payload;

  const eventName = String(inner.event || inner.type || '').toLowerCase().replace(/^framextv:/, '');
  const ended = ['ended', 'complete', 'completed', 'videoended'].includes(eventName);

  const pickNum = (keys) => {
    for (const k of keys) {
      const v = Number(inner[k]);
      if (Number.isFinite(v) && v >= 0) return v;
    }
    return NaN;
  };

  let timestamp = pickNum(['currentTime', 'timestamp', 'time', 'position', 'playedSeconds']);
  if (timestamp > 86400) timestamp = NaN; // ignore epoch timestamps

  const duration = pickNum(['duration', 'totalTime', 'totalDuration']);
  let progress = pickNum(['progress', 'percent', 'percentage']);

  if (Number.isFinite(timestamp) && Number.isFinite(duration) && duration > 0) {
    progress = (timestamp / duration) * 100;
  } else if (Number.isFinite(progress) && progress > 0 && progress <= 1) {
    progress *= 100;
  }

  if (!Number.isFinite(timestamp) && !Number.isFinite(progress) && !ended) {
    return null;
  }

  const season = pickNum(['season', 'seasonNumber']);
  const episode = pickNum(['episode', 'episodeNumber']);

  return {
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    duration: Number.isFinite(duration) ? duration : 0,
    progress: ended ? 100 : Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 2,
    season: Number.isFinite(season) && season > 0 ? season : undefined,
    episode: Number.isFinite(episode) && episode > 0 ? episode : undefined,
    ended,
  };
}
