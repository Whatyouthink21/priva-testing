import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Download,
  Heart,
  Languages,
  Loader2,
  Play,
  Plus,
  Star,
  Tv,
} from 'lucide-react';
import { IMG, api, money, runtimeLabel, titleOf, yearOf } from '../lib/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { useReveal } from '../hooks/useReveal';
import { usePalette } from '../hooks/usePalette';
import { aurora, colourGrade, meshBackground, paletteStyle, swatchGradient } from '../lib/palette';
import { cx } from '../lib/utils';
import Row, { SectionHeading } from '../components/Row';
import CriticsSection from '../components/CriticsSection';
import DownloadModal from '../components/DownloadModal';
import Modal from '../components/Modal';

export default function Detail({ type = 'movie' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isInList, toggleList, isFavorite, toggleFavorite, progressFor } = useLibrary();

  const [data, setData] = useState(null);
  const [credits, setCredits] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trailer, setTrailer] = useState(false);
  const [downloads, setDownloads] = useState(false);
  const [season, setSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);

  // Sample the artwork so the page takes on this title's own colours.
  const palette = usePalette(
    data?.poster_path
      ? IMG.poster(data.poster_path, 'w500')
      : data?.backdrop_path
        ? IMG.backdrop(data.backdrop_path, 'w780')
        : null
  );

  useReveal([loading, episodes.length, data?.id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setData(null);
    window.scrollTo({ top: 0, behavior: 'instant' });

    Promise.allSettled([
      api.details(type, id),
      api.credits(type, id),
      api.reviews(type, id),
      api.videos(type, id),
      api.recommendations(type, id),
      api.similar(type, id),
    ]).then(([details, crew, rev, vid, rec, sim]) => {
      if (!alive) return;
      if (details.status !== 'fulfilled') {
        setError('This title could not be loaded.');
        setLoading(false);
        return;
      }
      const detail = details.value;
      setData(detail);
      setCredits(crew.status === 'fulfilled' ? crew.value : null);
      setReviews(rev.status === 'fulfilled' ? rev.value.results || [] : []);
      setVideos(vid.status === 'fulfilled' ? vid.value.results || [] : []);
      setRecommendations(rec.status === 'fulfilled' ? rec.value.results || [] : []);
      setSimilar(sim.status === 'fulfilled' ? sim.value.results || [] : []);
      const firstSeason = detail.seasons?.find((s) => s.season_number > 0)?.season_number ?? 1;
      setSeason(firstSeason);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [type, id]);

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

  const title = data ? titleOf(data) : '';
  const year = data ? yearOf(data) : '';
  const inList = isInList({ id, type });
  const fav = isFavorite({ id, type });
  const resume = progressFor({ id, type });

  const trailerKey = useMemo(() => {
    const list = videos.filter((v) => v.site === 'YouTube');
    const best =
      list.find((v) => v.type === 'Trailer' && v.official) ||
      list.find((v) => v.type === 'Trailer') ||
      list.find((v) => v.type === 'Teaser') ||
      list[0];
    return best?.key || null;
  }, [videos]);

  const cast = useMemo(() => (credits?.cast || []).slice(0, 14), [credits]);
  const crew = useMemo(() => {
    const wanted = ['Director', 'Creator', 'Writer', 'Screenplay', 'Executive Producer'];
    return (credits?.crew || []).filter((c) => wanted.includes(c.job)).slice(0, 6);
  }, [credits]);

  const moreLikeThis = useMemo(() => {
    const seen = new Set();
    return [...recommendations, ...similar]
      .filter((item) => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, 20)
      .map((item) => ({ ...item, type, backdrop: item.backdrop_path, poster: item.poster_path }));
  }, [recommendations, similar, type]);

  const watchHref = `/watch/${type}/${id}${
    type === 'tv'
      ? `?s=${resume?.season || season || 1}&e=${resume?.episode || 1}`
      : ''
  }`;

  const libraryItem = data
    ? {
        id: data.id,
        type,
        title,
        poster: data.poster_path,
        backdrop: data.backdrop_path,
        rating: data.vote_average,
        year,
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="skeleton h-[62vh] w-full rounded-none" />
        <div className="container-page -mt-32 relative">
          <div className="flex gap-8">
            <div className="skeleton hidden aspect-[2/3] w-[220px] rounded-xl sm:block" />
            <div className="flex-1 space-y-4 pt-24">
              <div className="skeleton h-10 w-2/3 rounded-lg" />
              <div className="skeleton h-4 w-1/3 rounded" />
              <div className="skeleton h-20 w-full max-w-2xl rounded-lg" />
              <div className="skeleton h-11 w-64 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-page grid min-h-[70vh] place-items-center pt-24 text-center">
        <div>
          <p className="text-lg font-semibold">{error || 'Title not found'}</p>
          <p className="mt-2 text-sm text-white/40">The title may have been removed from TMDB.</p>
          <button onClick={() => navigate(-1)} className="btn-ghost mt-6">
            <ArrowLeft size={16} /> Go back
          </button>
        </div>
      </div>
    );
  }

  const runtime = type === 'tv' ? data.episode_run_time?.[0] : data.runtime;
  const rating = Number(data.vote_average) || 0;
  const companies = (data.production_companies || []).slice(0, 4);
  const networks = (data.networks || []).slice(0, 4);

  const paletteColors = palette?.colors || [];
  const hasPalette = Boolean(palette);

  return (
    <article
      className="relative pb-10 transition-[background-image] duration-1000"
      style={{
        ...paletteStyle(palette),
        backgroundImage: hasPalette
          ? 'linear-gradient(180deg, transparent 0%, rgb(var(--brand) / 0.16) 24%, rgb(var(--accent-2) / 0.13) 44%, rgb(var(--accent-3) / 0.09) 64%, rgb(var(--accent-4) / 0.06) 80%, transparent 100%)'
          : undefined,
      }}
    >
      {/* Aurora blobs carrying the palette down the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.55] transition-opacity duration-1000"
      >
        <div
          className="absolute inset-x-0 top-[32vh] bottom-0"
          style={{ background: aurora(palette) }}
        />
      </div>

      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[80vh] min-h-[560px] overflow-hidden">
          {data.backdrop_path && (
            <img
              src={IMG.backdrop(data.backdrop_path, 'w1280')}
              alt=""
              className="h-full w-full scale-[1.02] object-cover object-top"
            />
          )}

          {/* 1 · hue grade: pulls the whole image into the title's colour mix */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-color opacity-[0.65] transition-opacity duration-1000"
            style={{ background: colourGrade(palette) }}
          />
          {/* 2 · coloured light so the grade keeps its glow */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-screen opacity-[0.5] transition-opacity duration-1000"
            style={{ background: meshBackground(palette, 1.15) }}
          />
          {/* 3 · contrast + legibility */}
          <div className="absolute inset-0 hero-vignette-soft" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent" />

          {/* 4 · palette rule along the bottom edge */}
          {hasPalette && (
            <div className="absolute inset-x-0 bottom-0 flex h-[3px] w-full">
              {paletteColors.map((color, i) => (
                <span key={i} className="h-full flex-1" style={{ background: color }} />
              ))}
            </div>
          )}
        </div>

        <div className="container-page relative pt-[128px]">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3.5 py-2 text-[12.5px] font-medium text-white/70 backdrop-blur transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex flex-col gap-7 md:flex-row md:items-end">
            <div className="relative w-[150px] shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-[0_34px_90px_-24px_rgb(var(--brand)/0.95),0_0_0_1px_rgb(var(--accent-2)/0.35)] ring-1 ring-brand/40 sm:w-[200px] md:w-[230px]">
              {data.poster_path ? (
                <img
                  src={IMG.poster(data.poster_path, 'w500')}
                  alt={title}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="grid aspect-[2/3] place-items-center bg-ink-800 p-4 text-center text-sm text-white/40">
                  {title}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 animate-fadeUp">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wider text-white/50">
                <span className="rounded bg-brand/20 px-2 py-1 text-brand-400 ring-1 ring-brand/25">
                  {type === 'tv' ? 'Series' : 'Movie'}
                </span>
                {year && <span>{year}</span>}
                {runtime ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} /> {runtimeLabel(runtime)}
                  </span>
                ) : null}
                {type === 'tv' && data.number_of_seasons ? (
                  <span className="inline-flex items-center gap-1">
                    <Tv size={11} /> {data.number_of_seasons} season
                    {data.number_of_seasons > 1 ? 's' : ''}
                  </span>
                ) : null}
                {rating > 0 && (
                  <span className="inline-flex items-center gap-1 text-white/80">
                    <Star size={11} className="fill-gold text-gold" /> {rating.toFixed(1)}
                    <span className="font-normal text-white/35">
                      ({Number(data.vote_count || 0).toLocaleString()})
                    </span>
                  </span>
                )}
              </div>

              <h1
                className="bg-clip-text text-[clamp(2rem,4.6vw,3.7rem)] font-black leading-[0.98] tracking-[-0.035em] text-transparent drop-shadow-[0_10px_30px_rgba(0,0,0,0.65)]"
                style={{
                  backgroundImage: hasPalette
                    ? `linear-gradient(96deg, #ffffff 22%, ${paletteColors[1] || '#fff'} 78%, ${paletteColors[2] || '#fff'} 100%)`
                    : undefined,
                }}
              >
                {title}
              </h1>

              {data.tagline && (
                <p className="mt-2 text-[13.5px] italic text-white/45">“{data.tagline}”</p>
              )}

              {data.genres?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.genres.map((g) => (
                    <Link key={g.id} to={`/${type === 'tv' ? 'tv' : 'movies'}?genre=${g.id}`} className="chip">
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}

              {paletteColors.length > 0 && (
                <div className="mt-3.5 flex items-center gap-2.5">
                  <span
                    className="flex h-1.5 w-24 overflow-hidden rounded-full ring-1 ring-white/15"
                    title="Colours sampled from this title's artwork"
                  >
                    {paletteColors.map((color, i) => (
                      <span key={i} className="h-full flex-1" style={{ background: color }} />
                    ))}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">
                    Sampled from artwork
                  </span>
                </div>
              )}

              <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-white/65 sm:text-[14px]">
                {data.overview || 'No overview available for this title yet.'}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link to={watchHref} className="btn-primary px-6 py-3">
                  <Play size={17} className="fill-ink-950" />
                  {resume ? 'Resume' : 'Watch now'}
                </Link>
                {trailerKey && (
                  <button onClick={() => setTrailer(true)} className="btn-ghost px-5 py-3">
                    <Play size={16} /> Trailer
                  </button>
                )}
                <button onClick={() => setDownloads(true)} className="btn-ghost px-5 py-3">
                  <Download size={16} /> Download
                </button>
                <button
                  onClick={() => {
                    const added = toggleList(libraryItem);
                    toast(added ? 'Added to My List' : 'Removed from My List', added ? 'success' : 'info');
                  }}
                  className={cx(
                    'btn px-5 py-3',
                    inList ? 'bg-white text-ink-950' : 'border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]'
                  )}
                >
                  {inList ? <Check size={16} /> : <Plus size={16} />}
                  {inList ? 'In My List' : 'My List'}
                </button>
                <button
                  onClick={() => {
                    const added = toggleFavorite(libraryItem);
                    toast(added ? 'Added to favourites' : 'Removed from favourites', added ? 'success' : 'info');
                  }}
                  aria-label="Favourite"
                  className={cx(
                    'grid h-11 w-11 place-items-center rounded-full border transition',
                    fav
                      ? 'border-rose-400/40 bg-rose-500/20 text-rose-300'
                      : 'border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]'
                  )}
                >
                  <Heart size={17} className={fav ? 'fill-rose-300' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facts */}
      <section className="container-page mt-12" data-reveal>
        <div className="grid gap-x-8 gap-y-5 overflow-hidden rounded-2xl border border-white/10 p-5 sm:grid-cols-2 lg:grid-cols-4" style={{ backgroundImage: hasPalette ? `linear-gradient(135deg, rgb(var(--brand)/0.16), rgb(255 255 255 / 0.02) 45%, rgb(var(--accent-2)/0.12))` : undefined }}>
          <Fact label="Status" value={data.status || '—'} />
          <Fact
            label={type === 'tv' ? 'First aired' : 'Release date'}
            value={
              data.first_air_date || data.release_date
                ? new Date(data.first_air_date || data.release_date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'
            }
          />
          {type === 'movie' ? (
            <>
              <Fact label="Budget" value={money(data.budget) || '—'} />
              <Fact label="Revenue" value={money(data.revenue) || '—'} />
            </>
          ) : (
            <>
              <Fact label="Episodes" value={data.number_of_episodes || '—'} />
              <Fact label="Last aired" value={data.last_air_date || '—'} />
            </>
          )}
          <Fact
            label="Language"
            value={
              data.spoken_languages?.[0]?.english_name ||
              data.original_language?.toUpperCase() ||
              '—'
            }
            icon={Languages}
          />
          {type === 'tv' && <Fact label="Country" value={data.origin_country?.join(', ') || '—'} />}
          {type === 'movie' && (
            <Fact label="Votes" value={Number(data.vote_count || 0).toLocaleString()} />
          )}
        </div>

        {(companies.length > 0 || networks.length > 0) && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">
              {type === 'tv' ? 'Networks' : 'Production'}
            </span>
            {(type === 'tv' ? networks : companies).map((c) => (
              <span
                key={c.id}
                className="grid h-11 min-w-[74px] place-items-center rounded-lg border border-white/[0.08] bg-white/[0.04] px-3"
                title={c.name}
              >
                {c.logo_path ? (
                  <img
                    src={IMG.logo(c.logo_path, 'w154')}
                    alt={c.name}
                    className="max-h-6 max-w-[86px] object-contain opacity-80"
                  />
                ) : (
                  <span className="text-[10.5px] text-white/50">{c.name}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Episodes (TV) */}
      {type === 'tv' && data.seasons?.length > 0 && (
        <section className="container-page mt-14" data-reveal id="episodes">
          <SectionHeading title="Episodes" subtitle="Pick a season and start streaming" />
          <div className="mb-4 flex items-center gap-2">
            <div className="relative">
              <select
                value={season}
                onChange={(e) => {
                  setSeason(Number(e.target.value));
                  setShowAllEpisodes(false);
                }}
                className="appearance-none rounded-full border border-white/12 bg-ink-850 py-2 pl-4 pr-10 text-[13px] font-medium text-white focus:border-brand-500 focus:outline-none"
              >
                {data.seasons
                  .filter((s) => s.season_number > 0)
                  .map((s) => (
                    <option key={s.id} value={s.season_number} className="bg-ink-850">
                      Season {s.season_number} · {s.episode_count} episodes
                    </option>
                  ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
              />
            </div>
          </div>

          {episodesLoading ? (
            <div className="grid place-items-center py-10 text-white/30">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {(showAllEpisodes ? episodes : episodes.slice(0, 10)).map((ep) => (
                <Link
                  key={ep.id}
                  to={`/watch/tv/${id}?s=${season}&e=${ep.episode_number}`}
                  className="group flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition duration-300 hover:border-white/20 hover:bg-white/[0.05] sm:gap-4"
                >
                  <div className="relative w-[120px] shrink-0 overflow-hidden rounded-lg sm:w-[160px]">
                    {ep.still_path ? (
                      <img
                        src={IMG.backdrop(ep.still_path, 'w300')}
                        alt=""
                        className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid aspect-video w-full place-items-center rounded-lg bg-ink-800 text-[10px] text-white/30">
                        No still
                      </div>
                    )}
                    <span className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink-950">
                        <Play size={14} className="translate-x-[1px] fill-ink-950" />
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[13.5px] font-semibold text-white">
                        <span className="mr-2 text-white/35">E{ep.episode_number}</span>
                        {ep.name}
                      </p>
                      {ep.runtime ? (
                        <span className="shrink-0 text-[11px] text-white/30">{ep.runtime}m</span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/40">
                      {ep.overview || 'No synopsis for this episode yet.'}
                    </p>
                    {ep.air_date && (
                      <p className="mt-1.5 text-[10.5px] uppercase tracking-wider text-white/25">
                        {ep.air_date}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
              {episodes.length > 10 && (
                <button
                  onClick={() => setShowAllEpisodes((v) => !v)}
                  className="chip mx-auto mt-3 flex px-4 py-2"
                >
                  {showAllEpisodes
                    ? 'Show fewer episodes'
                    : `Show all ${episodes.length} episodes`}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Critics */}
      <div className="mt-16">
        <CriticsSection
          reviews={reviews}
          voteAverage={rating}
          voteCount={data.vote_count}
          title={title}
        />
      </div>

      {/* Cast */}
      {cast.length > 0 && (
        <section className="container-page mt-16" data-reveal>
          <SectionHeading title="Cast" subtitle="Who you'll see on screen" />
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 sm:gap-4">
            {cast.map((person) => (
              <Link
                key={person.credit_id || person.id}
                to={`/person/${person.id}`}
                className="group w-[104px] shrink-0 sm:w-[124px]"
              >
                <div className="aspect-square w-full overflow-hidden rounded-xl border border-white/[0.07] bg-ink-800">
                  {person.profile_path ? (
                    <img
                      src={IMG.profile(person.profile_path, 'w185')}
                      alt={person.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-white/25">
                      {person.name?.slice(0, 1)}
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-[12.5px] font-semibold text-white/85">
                  {person.name}
                </p>
                <p className="truncate text-[11px] text-white/35">{person.character}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Crew */}
      {crew.length > 0 && (
        <section className="container-page mt-12" data-reveal>
          <SectionHeading title="Crew" />
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {crew.map((member) => (
              <div
                key={`${member.credit_id || member.id}-${member.job}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5"
              >
                <span className="truncate text-[13px] font-medium text-white/85">
                  {member.name}
                </span>
                <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-white/40">
                  {member.job}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* More like this */}
      {moreLikeThis.length > 0 && (
        <div className="mt-16">
          <Row
            title="More like this"
            subtitle={type === 'tv' ? 'Series with the same energy' : 'If you liked this film, try these'}
            items={moreLikeThis}
            cardWidth="w-[140px] sm:w-[160px]"
          />
        </div>
      )}

      <Modal open={trailer} onClose={() => setTrailer(false)} className="max-w-4xl p-0">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          {trailerKey && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title={`${title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          )}
        </div>
      </Modal>

      <DownloadModal
        open={downloads}
        onClose={() => setDownloads(false)}
        type={type}
        id={id}
        title={`${title}${year ? ` (${year})` : ''}`}
        season={resume?.season || season || 1}
        episode={resume?.episode || 1}
      />
    </article>
  );
}

function Fact({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/30">
        {label}
      </p>
      <p className="flex items-center gap-1.5 text-[13.5px] font-medium text-white/80">
        {Icon && <Icon size={13} className="text-white/35" />}
        {value}
      </p>
    </div>
  );
}
