/**
 * Playback + download endpoints.
 *
 * Playback providers are intentionally numbered in the UI ("Server 1/2/3/4"
 * plus an "Anime" server on anime titles). Their hostnames only appear here
 * (and in the resolver modules) so the site never surfaces a provider name.
 *
 * Servers:
 *   1 — embed player (themed, resume position, episode selector)
 *   2 — embed player (start time, episode selector)
 *   3 — embed player (start time)
 *   4 — full watch-page embed (no clean player endpoint upstream)
 *   "anime" — anime-only player; TMDB ids are mapped to AniList/MAL ids by
 *       src/lib/anime.js first. playerUrl returns null.
 */

const ACCENT = '3B82F6'; // Priva blue, passed to players that support theming

const join = (base, params) => {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== false && v !== '');
  if (!usable.length) return base;
  const search = new URLSearchParams();
  usable.forEach(([k, v]) => search.set(k, String(v)));
  return `${base}?${search.toString()}`;
};

export const ANIME_SERVER_ID = 'anime';

export const PLAYERS = [
  {
    id: 1,
    kind: 'embed',
    movie: (id, opts = {}) =>
      join(`https://vidstuck.cc/embed/movie/${id}`, {
        color: ACCENT,
        branding: 'Priva',
        subtitle: opts.subtitle,
        progress: opts.startAt,
      }),
    tv: (id, season, episode, opts = {}) =>
      join(`https://vidstuck.cc/embed/tv/${id}/${season}/${episode}`, {
        color: ACCENT,
        branding: 'Priva',
        subtitle: opts.subtitle,
        progress: opts.startAt,
        nextEpisode: opts.autoplayNext ? 'true' : undefined,
        autoplayNextEpisode: opts.autoplayNext ? 'true' : undefined,
        episodeSelector: 'true',
      }),
  },
  {
    id: 2,
    kind: 'embed',
    movie: (id, opts = {}) =>
      join(`https://tgvid.lovable.app/embed/movie/${id}`, {
        color: ACCENT,
        back: 'false',
        t: opts.startAt,
        lang: opts.lang,
      }),
    tv: (id, season, episode, opts = {}) =>
      join(`https://tgvid.lovable.app/embed/tv/${id}/${season}/${episode}`, {
        color: ACCENT,
        back: 'false',
        t: opts.startAt,
        episodeSelector: 'true',
        autoplayNextEp: opts.autoplayNext ? 'true' : 'false',
        lang: opts.lang,
      }),
  },
  {
    id: 3,
    kind: 'embed',
    movie: (id, opts = {}) =>
      join(`https://zoryva.me/embed/movie/${id}`, {
        color: ACCENT,
        startAt: opts.startAt,
      }),
    tv: (id, season, episode, opts = {}) =>
      join(`https://zoryva.me/embed/tv/${id}/${season}/${episode}`, {
        color: ACCENT,
        startAt: opts.startAt,
      }),
  },
  {
    // Full watch page, embedded as-is (upstream has no /embed endpoint).
    id: 4,
    kind: 'page',
    movie: (id) => `https://bingr.one/watch/movie/${id}`,
    tv: (id, season, episode) => `https://bingr.one/watch/tv/${id}/${season}/${episode}`,
  },
];

export function playerUrl(serverId, type, id, { season = 1, episode = 1, startAt, autoplayNext = true, subtitle } = {}) {
  // The anime server is resolved asynchronously in Watch.jsx.
  if (serverId === ANIME_SERVER_ID) return null;
  const server = PLAYERS.find((p) => p.id === serverId) || PLAYERS[0];
  const opts = {
    startAt: startAt && startAt > 30 ? Math.floor(startAt) : undefined,
    autoplayNext,
    subtitle,
  };
  return type === 'tv' ? server.tv(id, season, episode, opts) : server.movie(id, opts);
}

/* ------------------------------------------------------------------ */
/* Anime server (MegaPlay via AniList / MAL ids)                       */
/* ------------------------------------------------------------------ */

/** TMDB detail -> is this a Japanese animation title? */
export function isAnimeTitle(detail) {
  if (!detail) return false;
  const animated = (detail.genres || []).some((g) => g.id === 16);
  if (!animated) return false;
  const japanese =
    detail.original_language === 'ja' ||
    (Array.isArray(detail.origin_country) && detail.origin_country.includes('JP'));
  return japanese;
}

/**
 * TMDB splits shows into seasons; long-running anime catalogs usually count
 * episodes continuously. Sum the episode counts of earlier seasons to get
 * an absolute episode number (season 1 episode numbers pass through).
 */
export function absoluteEpisode(detail, season = 1, episode = 1) {
  if (!detail || season <= 1) return episode;
  const previous = (detail.seasons || [])
    .filter((s) => s.season_number > 0 && s.season_number < season)
    .reduce((sum, s) => sum + (Number(s.episode_count) || 0), 0);
  return previous + episode;
}

/**
 * Build the anime embed URL once tmdb -> AniList/MAL mapping is known.
 * AniList ids are preferred; MAL is the fallback. lang: 'sub' | 'dub'.
 */
