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
  Star,
} from 'lucide-react';
import { IMG, api, runtimeLabel, titleOf, yearOf } from '../lib/tmdb';
import { PLAYERS, downloadUrl, parseProgressMessage, playerUrl } from '../lib/sources';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { cx, secondsToClock } from '../lib/utils';
import DownloadModal from '../components/DownloadModal';
import { usePalette } from '../hooks/usePalette';
import { colourGrade, meshBackground, paletteStyle } from '../lib/palette';

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
  const [server, setServer] = useState(Number(settings.preferredServer) || 1);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [startAt, setStartAt] = useState(undefined);
  const [downloads, setDownloads] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const palette = usePalette(data?.poster_path ? IMG.poster(data.poster_path, 'w342') : null);
  const saved = progressFor({ id, type });
  const savedRef = useRef(saved);
  const lastSaveRef = useRef(0);
  const seasonRef = useRef(season);
  const episodeRef = useRef(episode);

  savedRef.current = saved;
  seasonRef.current = season;
  episodeRef.current = episode;

  /* Load title metadata */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'instant' });
    api
      .details(type, id)
      .then((res) => {
        if (!alive) return;
        setData(res);
        if (type === 'tv') {
          const fromParams = Number(params.get('s'));
          const resumeSeason = saved?.season;
          const nextSeason =
            (fromParams > 0 && fromParams) ||
            (resumeSeason && resumeSeason > 0 ? resumeSeason : 1) ||
            1;
          const resumeEpisode = saved?.episode || 1;
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

  const currentEpisode = useMemo(
    () => episodes.find((ep) => ep.episode_number === episode) || null,
    [episodes, episode]
  );

  const src = useMemo(
    () =>
      playerUrl(server, type, id, {
        season,
        episode,
        startAt,
        autoplayNext: settings.autoplayNext,
        subtitle: settings.subtitles,
      }),
    [server, type, id, season, episode, startAt, settings.autoplayNext, settings.subtitles]
  );

  /* Persist playback progress sent by the embedded player */
  useEffect(() => {
    const onMessage = (event) => {
      const parsed = parseProgressMessage(event.data);
      if (!parsed) return;
      if (parsed.season && parsed.season !== seasonRef.current) return;

      const now = Date.now();
      const isBoundary = parsed.ended;
      if (!isBoundary && now - lastSaveRef.current < 5000) return;
      lastSaveRef.current = now;

      const meta = {
        id,
        type,
        title,
        poster: data?.poster_path,
        backdrop: data?.backdrop_path,
        rating: data?.vote_average,
        year,
      };
      if (!meta.title) return;

      saveProgress(meta, {
        progress: parsed.ended ? 100 : Math.min(99, parsed.percent || 1),
        timestamp: parsed.ended ? 0 : parsed.current,
        duration: parsed.duration || 0,
        season: type === 'tv' ? parsed.season || seasonRef.current : undefined,
        episode: type === 'tv' ? parsed.episode || episodeRef.current : undefined,
      });

      if (parsed.ended && type === 'tv' && settings.autoplayNext) {
        toast('Episode finished — saving your place.', 'info');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [id, type, title, data, year, saveProgress, settings.autoplayNext, toast]);

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
    const meta = {
      id,
      type,
      title,
      poster: data?.poster_path,
      backdrop: data?.backdrop_path,
      rating: data?.vote_average,
      year,
    };
    saveProgress(meta, {
      progress: 1,
      timestamp: 0,
      duration: 0,
      season: type === 'tv' ? season : undefined,
      episode: type === 'tv' ? episode : undefined,
    });
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
          {[1, 2, 3].map((i) => (
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

  return (
    <div className="relative pb-16 pt-[86px]" style={paletteStyle(palette)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-70 transition-opacity duration-1000"
        style={{ background: meshBackground(palette) }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[220px] mix-blend-color opacity-25"
        style={{ background: colourGrade(palette) }}
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
            <iframe
              key={`${server}-${season}-${episode}-${startAt || 'live'}`}
              src={src}
              title={`${title} player`}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="origin"
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>

        {/* Server switcher */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">
            Servers
          </span>
          {PLAYERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setServer(s.id)}
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
        <p className="mt-2.5 text-[11.5px] text-white/30">
          Stream not starting? Switch to another server — each one runs its own source.
        </p>

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
                Resume point saved · {secondsToClock(Math.max(0, saved.duration - (saved.timestamp || 0)))}
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
