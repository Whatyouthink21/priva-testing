import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Download,
  Info,
  Loader2,
  Play,
  Plus,
  SkipForward,
} from 'lucide-react';
import PosterCard from '../components/PosterCard';
import DownloadModal from '../components/DownloadModal';
import {
  api,
  extractCertification,
  formatRuntime,
  formatScore,
  IMG,
  isAnimeItem,
  normalizeItem,
  pickBestLogo,
  titleOf,
  yearOf,
} from '../lib/tmdb';
import { resolveAnimePlayback } from '../lib/animePlayback';
import { buildZokoAnimeUrl, buildMegaPlayAnimeUrl, buildTryEmbedAnimeUrl, buildStreamUrl, parsePlayerMessage, SERVERS } from '../lib/sources';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';

export default function Watch({ type: propType = 'movie' }) {
  const params = useParams();
  const type = params.type === 'tv' ? 'tv' : params.type === 'movie' ? 'movie' : propType;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    settings,
    updateSettings,
    saveWatchProgress,
    getProgress,
    isInList,
    toggleMyList,
  } = useLibrary();
  const { toast } = useToast();

  const numericId = useMemo(() => {
    const m = String(params.id || '').match(/\d+/);
    return m ? Number(m[0]) : Number(params.id);
  }, [params.id]);

  const season = Number(params.season || searchParams.get('season') || 1);
  const episode = Number(params.episode || searchParams.get('episode') || 1);

  const [serverId, setServerId] = useState(1);
  const [animeLanguage, setAnimeLanguage] = useState('sub');
  const [malId, setMalId] = useState('');
  const [mappingStatus, setMappingStatus] = useState('loading');
  const serverChoiceRef = useRef(null);
  const [animeEpisode, setAnimeEpisode] = useState(episode);
  const [detail, setDetail] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(season);
  const [loading, setLoading] = useState(true);
  const [frameLoading, setFrameLoading] = useState(true);
  const [downloadOpen, setDownloadOpen] = useState(false);

  // Capture initial resume time once per title/episode load so live progress updates don't reload iframe
  const playerRef = useRef(null);
  const initialResumeRef = useRef(0);
  const detailRef = useRef(null);
  const currentEpRef = useRef(null);

  useEffect(() => {
    const existing = getProgress(type, numericId);
    if (
      existing &&
      (type === 'movie' || (existing.season === season && existing.episode === episode))
    ) {
      initialResumeRef.current = existing.timestamp || 0;
    } else {
      initialResumeRef.current = 0;
    }
    setSelectedSeason(season);
    setFrameLoading(true);
  }, [type, numericId, season, episode]);

  useEffect(() => {
    if (!numericId) return undefined;
    let cancelled = false;
    setLoading(true);

    api
      .fullDetail(type, numericId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        detailRef.current = data;
        const name = titleOf(data);
        document.title =
          type === 'tv'
            ? `Watching: ${name} · S${season} E${episode} · Priva`
            : `Watching: ${name} · Priva`;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type, numericId, season, episode]);

  useEffect(() => {
    if (type !== 'tv' || !numericId) return undefined;
    let cancelled = false;

    api
      .season(numericId, selectedSeason)
      .then((res) => {
        if (!cancelled) setEpisodes(res.episodes || []);
      })
      .catch(() => {
        if (!cancelled) setEpisodes([]);
      });

    return () => {
      cancelled = true;
    };
  }, [type, numericId, selectedSeason]);

  const currentEpisode = useMemo(
    () => episodes.find((e) => e.episode_number === episode) || null,
    [episodes, episode]
  );

  useEffect(() => {
    currentEpRef.current = currentEpisode;
  }, [currentEpisode]);

  // Immediately record entry in Continue Watching + Because You Watched when playback begins
  useEffect(() => {
    if (!detail) return;
    const existing = getProgress(type, numericId);
    const sameTarget =
      existing &&
      (type === 'movie' || (existing.season === season && existing.episode === episode));

    saveWatchProgress({
      id: numericId,
      type,
      isAnime: isAnimeItem(detail),
      title: titleOf(detail),
      poster: detail.poster_path,
      backdrop: detail.backdrop_path,
      episodeStill: currentEpisode?.still_path || null,
      episodeName: currentEpisode?.name || '',
      season,
      episode,
      timestamp: sameTarget ? existing.timestamp : 0,
      duration:
        sameTarget && existing.duration
          ? existing.duration
          : ((type === 'movie' ? detail.runtime : currentEpisode?.runtime) || 45) * 60,
      progress: sameTarget ? Math.max(8, existing.progress) : 8,
      rating: detail.vote_average,
      year: yearOf(detail),
    });
  }, [detail, currentEpisode, type, numericId, season, episode]);

  // Accept playback telemetry only from the active iframe.
  useEffect(() => {
    const onMessage = (event) => {
      const frame = playerRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      try { if (event.origin !== new URL(frame.src).origin) return; } catch { return; }
      const parsed = parsePlayerMessage(event.data);
      if (!parsed || !detailRef.current) return;

      const d = detailRef.current;
      const epMeta = currentEpRef.current;

      saveWatchProgress({
        id: numericId,
        type,
        isAnime: isAnimeItem(d),
        title: titleOf(d),
        poster: d.poster_path,
        backdrop: d.backdrop_path,
        episodeStill: epMeta?.still_path || null,
        episodeName: epMeta?.name || '',
        // Anime providers use MAL-local numbering; keep library progress in TMDB coordinates.
        season: ['anime1', 'anime2', 'anime3'].includes(serverId) ? season : parsed.season || season,
        episode: ['anime1', 'anime2', 'anime3'].includes(serverId) ? episode : parsed.episode || episode,
        timestamp: parsed.timestamp,
        duration: parsed.duration,
        progress: parsed.progress,
        ended: parsed.ended,
        rating: d.vote_average,
        year: yearOf(d),
      });

      if (parsed.ended && type === 'tv' && settings.autoplayNext) {
        const nextEp = episodes.find((x) => x.episode_number === episode + 1);
        if (nextEp) {
          navigate(`/watch/tv/${numericId}/${season}/${nextEp.episode_number}`);
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [numericId, type, season, episode, episodes, settings.autoplayNext, navigate, saveWatchProgress, serverId]);

  const anime = Boolean(detail && isAnimeItem(detail));
  const titleKey = `${type}-${numericId}`;
  useEffect(() => {
    if (!detail || Number(detail.id) !== numericId) return;
    if (serverChoiceRef.current !== titleKey) {
      setServerId(anime ? 'anime1' : 1);
    }
  }, [anime, detail, numericId, titleKey]);

  useEffect(() => {
    setMalId('');
    setAnimeEpisode(type === 'movie' ? 1 : episode);
    if (!anime || Number(detail?.id) !== numericId) return;
    let cancelled = false;
    setMappingStatus('loading');
    resolveAnimePlayback(type, numericId, type === 'movie' ? 1 : season, type === 'movie' ? 1 : episode, detail, api.season)
      .then((mapping) => {
        if (cancelled) return;
        if (mapping) {
          setMalId(mapping.malId);
          setAnimeEpisode(mapping.episode);
          setMappingStatus('ready');
        } else setMappingStatus('missing');
      })
      .catch(() => { if (!cancelled) setMappingStatus('error'); });
    return () => { cancelled = true; };
  }, [anime, numericId, type, season, episode, detail]);

  const streamSrc = useMemo(() => {
    if (serverId === 'anime1') return buildZokoAnimeUrl(malId, animeEpisode, animeLanguage);
    if (serverId === 'anime2') return buildMegaPlayAnimeUrl(malId, animeEpisode, animeLanguage);
    if (serverId === 'anime3') return buildTryEmbedAnimeUrl(malId, animeEpisode, animeLanguage);
    return buildStreamUrl(serverId, type, numericId, {
      season, episode, startAt: initialResumeRef.current,
      autoplayNext: Boolean(settings.autoplayNext),
    });
  }, [serverId, type, numericId, season, episode, settings.autoplayNext, malId, animeEpisode, animeLanguage]);

  useEffect(() => { setFrameLoading(true); }, [streamSrc]);

  const title = detail ? titleOf(detail) : 'Loading...';
  const year = detail ? yearOf(detail) : '';
  const score = detail ? formatScore(detail.vote_average) : null;
  const cert = detail ? extractCertification(detail, type) : null;
  const logoPath = detail ? pickBestLogo(detail.images) : null;
  const validSeasons = (detail?.seasons || []).filter((s) => s.season_number > 0);
  const normalizedSelf = detail ? normalizeItem(detail, type) : null;
  const saved = normalizedSelf ? isInList(normalizedSelf) : false;

  const nextEpisodeObj = useMemo(() => {
    if (type !== 'tv' || !episodes.length) return null;
    if (selectedSeason !== season) return null;
    return episodes.find((e) => e.episode_number === episode + 1) || null;
  }, [type, episodes, selectedSeason, season, episode]);

  const related = useMemo(() => {
    if (!detail) return [];
    const seen = new Set([numericId]);
    const out = [];
    for (const r of [
      ...(detail.recommendations?.results || []),
      ...(detail.similar?.results || []),
    ]) {
      if (!r?.id || seen.has(r.id) || !r.poster_path) continue;
      seen.add(r.id);
      out.push(normalizeItem(r, type));
      if (out.length >= 14) break;
    }
    return out;
  }, [detail, numericId, type]);

  return (
    <div className="min-h-screen bg-[#0f1014] pb-16">
      {/* Top Cinema Control Bar */}
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0a0b0e]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/${type}/${numericId}`)}
            aria-label="Back to details"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white transition hover:bg-white/[0.18]"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate font-display text-[15px] font-bold text-white sm:text-[17px]">
              {title}
            </h1>
            {type === 'tv' && (
              <p className="truncate text-[12px] font-medium text-[#8f98b2]">
                S{season} E{episode}
                {currentEpisode?.name ? ` · ${currentEpisode.name}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Streaming sources */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#16181f] p-1 ring-1 ring-white/[0.08]">
            {[...SERVERS, ...(anime ? [{ id: 'anime1', label: 'ANIME 1' }, { id: 'anime2', label: 'ANIME 2' }, { id: 'anime3', label: 'ANIME 3' }] : [])].map((srv) => (
              <button
                key={srv.id}
                type="button"
                onClick={() => {
                  serverChoiceRef.current = titleKey;
                  setServerId(srv.id);
                  setFrameLoading(true);
                }}
                className={`rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold transition ${
                  serverId === srv.id
                    ? 'bg-white text-[#0f1014] shadow'
                    : 'text-[#8f98b2] hover:text-white'
                }`}
              >
                {srv.label}
                {srv.tags && <span className="mt-0.5 block text-[9px] font-medium opacity-75">{srv.tags.join(' · ')}</span>}
              </button>
            ))}
          </div>

          {['anime1', 'anime2', 'anime3'].includes(serverId) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#8f98b2]">
              <label>Audio <select aria-label="Anime language" value={animeLanguage} onChange={(e) => { setAnimeLanguage(e.target.value); setFrameLoading(true); }} className="rounded-lg bg-[#16181f] p-2 text-white"><option value="sub">Sub</option>{serverId === 'anime1' && <option value="hsub">Hard-sub</option>}<option value="dub">Dub</option></select></label>
              <label>MAL ID <input disabled={mappingStatus === 'loading'} aria-label="MyAnimeList ID" type="number" min="1" value={malId} onChange={(e) => { setMalId(e.target.value); setFrameLoading(true); }} className="w-24 rounded-lg bg-[#16181f] p-2 text-white" /></label>
              <label>Anime episode <input disabled={mappingStatus === 'loading'} aria-label="Anime episode" type="number" min="1" value={animeEpisode} onChange={(e) => { setAnimeEpisode(Math.max(1, Number(e.target.value))); setFrameLoading(true); }} className="w-16 rounded-lg bg-[#16181f] p-2 text-white" /></label>
              <span>{serverId === 'anime3' ? 'Sandbox blocks pop-ups/top-level redirects; embedded ads may still appear.' : 'MAL ID is filled automatically when available. Track availability varies.'}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setDownloadOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/[0.08] px-3.5 text-[12.5px] font-semibold text-white transition hover:bg-white/[0.16]"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </button>

          {normalizedSelf && (
            <button
              type="button"
              onClick={() => {
                const added = toggleMyList(normalizedSelf);
                toast(
                  added ? `Added "${title}" to My List` : `Removed "${title}" from My List`,
                  added ? 'success' : 'info'
                );
              }}
              aria-label="Toggle My List"
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.08] text-white transition hover:bg-white/[0.16]"
            >
              {saved ? <Check size={16} /> : <Plus size={16} />}
            </button>
          )}
        </div>
      </header>

      {/* Main 16:9 Cinema Stage */}
      <div className="relative h-[56vh] w-full bg-black sm:h-[74vh] lg:h-[83vh]">
        {frameLoading && streamSrc && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-[13px] font-medium text-[#8f98b2]">
              Connecting to {serverId === 'anime1' ? 'ANIME 1' : serverId === 'anime2' ? 'ANIME 2' : serverId === 'anime3' ? 'ANIME 3' : `Server ${serverId}`}...
            </p>
          </div>
        )}

        {!streamSrc && <div role="status" className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-[#8f98b2]">
          {mappingStatus === 'loading' ? <><Loader2 className="animate-spin text-blue-400" /><p>Finding the anime player for this episode…</p></> : <>
            <p>{mappingStatus === 'error' ? 'Anime lookup is temporarily unavailable.' : 'No automatic anime mapping is available for this episode yet.'} Choose Server 1 to watch, or optionally enter a season-specific MAL ID above.</p>
            <button type="button" onClick={() => { serverChoiceRef.current = titleKey; setServerId(1); setFrameLoading(true); }} className="btn-priva-blue rounded-xl px-5 py-3 font-semibold text-white">Watch on Server 1</button>
          </>}
        </div>}
        {streamSrc && <iframe
          ref={playerRef}
          key={streamSrc}
          src={streamSrc}
          title={title}
          onLoad={() => setFrameLoading(false)}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          sandbox={serverId === 'anime3' ? 'allow-scripts allow-same-origin allow-forms allow-presentation' : undefined}
          allowFullScreen
          referrerPolicy="origin"
          className="h-full w-full border-0"
        />}
      </div>

      {/* Info & Up Next Section matching bingr.one/watch/... */}
      {!loading && detail && (
        <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Title Logo, Metadata & Synopsis */}
            <div className="lg:col-span-7">
              {logoPath ? (
                <img
                  src={IMG.logo(logoPath, 'w500')}
                  alt={title}
                  className="mb-3 max-h-[68px] w-auto max-w-[260px] object-contain object-left"
                />
              ) : (
                <h2 className="mb-2 font-display text-[26px] font-extrabold text-white">
                  {title}
                </h2>
              )}

              <div className="mb-3 flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-[#cbd5e1]">
                {[
                  year,
                  type === 'movie'
                    ? formatRuntime(detail.runtime)
                    : currentEpisode?.runtime
                      ? `${currentEpisode.runtime}m`
                      : null,
                  score,
                  cert,
                ]
                  .filter(Boolean)
                  .map((m, idx) => (
                    <span key={`${m}-${idx}`} className="inline-flex items-center gap-2">
                      {idx > 0 && <span className="text-white/35">·</span>}
                      <span>{m}</span>
                    </span>
                  ))}
              </div>

              <p className="text-[14px] leading-relaxed text-[#9aa3bc]">
                {currentEpisode?.overview || detail.overview}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Link
                  to={`/${type}/${numericId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/[0.15]"
                >
                  <Info size={15} />
                  <span>Full Title Details</span>
                </Link>
              </div>
            </div>

            {/* Next Episode Card (TV / Anime) */}
            {type === 'tv' && nextEpisodeObj && (
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-white/[0.08] bg-[#16181f] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-400">
                      <SkipForward size={14} /> Next Episode
                    </span>

                    <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-[#8f98b2]">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.autoplayNext)}
                        onChange={(e) => updateSettings({ autoplayNext: e.target.checked })}
                        className="h-3.5 w-3.5 rounded accent-blue-600"
                      />
                      Auto play
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/watch/tv/${numericId}/${season}/${nextEpisodeObj.episode_number}`
                      )
                    }
                    className="group flex w-full items-center gap-3.5 text-left"
                  >
                    <div className="relative aspect-video w-[144px] shrink-0 overflow-hidden rounded-lg bg-[#0f1014]">
                      {(nextEpisodeObj.still_path || detail.backdrop_path) && (
                        <img
                          src={IMG.still(
                            nextEpisodeObj.still_path || detail.backdrop_path,
                            'w500'
                          )}
                          alt={nextEpisodeObj.name}
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      )}
                      <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                        <Play size={18} className="fill-current" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[14.5px] font-bold text-white group-hover:text-blue-400">
                        {nextEpisodeObj.name || `Episode ${nextEpisodeObj.episode_number}`}
                      </h3>
                      <p className="mt-0.5 text-[12px] font-medium text-[#8f98b2]">
                        S{season} E{nextEpisodeObj.episode_number}
                        {nextEpisodeObj.runtime ? ` · ${nextEpisodeObj.runtime}m` : ''}
                      </p>
                      {nextEpisodeObj.overview && (
                        <p className="mt-1 line-clamp-2 text-[12px] text-[#8f98b2]">
                          {nextEpisodeObj.overview}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Season & Episode Selector matching bingr.one/watch/tv/... */}
          {type === 'tv' && (
            <section className="mt-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="mr-2 font-display text-[20px] font-bold text-white">
                    Episodes
                  </h2>
                  {validSeasons.map((s) => (
                    <button
                      key={s.id || s.season_number}
                      type="button"
                      onClick={() => setSelectedSeason(s.season_number)}
                      className={`rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                        selectedSeason === s.season_number
                          ? 'bg-white text-[#0f1014]'
                          : 'bg-[#16181f] text-[#8f98b2] hover:text-white'
                      }`}
                    >
                      Season {s.season_number}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {episodes.map((ep) => {
                  const isPlaying =
                    selectedSeason === season && ep.episode_number === episode;
                  return (
                    <button
                      key={ep.id || ep.episode_number}
                      type="button"
                      onClick={() =>
                        navigate(`/watch/tv/${numericId}/${selectedSeason}/${ep.episode_number}`)
                      }
                      className={`group flex items-center gap-3.5 rounded-xl p-2.5 text-left transition ${
                        isPlaying
                          ? 'bg-blue-600/15 ring-1 ring-blue-500/60'
                          : 'bg-[#16181f]/65 hover:bg-[#191d28]'
                      }`}
                    >
                      <div className="relative aspect-video w-[140px] shrink-0 overflow-hidden rounded-lg bg-[#0f1014]">
                        {(ep.still_path || detail.backdrop_path) && (
                          <img
                            src={IMG.still(ep.still_path || detail.backdrop_path, 'w500')}
                            alt={ep.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        )}
                        {isPlaying && (
                          <span className="absolute left-2 top-2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                            Playing
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[14px] font-bold text-white">
                          {ep.name || `Episode ${ep.episode_number}`}
                        </h3>
                        <p className="mt-0.5 text-[11.5px] font-semibold text-[#8f98b2]">
                          S{selectedSeason} E{ep.episode_number}
                          {ep.runtime ? ` · ${ep.runtime}m` : ''}
                        </p>
                        {ep.overview && (
                          <p className="mt-1 line-clamp-2 text-[12px] text-[#8f98b2]">
                            {ep.overview}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* More Like This */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 font-display text-[20px] font-bold text-white">
                More Like This
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                {related.map((item) => (
                  <PosterCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <DownloadModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        type={type}
        id={numericId}
        title={title}
        season={season}
        episode={episode}
        seasons={validSeasons}
        episodeCount={episodes.length || 24}
      />
    </div>
  );
}
