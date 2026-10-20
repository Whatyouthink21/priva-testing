import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info, Play, Plus, Check, Star } from 'lucide-react';
import { IMG, api, titleOf, yearOf, typeOf } from '../lib/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/utils';

const detailCache = new Map();

async function enrich(item) {
  const type = typeOf(item);
  const key = `${type}:${item.id}`;
  if (detailCache.has(key)) return detailCache.get(key);
  const promise = Promise.allSettled([
    api.details(type, item.id),
    api.images(type, item.id),
  ]).then(([detailsRes, imagesRes]) => {
    const details = detailsRes.status === 'fulfilled' ? detailsRes.value : null;
    const images = imagesRes.status === 'fulfilled' ? imagesRes.value : null;
    const logos = (images?.logos || []).filter((l) => l.iso_639_1 === 'en' || !l.iso_639_1);
    const logo = logos.find((l) => l.iso_639_1 === 'en') || logos[0] || null;
    return { details, logo: logo?.file_path || null };
  });
  detailCache.set(key, promise);
  return promise;
}

export default function HeroSlider() {
  const [items, setItems] = useState([]);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);
  const navigate = useNavigate();
  const { isInList, toggleList } = useLibrary();
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    api
      .trending('all', 'week')
      .then(async (data) => {
        const picks = (data.results || [])
          .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 5);
        const enriched = await Promise.all(
          picks.map(async (pick) => {
            const extra = await enrich(pick);
            return {
              ...pick,
              type: pick.media_type,
              title: titleOf(pick),
              year: yearOf(pick),
              logo: extra.logo,
              genres: extra.details?.genres?.map((g) => g.name) || [],
              runtime: extra.details?.runtime || extra.details?.episode_run_time?.[0] || null,
              seasons: extra.details?.number_of_seasons || null,
            };
          })
        );
        if (alive) setItems(enriched);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (paused || items.length < 2) return;
    timer.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 9000);
    return () => window.clearTimeout(timer.current);
  }, [index, paused, items.length]);

  const current = items[index];

  const onToggleList = useCallback(
    (item) => {
      const added = toggleList(item);
      toast(added ? 'Added to My List' : 'Removed from My List', added ? 'success' : 'info');
    },
    [toggleList, toast]
  );


  if (failed && !items.length) {
    return (
      <section className="relative isolate flex h-[74vh] min-h-[520px] items-end overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(139,92,246,0.35),transparent_55%),radial-gradient(circle_at_85%_60%,rgba(59,130,246,0.22),transparent_50%)]" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="container-page relative z-10 pb-16">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">
            Priva
          </p>
          <h1 className="max-w-2xl text-[clamp(2rem,5vw,3.8rem)] font-black leading-[0.98] tracking-[-0.035em]">
            Movies, series and anime.<br />One place.
          </h1>
          <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-white/55">
            The live catalogue could not be reached just now. Browse the full library or
            try again in a moment.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button onClick={() => navigate('/movies')} className="btn-primary px-6 py-3">
              <Play size={16} className="fill-ink-950" /> Browse movies
            </button>
            <button onClick={() => window.location.reload()} className="btn-ghost px-5 py-3">
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!current) {
    return (
      <div className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
        <div className="skeleton absolute inset-0 rounded-none" />
        <div className="container-page absolute inset-x-0 bottom-16">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton mt-4 h-14 w-[min(520px,70vw)] rounded-lg" />
          <div className="skeleton mt-4 h-4 w-[min(620px,80vw)] rounded" />
          <div className="skeleton mt-6 h-11 w-60 rounded-full" />
        </div>
      </div>
    );
  }

  const type = current.type || typeOf(current);
  const inList = isInList({ id: current.id, type });
  const poster = IMG.poster(current.poster_path, 'w500');

  return (
    <section
      className="relative isolate h-[88vh] min-h-[560px] w-full overflow-hidden sm:h-[84vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Backdrops */}
      {items.map((item, i) => (
        <div
          key={item.id}
          className={cx(
            'absolute inset-0 transition-opacity duration-[1100ms] ease-smooth',
            i === index ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden={i !== index}
        >
          {item.backdrop_path && (
            <img
              src={IMG.backdrop(item.backdrop_path, 'w1280')}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              className={cx(
                'h-full w-full object-cover object-top sm:object-center',
                i === index && 'animate-kenburns'
              )}
            />
          )}
          <div className="absolute inset-0 hero-vignette" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex h-full items-end pb-14 sm:pb-20">
        <div className="container-page relative w-full">
          <div key={current.id} className="max-w-[720px] animate-fadeUp">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
              <span className="rounded bg-brand/20 px-2 py-1 text-brand-400 ring-1 ring-brand/30">
                {type === 'tv' ? 'Series' : 'Movie'}
              </span>
              {current.vote_average > 0 && (
                <span className="inline-flex items-center gap-1 text-white/70">
                  <Star size={11} className="fill-gold text-gold" />
                  {Number(current.vote_average).toFixed(1)}
                </span>
              )}
              {current.year && <span className="text-white/45">{current.year}</span>}
              {current.seasons ? (
                <span className="text-white/45">
                  {current.seasons} season{current.seasons > 1 ? 's' : ''}
                </span>
              ) : null}
            </div>

            {current.logo ? (
              <img
                src={IMG.logo(current.logo, 'w500')}
                alt={current.title}
                className="mb-4 max-h-[84px] w-auto max-w-[min(460px,72vw)] object-contain object-left drop-shadow-[0_14px_30px_rgba(0,0,0,0.65)] sm:max-h-[118px]"
              />
            ) : (
              <h1 className="mb-3 text-[clamp(2.2rem,5.4vw,4.6rem)] font-black leading-[0.95] tracking-[-0.03em] text-white text-shadow-hero">
                {current.title}
              </h1>
            )}

            {current.genres?.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] font-medium text-white/60">
                {current.genres.slice(0, 3).map((g, i) => (
                  <span key={g} className="flex items-center gap-2">
                    {i > 0 && <span className="text-white/25">•</span>}
                    {g}
                  </span>
                ))}
              </div>
            )}

            <p className="mb-6 line-clamp-3 max-w-[560px] text-[13.5px] leading-relaxed text-white/70 sm:text-[15px]">
              {current.overview}
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => navigate(`/watch/${type}/${current.id}`)}
                className="btn-primary px-6 py-3"
              >
                <Play size={17} className="fill-ink-950" /> Play now
              </button>
              <Link to={`/${type}/${current.id}`} className="btn-ghost px-5 py-3">
                <Info size={17} /> Details
              </Link>
              <button
                onClick={() => onToggleList({ ...current, type })}
                aria-label={inList ? 'Remove from My List' : 'Add to My List'}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/[0.07] text-white backdrop-blur transition hover:border-white/40 hover:bg-white/[0.14]"
              >
                {inList ? <Check size={18} /> : <Plus size={18} />}
              </button>
            </div>
          </div>

          {/* Slide thumbnails */}
          <div className="absolute bottom-14 right-4 hidden items-end gap-2.5 sm:bottom-20 md:flex lg:right-10">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setIndex(i)}
                aria-label={`Show ${item.title}`}
                className={cx(
                  'group relative overflow-hidden rounded-lg transition-all duration-500 ease-smooth',
                  i === index
                    ? 'h-[92px] w-[62px] ring-2 ring-white'
                    : 'h-[74px] w-[50px] opacity-55 ring-1 ring-white/20 hover:opacity-90'
                )}
              >
                <img
                  src={IMG.poster(item.poster_path, 'w185')}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {i === index && !paused && (
                  <span
                    key={`bar-${index}`}
                    className="absolute inset-x-0 bottom-0 h-[2.5px] origin-left bg-brand-400"
                    style={{ animation: 'heroProgress 9s linear forwards' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Mobile dots */}
          <div className="mt-6 flex items-center gap-1.5 md:hidden">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={cx(
                  'h-1.5 rounded-full transition-all duration-500',
                  i === index ? 'w-7 bg-white' : 'w-1.5 bg-white/30'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      `}</style>
    </section>
  );
}
