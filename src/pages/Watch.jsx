import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Info,
  Loader2,
  Maximize2,
  Play,
  RotateCcw,
  Sparkles,
  Star,
} from 'lucide-react';
import { IMG, api, runtimeLabel, titleOf, yearOf } from '../lib/tmdb';
import {
  ANIME_SERVER_ID,
  LIBRARY_SERVER_ID,
  PLAYERS,
  absoluteEpisode,
  downloadUrl,
  isAnimeTitle,
  megaplayUrl,
  parseProgressMessage,
  playerUrl,
} from '../lib/sources';
import { resolveAnime } from '../lib/anime';
import { ABYSS_CONFIGURED, resolveAbyss } from '../lib/abyss';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { cx, secondsToClock } from '../lib/utils';
import DownloadModal from '../components/DownloadModal';
import { usePalette } from '../hooks/usePalette';
import { ambientBackground, paletteStyle } from '../lib/palette';

export default function Watch({ type = 'movie' }) {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, progressFor, saveProgress } = useLibrary();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [season, setSeason] = useState(Number(params.get('s')) || 1);
  const [episode, setEpisode] = useState(Number(params.get('e')) || 1);
  // null = auto (anime server for anime, otherwise the preferred server).
  const [serverChoice, setServerChoice] = useState(null);
  const [animeLang, setAnimeLang] = useState('sub');
  const [animeState, setAnimeState] = useState({ status: 'idle', key: '', mapping: null });
  const [abyssState, setAbyssState] = useState({ status: 'idle', url: null });
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [startAt, setStartAt] = useState(undefined);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [downloads, setDownloads] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const palette = usePalette(data?.poster_path ? IMG.poster(data.poster_path, 'w342') : null);
  const saved = progressFor({ id, type });
  const savedRef = useRef(saved);
  const lastSaveRef = useRef(0);
  const seasonRef = useRef(season);
  const episodeRef = useRef(episode);
  const startedRef = useRef(new Set());
  const progressRef = useRef(null);
  const metaRef = useRef(null);
  const baseRef = useRef(0);
  const elapsedRef = useRef(0);
  const activeSrcRef = useRef(false);
  const animeToastRef = useRef(false);

  savedRef.current = saved;
  seasonRef.current = season;
  episodeRef.current = episode;

  const isAnime = isAnimeTitle(data);

  const currentEpisode = useMemo(
    () => episodes.find((ep) => ep.episode_number === episode) || null,
    [episodes, episode]
  );

  /** Best known runtime in seconds (TMDB) — used until a player reports one. */
  const durationEstimate = useMemo(() => {
    if (!data) return 0;
    if (type === 'movie') return (Number(data.runtime) || 0) * 60;
    return (Number(currentEpisode?.runtime) || Number(data.episode_run_time?.[0]) || 0) * 60;
  }, [data, type, currentEpisode]);
  const durationEstimateRef = useRef(durationEstimate);
  durationEstimateRef.current = durationEstimate;

  const buildMeta = useCallback(() => {
    if (!data) return null;
    return {
      id,
      type,
      title: titleOf(data),
      poster: data.poster_path,
      backdrop: data.backdrop_path,
      rating: data.vote_average,
      year: yearOf(data),
    };
  }, [data, id, type]);
  metaRef.current = buildMeta() || metaRef.current;

  /* Load title metadata */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setServerChoice(null);
    setAnimeState({ status: 'idle', key: '', mapping: null });
    setAbyssState({ status: 'idle', url: null });
    animeToastRef.current = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    api
      .details(type, id)
      .then((res) => {
        if (!alive) return;
        setData(res);
        if (type === 'tv') {
          const fromParams = Number(params.get('s'));
          const resumeSeason = savedRef.current?.season;
          const nextSeason =
            (fromParams > 0 && fromParams) ||
            (resumeSeason && resumeSeason > 0 ? resumeSeason : 1) ||
            1;
          const resumeEpisode = savedRef.current?.episode || 1;
          setSeason(nextSeason);
          setEpisode(Number(params.get('e')) || resumeEpisode);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError('This title is unavailable right now.');
        setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id]);

  /* Episodes for the selected season */
  useEffect(() => {
    if (type !== 'tv' || !data) return;
    let alive = true;
    setEpisodesLoading(true);
    api
      .season(id, season)
      .then((res) => alive && setEpisodes(res.episodes || []))
      .catch(() => alive && setEpisodes([]))
      .finally(() => alive && setEpisodesLoading(false));
    return () => {
      alive = false;
    };
  }, [type, id, season, data]);

  /* Keep URL in sync so a refresh or share keeps the same episode */
  useEffect(() => {
    if (type !== 'tv') return;
    const next = new URLSearchParams(params);
    next.set('s', String(season));
    next.set('e', String(episode));
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, episode, type]);

  /* Resume position, only once per title/episode */
  useEffect(() => {
    if (!saved) return;
    if (type === 'tv' && (saved.season !== season || saved.episode !== episode)) return;
    setStartAt(saved.timestamp && saved.timestamp > 30 ? saved.timestamp : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type, season, episode]);

  const title = data ? titleOf(data) : '';
  const year = data ? yearOf(data) : '';

  /* ---------------- Server selection ---------------- */

  const preferredRaw = Number(settings.preferredServer) || 1;
  const preferredServer =
    preferredRaw === LIBRARY_SERVER_ID && !ABYSS_CONFIGURED
      ? 1
      : PLAYERS.some((p) => p.id === preferredRaw)
        ? preferredRaw
        : 1;
  const autoServer =
    isAnime && animeState.status !== 'failed' ? ANIME_SERVER_ID : preferredServer;
  const server = serverChoice ?? autoServer;

  /* Anime mapping (TMDB -> AniList/MAL), resolved once per title+season */
  useEffect(() => {
    if (!data || !isAnime) return;
    const key = `${id}:${season}`;
    if (animeState.key === key && animeState.status !== 'idle') return;
    let alive = true;
    setAnimeState({ status: 'loading', key, mapping: null });
    resolveAnime(data, { type, season }).then((mapping) => {
      if (!alive) return;
      if (mapping && (mapping.anilistId || mapping.malId)) {
        setAnimeState({ status: 'ready', key, mapping });
      } else {
        setAnimeState({ status: 'failed', key, mapping: null });
        if (!animeToastRef.current) {
          animeToastRef.current = true;
          toast('Anime source not found for this title — using the regular servers.', 'info');
        }
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isAnime, id, type, season]);

  const animeSrc = useMemo(() => {
    if (animeState.status !== 'ready' || !animeState.mapping) return null;
    const mapping = animeState.mapping;
    const ep =
      type === 'movie'
        ? 1
        : mapping.episodeMode === 'absolute'
          ? absoluteEpisode(data, season, episode)
          : episode;
    return megaplayUrl({ anilistId: mapping.anilistId, malId: mapping.malId, episode: ep, lang: animeLang });
  }, [animeState, data, type, season, episode, animeLang]);

  /* Personal-library file for Server 3 */
  useEffect(() => {
    if (server !== LIBRARY_SERVER_ID || !data) return;
    let alive = true;
    setAbyssState({ status: 'loading', url: null });
    resolveAbyss({ tmdbId: id, title, year, type, season, episode }).then((res) => {
      if (!alive) return;
      setAbyssState(
        res.status === 'found' ? { status: 'ready', url: res.url } : { status: res.status, url: null }
      );
    });
    return () => {
      alive = false;
    };
  }, [server, data, id, title, year, type, season, episode]);

  const embedSrc = useMemo(
    () =>
      playerUrl(typeof server === 'number' ? server : 1, type, id, {
        season,
        episode,
        startAt,
        autoplayNext: settings.autoplayNext,
        subtitle: settings.subtitles,
      }),
    [server, type, id, season, episode, startAt, settings.autoplayNext, settings.subtitles]
  );

  const src =
    server === ANIME_SERVER_ID
      ? animeSrc
      : server === LIBRARY_SERVER_ID
        ? abyssState.status === 'ready'
          ? abyssState.url
          : null
        : embedSrc;
  activeSrcRef.current = Boolean(src);

  const playerKey = `${server}-${season}-${episode}-${startAt || 'live'}-${animeLang}-${reloadNonce}`;

  /* ---------------- History / Continue Watching ---------------- */

  const persistProgress = useCallback(
    (p) => {
      if (!p?.meta?.title) return;
      saveProgress(p.meta, {
        progress: p.ended ? 100 : Math.min(99, Math.max(1, p.percent || 1)),
        timestamp: p.ended ? 0 : p.timestamp || 0,
        duration: p.duration || 0,
        season: p.meta.type === 'tv' ? p.season : undefined,
        episode: p.meta.type === 'tv' ? p.episode : undefined,
      });
    },
    [saveProgress]
  );

  /**
   * Register the title in history the moment the watch page opens.
   * Previously an entry was only created when the embedded player posted a
   * progress message in one exact format — most players never did, so
   * Continue Watching stayed empty.
   */
  useEffect(() => {
    if (!data) return;
    const key = `${type}:${id}:${season}:${episode}`;
    if (startedRef.current.has(key)) return;
    const meta = buildMeta();
    if (!meta?.title) return;
    startedRef.current.add(key);

    const existing = savedRef.current;
    const sameEpisode =
      existing &&
      (type !== 'tv' ||
        ((existing.season || 1) === season && (existing.episode || 1) === episode));
    progressRef.current = {
      meta,
      percent: sameEpisode ? existing.progress || 1 : 1,
      timestamp: sameEpisode ? existing.timestamp || 0 : 0,
      duration: sameEpisode ? existing.duration || durationEstimateRef.current : durationEstimateRef.current,
      season,
      episode,
      real: false,
      ended: false,
    };
    persistProgress(progressRef.current);
  }, [data, type, id, season, episode, buildMeta, persistProgress]);

  /* Reset the estimator baseline whenever the player reloads */
  useEffect(() => {
    baseRef.current = Number(startAt) || progressRef.current?.timestamp || 0;
    elapsedRef.current = 0;
    if (progressRef.current) progressRef.current.real = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerKey]);

  /* Real progress posted by the embedded player */
  useEffect(() => {
    const onMessage = (event) => {
      const parsed = parseProgressMessage(event.data);
      if (!parsed) return;
      if (parsed.mediaId && String(parsed.mediaId) !== String(id)) return;
      const meta = metaRef.current;
      if (!meta?.title) return;

      const next = {
        meta,
        percent: parsed.ended ? 100 : Math.min(99, parsed.percent || progressRef.current?.percent || 1),
        timestamp: parsed.ended ? 0 : parsed.current,
        duration: parsed.duration || progressRef.current?.duration || durationEstimateRef.current,
        season: type === 'tv' ? parsed.season || seasonRef.current : undefined,
        episode: type === 'tv' ? parsed.episode || episodeRef.current : undefined,
        real: true,
        ended: parsed.ended,
      };
      progressRef.current = next;
      baseRef.current = parsed.current || baseRef.current;
      elapsedRef.current = 0;

      const now = Date.now();
      if (!parsed.ended && !parsed.paused && now - lastSaveRef.current < 4000) return;
      lastSaveRef.current = now;
      persistProgress(next);

      if (parsed.ended && type === 'tv' && settings.autoplayNext) {
        toast('Episode finished — saving your place.', 'info');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [id, type, persistProgress, settings.autoplayNext, toast]);

  /**
   * Fallback estimator for silent players (no postMessage): while the tab
   * is visible and no real progress has arrived, advance the resume point
   * by elapsed watch time against the TMDB runtime. Capped at 96% so an
   * estimate never marks a title finished.
   */
  useEffect(() => {
    if (!data) return;
    const timer = window.setInterval(() => {
      if (document.hidden || !activeSrcRef.current) return;
      const p = progressRef.current;
      if (!p || p.real || p.ended || !p.meta?.title) return;
      elapsedRef.current += 10;
      const timestamp = baseRef.current + elapsedRef.current;
      const duration = p.duration || durationEstimateRef.current || 0;
      const percent =
        duration > 0 ? Math.min(96, (timestamp / duration) * 100) : Math.max(1, p.percent || 1);
      progressRef.current = { ...p, timestamp, duration, percent };
      persistProgress(progressRef.current);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [data, persistProgress]);

  /* Final save when leaving the watch page */
  useEffect(() => {
    return () => {
      if (progressRef.current?.meta?.title) persistProgress(progressRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- Controls ---------------- */

  const selectServer = (choice) => {
    const ts = progressRef.current?.timestamp;
    if (ts && ts > 30) setStartAt(Math.floor(ts)); // carry the position over
    setServerChoice(choice);
  };

  const changeSeason = (next) => {
    setSeason(next);
    setEpisode(1);
    setStartAt(undefined);
  };

  const changeEpisode = (next) => {
    setEpisode(next);
    setStartAt(undefined);
  };

  const startOver = () => {
    setStartAt(undefined);
    setReloadNonce((n) => n + 1);
    baseRef.current = 0;
    elapsedRef.current = 0;
    const meta = buildMeta();
    if (meta) {
      progressRef.current = {
        meta,
        percent: 1,
        timestamp: 0,
        duration: progressRef.current?.duration || durationEstimateRef.current,
        season,
        episode,
        real: false,
        ended: false,
      };
      persistProgress(progressRef.current);
    }
    toast('Restarting from the beginning.', 'info');
  };

  const upNext = useMemo(() => {
    if (type !== 'tv') return null;
    const index = episodes.findIndex((ep) => ep.episode_number === episode);
    return index >= 0 ? episodes[index + 1] || null : null;
  }, [episodes, episode, type]);

  if (loading) {
    return (
      <div className="container-page pt-[92px]">
        <div className="skeleton mb-4 h-6 w-52 rounded" />
        <div className="skeleton aspect-video w-full rounded-2xl" />
        <div className="mt-5 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-10 w-28 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-page grid min-h-[70vh] place-items-center pt-24 text-center">
        <div>
          <p className="text-lg font-semibold">{error || 'Stream unavailable'}</p>
          <button onClick={() => navigate(-1)} className="btn-ghost mt-6">
            <ArrowLeft size={16} /> Go back
          </button>
        </div>
      </div>
    );
  }

  const serverNote =
    server === ANIME_SERVER_ID
      ? 'Anime server — if this episode is missing here, the regular servers below usually have it too.'
      : server === LIBRARY_SERVER_ID
        ? 'Server 3 streams from the personal library when a matching file exists.'
        : server === 4
          ? 'Server 4 loads a full watch page inside the player — use its own controls to start playback.'
          : 'Stream not starting? Switch to another server — each one runs its own source.';

  return (
    <div className="relative pb-16 pt-[86px]" style={paletteStyle(palette)}>
      <div
        aria-hidden
        className="fade-bottom pointer-events-none absolute inset-x-0 top-0 h-[95vh] opacity-70 transition-opacity duration-1000"
        style={{ background: ambientBackground(palette, 0.9) }}
      />
      <div className="container-page relative">
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            onClick={() => navigate(`/${type}/${id}`)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/60 transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeft size={14} /> Back to details
          </button>
          <h1 className="text-[15px] font-semibold text-white/90 sm:text-[17px]">
            {title}
            {year && <span className="ml-2 font-normal text-white/35">{year}</span>}
          </h1>
          {type === 'tv' && (
            <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11.5px] font-medium text-white/55">
              S{season} · E{episode}
              {currentEpisode?.name ? ` — ${currentEpisode.name}` : ''}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDownloads(true)} className="chip py-2">
              <Download size={14} /> Download
            </button>
            <Link to={`/${type}/${id}`} className="chip py-2">
              <Info size={14} /> Details
            </Link>
          </div>
        </div>

        {/* Player */}
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_36px_90px_-40px_rgb(var(--brand)/0.9)] ring-1 ring-brand/20">
          <div className="relative aspect-video w-full">
            {src ? (
              <iframe
                key={playerKey}
                src={src}
                title={`${title} player`}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="origin"
                className="absolute inset-0 h-full w-full"
              />
            ) : server === ANIME_SERVER_ID ? (
              <PlayerNotice
                loading={animeState.status === 'loading'}
                title={animeState.status === 'loading' ? 'Finding the anime source…' : 'Anime source not found'}
                body={
                  animeState.status === 'loading'
                    ? 'Matching this title on the anime server.'
                    : "This title isn't mapped on the anime server yet. The regular servers below should have it."
                }
                onSwitch={() => selectServer(1)}
              />
            ) : (
              <PlayerNotice
                loading={abyssState.status === 'loading'}
                title={
                  abyssState.status === 'loading'
                    ? 'Searching the library…'
                    : abyssState.status === 'unconfigured'
                      ? "Server 3 isn't available yet"
                      : abyssState.status === 'error'
                        ? 'Library unreachable'
                        : 'Not in the library yet'
                }
                body={
                  abyssState.status === 'loading'
                    ? 'Looking for a matching file in the personal library.'
                    : abyssState.status === 'unconfigured'
                      ? "This server plays files from a personal library and hasn't been configured on this site. Pick another server below."
                      : abyssState.status === 'error'
                        ? "The personal library couldn't be reached right now. Pick another server below."
                        : 'No matching file was found in the personal library for this title. Pick another server below.'
                }
                onSwitch={() => selectServer(1)}
              />
            )}
          </div>
        </div>

        {/* Server switcher */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">
            Servers
          </span>
          {isAnime && (
            <button
              onClick={() => selectServer(ANIME_SERVER_ID)}
              className={cx(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition duration-300',
                server === ANIME_SERVER_ID
                  ? 'border-white bg-white text-ink-950 shadow-[0_8px_26px_-12px_rgba(255,255,255,0.6)]'
                  : 'border-white/12 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white'
              )}
            >
              {server === ANIME_SERVER_ID ? <Check size={14} /> : <Sparkles size={13} />}
              Anime
            </button>
          )}
          {PLAYERS.map((s) => (
            <button
              key={s.id}
              onClick={() => selectServer(s.id)}
              className={cx(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition duration-300',
                server === s.id
                  ? 'border-white bg-white text-ink-950 shadow-[0_8px_26px_-12px_rgba(255,255,255,0.6)]'
                  : 'border-white/12 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white'
              )}
            >
              {server === s.id ? <Check size={14} /> : <Play size={13} />}
              Server {s.id}
            </button>
          ))}

          <button onClick={startOver} className="chip ml-auto py-2">
            <RotateCcw size={13} /> Start over
          </button>
        </div>

        {/* Sub / Dub for the anime server */}
        {server === ANIME_SERVER_ID && (
          <div className="mt-3 flex items-center gap-2">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">
              Audio
            </span>
            {[
              { id: 'sub', label: 'Sub' },
              { id: 'dub', label: 'Dub' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setAnimeLang(opt.id)}
                className={cx(
                  'rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition duration-300',
                  animeLang === opt.id
                    ? 'border-brand bg-brand/20 text-white ring-1 ring-brand/40'
                    : 'border-white/12 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white'
                )}
              >
                {opt.label}
              </button>
            ))}
            <span className="text-[11px] text-white/30">Japanese audio with subtitles, or English dub when available.</span>
          </div>
        )}

        <p className="mt-2.5 text-[11.5px] text-white/30">{serverNote}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Overview */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-white/45">
              {data.vote_average > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-white/75">
                  <Star size={12} className="fill-gold text-gold" />
                  {Number(data.vote_average).toFixed(1)}
                </span>
              )}
              {data.genres?.slice(0, 4).map((g) => (
                <span key={g.id} className="chip py-1 text-[11px]">
                  {g.name}
                </span>
              ))}
              {type === 'movie' && data.runtime ? (
                <span>{runtimeLabel(data.runtime)}</span>
              ) : null}
            </div>

            <h2 className="text-[18px] font-bold tracking-tight">Overview</h2>
            <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-white/55">
              {type === 'tv' && currentEpisode?.overview
                ? currentEpisode.overview
                : data.overview || 'No overview available.'}
            </p>

            {upNext && (
              <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/30">
                  Up next
                </p>
                <button
                  onClick={() => changeEpisode(upNext.episode_number)}
                  className="group flex w-full items-center gap-3 text-left"
                >
                  <span className="relative w-[104px] shrink-0 overflow-hidden rounded-lg">
                    {upNext.still_path ? (
                      <img
                        src={IMG.backdrop(upNext.still_path, 'w300')}
                        alt=""
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <span className="grid aspect-video place-items-center bg-ink-800 text-[10px] text-white/25">
                        E{upNext.episode_number}
                      </span>
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                      <Play size={16} className="fill-white text-white" />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-white/85">
                      E{upNext.episode_number} · {upNext.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-white/35">
                      {upNext.overview || 'Next episode'}
                    </span>
                  </span>
                </button>
              </div>
            )}

            {saved && saved.duration > 0 && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11.5px] text-white/40">
                <Maximize2 size={12} />
                Resume point saved · {secondsToClock(Math.max(0, saved.duration - (saved.timestamp || 0)))} left
              </p>
            )}
          </div>

          {/* Episode panel / downloads */}
          <aside>
            {type === 'tv' ? (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-[14px] font-bold">Episodes</h2>
                  <div className="relative">
                    <select
                      value={season}
                      onChange={(e) => changeSeason(Number(e.target.value))}
                      className="appearance-none rounded-full border border-white/10 bg-ink-850 py-1.5 pl-3 pr-8 text-[11.5px] text-white/70 focus:border-brand-500 focus:outline-none"
                    >
                      {(data.seasons || [])
                        .filter((s) => s.season_number > 0)
                        .map((s) => (
                          <option key={s.id} value={s.season_number} className="bg-ink-850">
                            Season {s.season_number}
                          </option>
                        ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/35"
                    />
                  </div>
                </div>

                {episodesLoading ? (
                  <div className="grid place-items-center py-8 text-white/25">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                ) : (
                  <div className="no-scrollbar max-h-[430px] space-y-1 overflow-y-auto pr-1">
                    {(showAll ? episodes : episodes.slice(0, 12)).map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => changeEpisode(ep.episode_number)}
                        className={cx(
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition',
                          ep.episode_number === episode
                            ? 'bg-brand/20 text-white ring-1 ring-brand/40'
                            : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
                        )}
                      >
                        <span className="w-7 shrink-0 text-[11.5px] font-semibold text-white/35">
                          {ep.episode_number}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px]">
                          {ep.name || `Episode ${ep.episode_number}`}
                        </span>
                        {ep.runtime ? (
                          <span className="shrink-0 text-[10.5px] text-white/25">{ep.runtime}m</span>
                        ) : null}
                      </button>
                    ))}
                    {episodes.length > 12 && (
                      <button
                        onClick={() => setShowAll((v) => !v)}
                        className="w-full py-2 text-center text-[11.5px] font-medium text-brand-400 hover:text-brand-300"
                      >
                        {showAll ? 'Show fewer' : `Show all ${episodes.length}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <h2 className="mb-3 text-[14px] font-bold">Downloads</h2>
                <div className="space-y-2">
                  {[1, 2].map((sourceId) => (
                    <a
                      key={sourceId}
                      href={downloadUrl(sourceId, type, id)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12.5px] font-medium text-white/70 transition hover:border-brand/40 hover:text-white"
                    >
                      Source {sourceId}
                      <Download size={14} />
                    </a>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-white/30">
                  Choose 480p, 720p or 1080p on the provider page. External links.
                </p>
              </div>
            )}

            {(data.production_companies?.length > 0 || data.networks?.length > 0) && (
              <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <h2 className="mb-3 text-[14px] font-bold">
                  {type === 'tv' ? 'Networks' : 'Production'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(type === 'tv' ? data.networks || [] : data.production_companies)
                    .slice(0, 4)
                    .map((c) => (
                      <span
                        key={c.id}
                        className="grid h-9 min-w-[64px] place-items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-2"
                        title={c.name}
                      >
                        {c.logo_path ? (
                          <img
                            src={IMG.logo(c.logo_path, 'w154')}
                            alt={c.name}
                            className="max-h-5 max-w-[72px] object-contain opacity-75"
                          />
                        ) : (
                          <span className="text-[10px] text-white/45">{c.name}</span>
                        )}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <DownloadModal
        open={downloads}
        onClose={() => setDownloads(false)}
        type={type}
        id={id}
        title={`${title}${year ? ` (${year})` : ''}`}
        season={season}
        episode={episode}
      />
    </div>
  );
}

/** Placeholder shown inside the player frame while resolving / on failure. */
function PlayerNotice({ loading = false, title, body, onSwitch }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink-900/60 p-6 text-center">
      <div className="max-w-sm">
        {loading ? (
          <Loader2 size={22} className="mx-auto mb-3 animate-spin text-brand-400" />
        ) : (
          <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] text-white/50">
            <Play size={16} />
          </span>
        )}
        <p className="text-[14px] font-semibold text-white/85">{title}</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-white/40">{body}</p>
        {!loading && onSwitch && (
          <button onClick={onSwitch} className="btn-primary mx-auto mt-4 px-4 py-2 text-[12px]">
            <Play size={13} className="fill-current" /> Watch on Server 1
          </button>
        )}
      </div>
    </div>
  );
}