export function megaplayUrl({ anilistId, malId, episode = 1, lang = 'sub' } = {}) {
  const language = lang === 'dub' ? 'dub' : 'sub';
  const ep = Math.max(1, Number(episode) || 1);
  if (anilistId) return `https://megaplay.buzz/stream/ani/${anilistId}/${ep}/${language}`;
  if (malId) return `https://megaplay.buzz/stream/mal/${malId}/${ep}/${language}`;
  return null;
}

export const DOWNLOAD_SOURCES = [
  {
    id: 1,
    movie: (id) => `https://dl.vidsrc.party/movie/${id}`,
    tv: (id, season, episode) => `https://dl.vidsrc.party/tv/${id}/${season}/${episode}`,
  },
  {
    id: 2,
    movie: (id) => `https://vidvault.to/movie/${id}`,
    tv: (id, season, episode) => `https://vidvault.to/tv/${id}/${season}/${episode}`,
  },
];

export function downloadUrl(sourceId, type, id, { season = 1, episode = 1 } = {}) {
  const source = DOWNLOAD_SOURCES.find((s) => s.id === sourceId) || DOWNLOAD_SOURCES[0];
  return type === 'tv' ? source.tv(id, season, episode) : source.movie(id);
}

/* ------------------------------------------------------------------ */
/* Progress messages                                                   */
/* ------------------------------------------------------------------ */

const ENDED_EVENTS = ['ended', 'complete', 'completed', 'finish', 'finished', 'end', 'playbackfinished', 'videoended'];

function firstNumber(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (value && typeof value === 'object') {
      // e.g. episode: { number: 3 } / { episode_number: 3 }
      const nested = Number(value.number ?? value.episode_number ?? value.value);
      if (Number.isFinite(nested)) return nested;
      continue;
    }
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return NaN;
}

/**
 * Pull playback progress out of any third-party player postMessage.
 *
 * Players disagree wildly on shape, so this accepts the common dialects:
 *  - { event: 'timeupdate', currentTime, duration }
 *  - { event: 'time', time, duration, percent }          (anime server)
 *  - { type: 'watching-log', currentTime, duration }     (anime server)
 *  - { data: { currentTime, duration, progress } }       (wrapped payloads)
 *  - { played: 0.42 } fraction-style progress
 * Returns percent always normalised to 0–100.
 */
export function parseProgressMessage(raw) {
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;

  // Unwrap one level of envelope ({ data: {...} }, { payload: {...} }).
  const inner =
    data.data && typeof data.data === 'object'
      ? data.data
      : data.payload && typeof data.payload === 'object'
        ? data.payload
        : null;
  const msg = inner ? { ...data, ...inner } : data;

  const eventName = String(msg.event || msg.type || msg.name || msg.action || '').toLowerCase();
  const ended = ENDED_EVENTS.includes(eventName) || msg.ended === true;
  const paused = eventName === 'pause' || eventName === 'paused' || msg.paused === true;

  let current = firstNumber(msg, [
    'currentTime',
    'current_time',
    'time',
    'timestamp',
    'position',
    'playedSeconds',
    'current',
    'seekPosition',
  ]);
  // Epoch timestamps (ms/s) sometimes travel in `timestamp`/`time` — they are
  // not playback positions.
  if (Number.isFinite(current) && (current > 60 * 60 * 24 || current < 0)) current = NaN;

  const duration = firstNumber(msg, ['duration', 'totalTime', 'durationSeconds', 'totalDuration', 'total_duration', 'length']);

  // Percent: prefer computing from current/duration. Otherwise use explicit
  // fields — `percent` means 0–100, fraction-style fields mean 0–1.
  let percent = NaN;
  if (Number.isFinite(current) && Number.isFinite(duration) && duration > 0) {
    percent = (current / duration) * 100;
  } else {
    const asPercent = firstNumber(msg, ['percent', 'percentage']);
    const asFraction = firstNumber(msg, ['progress', 'played', 'ratio']);
    if (Number.isFinite(asPercent)) percent = asPercent;
    else if (Number.isFinite(asFraction)) percent = asFraction > 1 ? asFraction : asFraction * 100;
  }

  if (!Number.isFinite(current) && !Number.isFinite(percent) && !ended) return null;

  // If we only have a percent, derive an approximate position when possible.
  if (!Number.isFinite(current) && Number.isFinite(percent) && Number.isFinite(duration) && duration > 0) {
    current = (percent / 100) * duration;
  }

  const season = firstNumber(msg, ['season', 'seasonNumber', 'season_number', 'currentSeason']);
  const episode = firstNumber(msg, ['episode', 'episodeNumber', 'episode_number', 'currentEpisode']);
  const mediaId = msg.tmdbId ?? msg.tmdb_id ?? msg.mediaId ?? msg.contentId;

  return {
    current: Number.isFinite(current) ? current : 0,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
    percent: Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0,
    season: Number.isFinite(season) && season > 0 ? season : undefined,
    episode: Number.isFinite(episode) && episode > 0 ? episode : undefined,
    ended,
    paused,
    mediaId: mediaId !== undefined && mediaId !== null ? String(mediaId) : undefined,
  };
}
