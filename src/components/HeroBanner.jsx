import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Info, Play, Plus } from 'lucide-react';
import { fetchLogoPath, formatScore, IMG } from '../lib/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';

export default function HeroBanner({ slides = [], loading = false }) {
  const navigate = useNavigate();
  const { isInList, toggleMyList, getProgress } = useLibrary();
  const { toast } = useToast();

  const [index, setIndex] = useState(0);
  const [prevBackdrop, setPrevBackdrop] = useState(null);
  const [paused, setPaused] = useState(false);
  const [readyLogos, setReadyLogos] = useState({});
  const stripRef = useRef(null);

  const firstSlideKey = slides[0] ? `${slides[0].type}:${slides[0].id}` : '';

  // Reset cleanly whenever section slides change
  useEffect(() => {
    setIndex(0);
    setPrevBackdrop(null);
  }, [firstSlideKey]);

  const active = slides[index] || slides[0] || null;

  // Preload ONLY the next single slide backdrop + lazily fetch only the active slide's logo
  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;

    const nextSlide = slides[(index + 1) % slides.length];
    if (nextSlide?.backdrop) {
      const nextImg = new Image();
      nextImg.src = IMG.backdrop(nextSlide.backdrop, 'w1280');
    }

    const activeKey = `${active.type}:${active.id}`;
    if (!readyLogos[activeKey]) {
      (active.logo ? Promise.resolve(active.logo) : fetchLogoPath(active.type, active.id)).then(
        (logoPath) => {
          if (cancelled || !logoPath) return;
          const url = IMG.logo(logoPath, 'w500');
          const probe = new Image();
          probe.onload = () => {
            if (!cancelled) {
              setReadyLogos((prev) => ({ ...prev, [activeKey]: url }));
            }
          };
          probe.src = url;
        }
      );
    }

    return () => {
      cancelled = true;
    };
  }, [active?.type, active?.id, index, slides]);

  const changeSlide = (nextIdx) => {
    setIndex((curr) => {
      if (curr === nextIdx) return curr;
      const oldSrc = slides[curr]?.backdrop
        ? IMG.backdrop(slides[curr].backdrop, 'w1280')
        : slides[curr]?.poster
          ? IMG.poster(slides[curr].poster, 'w780')
          : null;
      if (oldSrc) setPrevBackdrop(oldSrc);
      return nextIdx;
    });
  };

  useEffect(() => {
    if (slides.length <= 1 || paused) return undefined;
    const timer = setInterval(() => {
      setIndex((curr) => {
        const oldSrc = slides[curr]?.backdrop
          ? IMG.backdrop(slides[curr].backdrop, 'w1280')
          : null;
        if (oldSrc) setPrevBackdrop(oldSrc);
        return (curr + 1) % slides.length;
      });
    }, 7000);
    return () => clearInterval(timer);
  }, [slides, paused, index]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const activeBtn = strip.children[index];
    if (!activeBtn) return;
    const targetLeft =
      activeBtn.offsetLeft - strip.clientWidth / 2 + activeBtn.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, [index]);

  if (loading || !active) {
    return (
      <section className="relative h-[76vh] min-h-[540px] w-full overflow-hidden bg-[#0f1014] lg:h-[88vh]">
        <div className="skeleton h-full w-full opacity-40" />
        <div className="hero-gradient-mask absolute inset-0" />
        <div className="absolute bottom-14 left-4 right-4 max-w-xl space-y-4 lg:left-[108px]">
          <div className="skeleton h-14 w-72 rounded-xl" />
          <div className="skeleton h-4 w-56 rounded" />
          <div className="skeleton h-16 w-full rounded-lg" />
          <div className="flex gap-3 pt-1">
            <div className="skeleton h-12 w-44 rounded-[10px]" />
            <div className="skeleton h-12 w-12 rounded-[10px]" />
          </div>
        </div>
      </section>
    );
  }

  const saved = isInList(active);
  const resume = getProgress(active.type, active.id);
  const score = formatScore(active.rating);
  const watchPath =
    active.type === 'tv'
      ? `/watch/tv/${active.id}/${resume?.season || 1}/${resume?.episode || 1}`
      : `/watch/movie/${active.id}`;

  const activeKey = `${active.type}:${active.id}`;
  const verifiedLogoUrl = readyLogos[activeKey] || null;
  const desktopHeroImg =
    IMG.backdrop(active.backdrop, 'w1280') || IMG.poster(active.poster, 'w780');
  const mobileHeroImg =
    IMG.poster(active.poster, 'w500') || IMG.backdrop(active.backdrop, 'w780');

  const metaParts = [
    score,
    active.year,
    ...(active.genres?.length ? active.genres.slice(0, 2) : [active.badge]),
  ].filter(Boolean);

  const scrollStrip = (dir) => {
    if (!stripRef.current) return;
    stripRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative h-[78vh] min-h-[540px] max-h-[880px] w-full select-none overflow-hidden bg-[#0f1014] lg:h-[88vh]"
    >
      {/* Zero-Flicker Crossfade Backdrop Layer */}
      <div className="absolute inset-0">
        {prevBackdrop && (
          <img
            src={prevBackdrop}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="hidden h-full w-full object-cover object-top sm:block"
          />
        )}

        <div key={`bg-${active.type}-${active.id}`} className="absolute inset-0 animate-hero-bg">
          {desktopHeroImg && (
            <img
              src={desktopHeroImg}
              alt={active.title}
              decoding="async"
              fetchpriority="high"
              className="hidden h-full w-full object-cover object-top sm:block"
            />
          )}
          {mobileHeroImg && (
            <img
              src={mobileHeroImg}
              alt={active.title}
              decoding="async"
              fetchpriority="high"
              className="block h-full w-full object-cover object-top sm:hidden"
            />
          )}
        </div>
      </div>

      {/* Cinematic Edge Vignettes */}
      <div className="hero-gradient-mask pointer-events-none absolute inset-0" />

      {/* Left Foreground Content Stack + Bottom-Right Mini Thumbnail Strip */}
      <div className="relative z-10 flex h-full flex-col justify-end pb-10 pl-4 pr-4 sm:pb-12 sm:pl-8 lg:pb-14 lg:pl-[108px] lg:pr-12">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div
            key={`info-${active.type}-${active.id}`}
            className="max-w-[540px] animate-hero-in"
          >
            {/* Title is ALWAYS rendered instantly; upgrades to clearlogo only once preloaded */}
            {verifiedLogoUrl ? (
              <img
                src={verifiedLogoUrl}
                alt={active.title}
                decoding="async"
                className="mb-4 max-h-[76px] w-auto max-w-[300px] object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] sm:max-h-[100px] sm:max-w-[380px]"
              />
            ) : (
              <h1 className="mb-3 font-display text-[32px] font-extrabold leading-[1.06] tracking-[-0.03em] text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.85)] sm:text-[46px]">
                {active.title}
              </h1>
            )}

            <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[13.5px] font-semibold text-[#e1e6f0]/90 sm:text-[14.5px]">
              {metaParts.map((part, idx) => (
                <span key={`${part}-${idx}`} className="inline-flex items-center gap-1.5">
                  {idx > 0 && <span className="text-white/40">·</span>}
                  <span>{part}</span>
                </span>
              ))}
              <span className="ml-1.5 rounded bg-white/[0.14] px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
                {active.badge}
              </span>
            </div>

            {active.overview && (
              <p className="mb-6 line-clamp-3 text-[13.5px] leading-[1.6] text-[#c4ccdf] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] sm:text-[14.5px]">
                {active.overview}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(watchPath)}
                className="btn-hero-watch inline-flex h-[48px] items-center justify-center gap-2.5 rounded-[10px] px-7 text-[15px] font-bold sm:px-9"
              >
                <Play size={18} className="fill-current" />
                <span>
                  {resume
                    ? active.type === 'tv'
                      ? `Continue S${resume.season} E${resume.episode}`
                      : 'Resume Watching'
                    : 'Watch Now'}
                </span>
              </button>

              <Link
                to={`/${active.type}/${active.id}`}
                className="btn-hero-glass inline-flex h-[48px] items-center justify-center gap-2 rounded-[10px] px-5 text-[14.5px] font-semibold"
              >
                <Info size={17} />
                <span>See More</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  const added = toggleMyList(active);
                  toast(
                    added
                      ? `Added "${active.title}" to My List`
                      : `Removed "${active.title}" from My List`,
                    added ? 'success' : 'info'
                  );
                }}
                aria-label={saved ? 'Remove from My List' : 'Add to My List'}
                title={saved ? 'In My List' : 'Add to My List'}
                className="btn-hero-glass grid h-[48px] w-[48px] place-items-center rounded-[10px]"
              >
                {saved ? <Check size={20} strokeWidth={2.5} /> : <Plus size={21} strokeWidth={2.3} />}
              </button>
            </div>
          </div>

          {/* Bottom-Right Landscape Thumbnail Strip */}
          {slides.length > 1 && (
            <div className="group/strip relative hidden max-w-[520px] items-center xl:flex">
              <button
                type="button"
                onClick={() => scrollStrip(-1)}
                aria-label="Previous slides"
                className="absolute -left-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-black/75 text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover/strip:opacity-100 hover:bg-black"
              >
                <ChevronLeft size={16} />
              </button>

              <div
                ref={stripRef}
                className="no-scrollbar flex items-center gap-2.5 overflow-x-auto px-2 py-2"
              >
                {slides.map((slide, idx) => {
                  const isCurrent = idx === index;
                  const thumbSrc =
                    IMG.backdrop(slide.backdrop, 'w300') || IMG.poster(slide.poster, 'w342');
                  return (
                    <button
                      key={`${slide.type}-${slide.id}`}
                      type="button"
                      onClick={() => changeSlide(idx)}
                      aria-label={`Preview ${slide.title}`}
                      title={slide.title}
                      className={`relative aspect-video w-[86px] shrink-0 overflow-hidden rounded-[6px] bg-[#16181f] transition-transform duration-200 ${
                        isCurrent
                          ? '-translate-y-1 scale-105 opacity-100 ring-2 ring-white shadow-[0_8px_24px_rgba(0,0,0,0.85)]'
                          : 'opacity-60 hover:scale-[1.03] hover:opacity-95'
                      }`}
                    >
                      {thumbSrc && (
                        <img
                          src={thumbSrc}
                          alt={slide.title}
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      )}
                      {isCurrent && !paused && (
                        <span className="absolute inset-x-0 bottom-0 h-[2.5px] bg-white/30">
                          <span className="block h-full w-full origin-left bg-white animate-hero-timer" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollStrip(1)}
                aria-label="Next slides"
                className="absolute -right-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-black/75 text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover/strip:opacity-100 hover:bg-black"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {slides.length > 1 && (
            <div className="flex items-center gap-1.5 xl:hidden">
              {slides.map((s, idx) => (
                <button
                  key={`${s.type}-${s.id}`}
                  type="button"
                  onClick={() => changeSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === index ? 'w-6 bg-white' : 'w-1.5 bg-white/35'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
