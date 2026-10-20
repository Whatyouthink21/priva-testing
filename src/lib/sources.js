/**
 * Playback + download endpoints.
 *
 * Playback providers are intentionally numbered in the UI ("Server 1/2/3").
 * Their hostnames only appear here so the site never surfaces a provider name.
 */

const ACCENT = '3B82F6'; // Priva blue, passed to players that support theming

const join = (base, params) => {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== false && v !== '');
  if (!usable.length) return base;
  const search = new URLSearchParams();
  usable.forEach(([k, v]) => search.set(k, String(v)));
  return `${base}?${search.toString()}`;
};

export const PLAYERS = [
  {
    id: 1,
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
];

export function playerUrl(serverId, type, id, { season = 1, episode = 1, startAt, autoplayNext = true, subtitle } = {}) {
  const server = PLAYERS.find((p) => p.id === serverId) || PLAYERS[0];
  const opts = {
    startAt: startAt && startAt > 30 ? Math.floor(startAt) : undefined,
    autoplayNext,
    subtitle,
  };
  return type === 'tv' ? server.tv(id, season, episode, opts) : server.movie(id, opts);
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

/** Pull the first numeric progress value out of any third-party player message. */
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

  const current = Number(data.timestamp ?? data.currentTime);
  const duration = Number(data.duration);
  if (data.event && !['timeupdate', 'pause', 'seeked', 'ended'].includes(data.event)) return null;
  if (!Number.isFinite(current)) return null;

  const percent = Number(data.progress);
  return {
    current: Number.isFinite(current) ? current : 0,
    duration: Number.isFinite(duration) ? duration : 0,
    percent: Number.isFinite(percent)
      ? percent
      : Number.isFinite(duration) && duration > 0
        ? (current / duration) * 100
        : 0,
    season: data.season ? Number(data.season) : undefined,
    episode: data.episode ? Number(data.episode) : undefined,
    ended: data.event === 'ended',
  };
}
