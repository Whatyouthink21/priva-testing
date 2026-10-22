import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Plus,
  Search,
  User,
} from 'lucide-react';
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
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';

function selectTrailer(item) {
  const videos = (item?.videos?.results || []).filter(
    (video) => video.site === 'YouTube' && video.key && (video.type === 'Trailer' || video.type === 'Teaser')
  );
  return videos.find((video) => video.type === 'Trailer' && video.official)
    || videos.find((video) => video.type === 'Trailer')
    || videos.find((video) => video.official)
    || videos[0]
    || null;
}

export default function Detail({ type = 'movie' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInList, toggleMyList, getProgress } = useLibrary();
  const { toast } = useToast();

  const [detail, setDetail] = useState(null);
  const [logoLoadedUrl, setLogoLoadedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [epQuery, setEpQuery] = useState('');
  const [downloadModal, setDownloadModal] = useState({ open: false, season: 1, episode: 1 });
  const [trailerPreviewStage, setTrailerPreviewStage] = useState(0);
  const castScrollerRef = useRef(null);

  const numericId = useMemo(() => {
    const m = String(id || '').match(/\d+/);
    return m ? Number(m[0]) : Number(id);
  }, [id]);

  const savedProgress = getProgress(type, numericId);

  useEffect(() => {
    setTrailerPreviewStage(0);
    if (!selectTrailer(detail)) return undefined;
    const animateTitle = setTimeout(() => setTrailerPreviewStage(1), 100);
    const playTrailer = setTimeout(() => setTrailerPreviewStage(2), 2300);
    return () => {
      clearTimeout(animateTitle);
      clearTimeout(playTrailer);
    };
  }, [detail?.id, detail?.videos]);

  useEffect(() => {
    if (!numericId) return undefined;
    let cancelled = false;
    setLoading(true);
    setLogoLoadedUrl(null);
    setEpisodes([]);
    setEpQuery('');

    api
      .fullDetail(type, numericId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        const name = titleOf(data);
        document.title = `${name} · Priva`;

        const logoPath = pickBestLogo(data.images);
        if (logoPath) {
          const url = IMG.logo(logoPath, 'w500');
          const probe = new Image();
          probe.onload = () => {
            if (!cancelled) setLogoLoadedUrl(url);
          };
          probe.src = url;
        }

        if (type === 'tv') {
          const validSeasons = (data.seasons || []).filter((s) => s.season_number > 0);
          const initialSeason =
            savedProgress?.season || validSeasons[0]?.season_number || 1;
          setSelectedSeason(initialSeason);
        }
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type, numericId]);

  useEffect(() => {
    if (type !== 'tv' || !numericId || !detail) return undefined;
    let cancelled = false;
    setLoadingEpisodes(true);

    api
      .season(numericId, selectedSeason)
      .then((res) => {
        if (!cancelled) setEpisodes(res.episodes || []);
      })
      .catch(() => {
        if (!cancelled) setEpisodes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEpisodes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type, numericId, selectedSeason, detail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1014]">
        <div className="relative h-[76vh] min-h-[520px] w-full">
          <div className="skeleton h-full w-full opacity-40" />
          <div className="hero-gradient-mask absolute inset-0" />
          <div className="absolute bottom-14 left-4 max-w-xl space-y-4 lg:left-[108px]">
            <div className="skeleton h-14 w-72 rounded-xl" />
            <div className="skeleton h-4 w-64 rounded" />
            <div className="skeleton h-20 w-full rounded-lg" />
            <div className="flex gap-3">
              <div className="skeleton h-12 w-52 rounded-[10px]" />
              <div className="skeleton h-12 w-12 rounded-[10px]" />
              <div className="skeleton h-12 w-12 rounded-[10px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center px-6 text-center lg:pl-[108px]">
        <h1 className="font-display text-[26px] font-bold text-white">Title not found</h1>
        <p className="mt-2 text-[14px] text-[#8f98b2]">
          This movie or series may have moved or is temporarily unavailable.
        </p>
        <Link
          to="/home"
          className="btn-priva-blue mt-6 rounded-xl px-6 py-3 text-[14px] font-bold text-white"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const title = titleOf(detail);
  const year = yearOf(detail);
  const score = formatScore(detail.vote_average);
  const cert = extractCertification(detail, type);
  const anime = isAnimeItem(detail);
  const normalizedSelf = normalizeItem(detail, type);
  const saved = isInList(normalizedSelf);

  const validSeasons = (detail.seasons || []).filter((s) => s.season_number > 0);
  const durationMeta =
    type === 'movie'
      ? formatRuntime(detail.runtime)
      : validSeasons.length > 1
        ? `${validSeasons.length} Seasons`
        : detail.number_of_episodes
          ? `${detail.number_of_episodes} Episodes`
          : '1 Season';

  const metaItems = [score, year, cert, durationMeta].filter(Boolean);

  const trailer = selectTrailer(detail);

  const cast = (detail.credits?.cast || []).slice(0, 20);

  const filteredEpisodes = epQuery.trim()
    ? episodes.filter(
        (ep) =>
          String(ep.episode_number).includes(epQuery.trim()) ||
          (ep.name || '').toLowerCase().includes(epQuery.trim().toLowerCase())
      )
    : episodes;

  const primaryWatchUrl =
    type === 'tv'
      ? `/watch/tv/${numericId}/${savedProgress?.season || selectedSeason || 1}/${
          savedProgress?.episode || 1
        }`
      : `/watch/movie/${numericId}`;

  return (
    <div className="min-h-screen bg-[#0f1014] pb-12">
      {/* Full-Bleed Crisp HD Backdrop Hero */}
      <section className="relative min-h-[76vh] w-full overflow-hidden lg:min-h-[84vh]">
        <div className="absolute inset-0">
          {detail.backdrop_path ? (
            <img
              src={IMG.backdrop(detail.backdrop_path, 'w1280')}
              alt={title}
              decoding="async"
              fetchpriority="high"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            detail.poster_path && (
              <img
                src={IMG.poster(detail.poster_path, 'w500')}
                alt={title}
                decoding="async"
                className="h-full w-full object-cover opacity-50"
              />
            )
          )}
          {trailer && trailerPreviewStage >= 2 && (
            <iframe
              key={trailer.key}
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`}
              title={`${title} trailer preview`}
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full scale-[1.2] border-0"
            />
          )}
        </div>

        <div className="hero-gradient-mask pointer-events-none absolute inset-0" />

        <div className="relative z-10 flex min-h-[76vh] flex-col justify-end px-4 pb-10 pt-24 sm:px-8 lg:min-h-[84vh] lg:pb-12 lg:pl-[108px] lg:pr-12">
          <div className="max-w-[600px] animate-hero-in">
            {logoLoadedUrl ? (
              <img
                src={logoLoadedUrl}
                alt={title}
                decoding="async"
                className={`mb-5 max-h-[88px] w-auto max-w-[330px] origin-left object-contain object-left drop-shadow-[0_10px_28px_rgba(0,0,0,0.85)] transition-transform duration-[2200ms] ease-in-out sm:max-h-[112px] sm:max-w-[420px] ${trailer && trailerPreviewStage >= 1 ? 'scale-110' : ''}`}
              />
            ) : (
              <h1 className={`mb-4 origin-left font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.03em] text-white transition-transform duration-[2200ms] ease-in-out sm:text-[48px] ${trailer && trailerPreviewStage >= 1 ? 'scale-110' : ''}`}>
                {title}
              </h1>
            )}

            <div className="mb-3.5 flex flex-wrap items-center gap-2 text-[14px] font-bold text-[#e1e6f0]">
              {metaItems.map((item, idx) => (
                <span key={`${item}-${idx}`} className="inline-flex items-center gap-2">
                  {idx > 0 && <span className="text-white/40">•</span>}
                  <span
                    className={
                      item === cert
                        ? 'rounded bg-white/[0.14] px-2 py-0.5 text-[12px] font-bold text-white'
                        : ''
                    }
                  >
                    {item}
                  </span>
                </span>
              ))}
            </div>

            {detail.overview && (
              <p className={`mb-4 origin-left text-[14px] leading-[1.65] text-[#c4ccdf] transition-[opacity,transform,max-height,margin] duration-[1800ms] ease-in-out sm:text-[15px] ${trailer && trailerPreviewStage >= 1 ? 'mb-0 max-h-0 scale-50 overflow-hidden opacity-0' : 'max-h-40 scale-100 opacity-100'}`}>
                {detail.overview}
              </p>
            )}

            {detail.genres?.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-white">
                {detail.genres.map((g, idx) => (
                  <span key={g.id} className="inline-flex items-center gap-2">
                    {idx > 0 && <span className="text-white/30">|</span>}
                    <Link
                      to={`/discover/${type}?genre=${g.id}&label=${encodeURIComponent(g.name)}`}
                      className="transition-colors hover:text-blue-400"
                    >
                      {g.name}
                    </Link>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(primaryWatchUrl)}
                className="btn-hero-watch inline-flex h-[50px] min-w-[210px] items-center justify-center gap-2.5 rounded-[10px] px-8 text-[15.5px] font-extrabold"
              >
                <Play size={18} className="fill-current" />
                <span>
                  {savedProgress
                    ? type === 'tv'
                      ? `Continue S${savedProgress.season} E${savedProgress.episode}`
                      : 'Resume Watching'
                    : 'Watch Now'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const added = toggleMyList(normalizedSelf);
                  toast(
                    added ? `Added "${title}" to My List` : `Removed "${title}" from My List`,
                    added ? 'success' : 'info'
                  );
                }}
                aria-label={saved ? 'Remove from My List' : 'Add to My List'}
                title={saved ? 'In My List' : 'Add to My List'}
                className="btn-hero-glass grid h-[50px] w-[50px] place-items-center rounded-[10px]"
              >
                {saved ? <Check size={21} strokeWidth={2.5} /> : <Plus size={22} strokeWidth={2.3} />}
              </button>

              <button
                type="button"
                onClick={() =>
                  setDownloadModal({
                    open: true,
                    season: savedProgress?.season || selectedSeason || 1,
                    episode: savedProgress?.episode || 1,
                  })
                }
                className="btn-hero-glass inline-flex h-[50px] items-center justify-center gap-2 rounded-[10px] px-5 text-[14px] font-semibold"
              >
                <Download size={17} />
                <span>Download</span>
              </button>

              <span className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-white/75">
                {anime ? 'Anime' : type === 'tv' ? 'Series' : 'Movie'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* EPISODES LIST (TV & Anime) */}
      {type === 'tv' && (
        <section className="px-4 pt-6 sm:px-8 lg:pl-[108px] lg:pr-12">
          <div className="mb-4 flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-3 font-display text-[21px] font-bold text-white">Episodes</h2>
              <div className="no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto">
                {validSeasons.map((s) => (
                  <button
                    key={s.id || s.season_number}
                    type="button"
                    onClick={() => setSelectedSeason(s.season_number)}
                    className={`shrink-0 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
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

            {episodes.length > 6 && (
              <div className="relative w-full sm:w-60">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8f98b2]"
                />
                <input
                  type="text"
                  value={epQuery}
                  onChange={(e) => setEpQuery(e.target.value)}
                  placeholder="Find episode..."
                  className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#16181f] pl-9 pr-3 text-[13px] text-white placeholder-[#6b738b] focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {loadingEpisodes ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEpisodes.map((ep) => {
                const epWatchUrl = `/watch/tv/${numericId}/${selectedSeason}/${ep.episode_number}`;
                const isActiveEp =
                  savedProgress?.season === selectedSeason &&
                  savedProgress?.episode === ep.episode_number;

                return (
                  <div
                    key={ep.id || ep.episode_number}
                    className={`group flex flex-col gap-4 rounded-xl p-3 transition-colors duration-150 sm:flex-row sm:items-center ${
                      isActiveEp
                        ? 'bg-[#191d2b] ring-1 ring-blue-500/40'
                        : 'hover:bg-[#16181f]'
                    }`}
                  >
                    <Link
                      to={epWatchUrl}
                      className="relative aspect-video w-full shrink-0 overflow-hidden rounded-[8px] bg-[#16181f] sm:w-[236px]"
                    >
                      {ep.still_path || detail.backdrop_path ? (
                        <img
                          src={IMG.still(ep.still_path || detail.backdrop_path, 'w500')}
                          alt={ep.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-white/30">
                          <Play size={22} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <span className="absolute bottom-2.5 left-3 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white transition-colors group-hover:bg-white group-hover:text-[#0f1014]">
                        <Play size={13} className="translate-x-[1px] fill-current" />
                      </span>
                      {ep.runtime > 0 && (
                        <span className="absolute bottom-2.5 right-2.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white/90">
                          {ep.runtime}m
                        </span>
                      )}
                      {isActiveEp && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${savedProgress.progress}%` }}
                          />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <Link to={epWatchUrl} className="group/title min-w-0">
                          <h3 className="text-[15.5px] font-bold text-white group-hover/title:text-blue-400">
                            {ep.episode_number}. {ep.name || `Episode ${ep.episode_number}`}
                          </h3>
                          <p className="mt-0.5 text-[12px] font-semibold text-[#8f98b2]">
                            S{selectedSeason} E{ep.episode_number}
                            {ep.air_date ? ` · ${ep.air_date}` : ''}
                            {ep.runtime ? ` · ${ep.runtime}m` : ''}
                          </p>
                        </Link>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDownloadModal({
                                open: true,
                                season: selectedSeason,
                                episode: ep.episode_number,
                              })
                            }
                            title={`Download S${selectedSeason} E${ep.episode_number}`}
                            aria-label={`Download Episode ${ep.episode_number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.06] text-[#cbd5e1] transition-colors hover:bg-white/[0.14] hover:text-white"
                          >
                            <Download size={15} />
                          </button>
                          <Link
                            to={epWatchUrl}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.1] px-3.5 text-[12.5px] font-bold text-white transition-colors hover:bg-white hover:text-[#0f1014]"
                          >
                            <Play size={12} className="fill-current" />
                            <span>Play</span>
                          </Link>
                        </div>
                      </div>

                      {ep.overview && (
                        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#9aa3bc]">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ACTORS ROW */}
      {cast.length > 0 && (
        <section className="group/cast relative pt-10">
          <div className="mb-4 flex items-center justify-between px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
            <h2 className="font-display text-[20px] font-bold text-white">Actors</h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  castScrollerRef.current?.scrollBy({ left: -420, behavior: 'smooth' })
                }
                aria-label="Scroll actors left"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/80 hover:bg-white/[0.15]"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  castScrollerRef.current?.scrollBy({ left: 420, behavior: 'smooth' })
                }
                aria-label="Scroll actors right"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/80 hover:bg-white/[0.15]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            ref={castScrollerRef}
            className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2 sm:px-8 lg:pl-[108px] lg:pr-12"
          >
            {cast.map((person) => (
              <Link
                key={`${person.id}-${person.cast_id || person.credit_id}`}
                to={`/person/${person.id}`}
                className="group w-[118px] shrink-0 text-center sm:w-[132px]"
              >
                <div className="mx-auto aspect-square w-[104px] overflow-hidden rounded-full bg-[#16181f] ring-1 ring-white/[0.1] transition-transform duration-200 group-hover:scale-105 group-hover:ring-white/30 sm:w-[116px]">
                  {person.profile_path ? (
                    <img
                      src={IMG.profile(person.profile_path)}
                      alt={person.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[#8f98b2]">
                      <User size={28} />
                    </div>
                  )}
                </div>
                <p className="mt-2.5 truncate text-[13px] font-semibold text-white group-hover:text-blue-400">
                  {person.name}
                </p>
                {person.character && (
                  <p className="truncate text-[11.5px] text-[#8f98b2]">{person.character}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <DownloadModal
        open={downloadModal.open}
        onClose={() => setDownloadModal((s) => ({ ...s, open: false }))}
        type={type}
        id={numericId}
        title={title}
        season={downloadModal.season}
        episode={downloadModal.episode}
        seasons={validSeasons}
        episodeCount={episodes.length || 24}
      />

    </div>
  );
}
