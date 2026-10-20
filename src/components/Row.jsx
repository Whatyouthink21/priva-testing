import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '../lib/utils';
import MediaCard, { MediaCardSkeleton } from './MediaCard';

export function SectionHeading({ title, subtitle, link, linkLabel = 'View all', className }) {
  return (
    <div className={cx('mb-4 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[19px] font-bold tracking-tight text-white sm:text-[22px]">
          <span className="h-[18px] w-[3px] rounded-full bg-brand-500 sm:h-5" />
          <span className="truncate">{title}</span>
        </h2>
        {subtitle && (
          <p className="mt-1.5 pl-[11px] text-[13px] text-white/45">{subtitle}</p>
        )}
      </div>
      {link && (
        <Link
          to={link}
          className="group inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-white/55 transition hover:text-white"
        >
          {linkLabel}
          <ChevronRight size={15} className="transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export default function Row({
  title,
  subtitle,
  link,
  items = [],
  loading = false,
  cardWidth,
  progressFor,
  eager = false,
  className,
  renderItem,
}) {
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    const t = window.setTimeout(measure, 350);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      window.clearTimeout(t);
    };
  }, [measure, items.length, loading]);

  const scrollBy = (direction) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.82, 320), behavior: 'smooth' });
  };

  if (!loading && !items.length) return null;

  return (
    <section className={cx('group/row relative', className)} data-reveal>
      <div className="container-page">
        <SectionHeading title={title} subtitle={subtitle} link={link} />
      </div>

      <div className="relative">
        <div
          ref={scroller}
          className="row-scroller container-page flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1 sm:gap-4"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <MediaCardSkeleton key={i} width={cardWidth} />
              ))
            : items.map((item, index) =>
                renderItem ? (
                  <div key={`${item.id}-${index}`} className="snap-start">
                    {renderItem(item, index)}
                  </div>
                ) : (
                  <div key={`${item.type || 'x'}-${item.id}-${index}`} className="snap-start">
                    <MediaCard
                      item={item}
                      width={cardWidth}
                      eager={eager && index < 4}
                      progress={progressFor ? progressFor(item)?.progress : undefined}
                    />
                  </div>
                )
              )}
        </div>

        {edges.left && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-ink-900/90 p-2.5 text-white opacity-0 shadow-card backdrop-blur transition duration-300 hover:bg-ink-700 group-hover/row:opacity-100 md:block"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {edges.right && (
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-ink-900/90 p-2.5 text-white opacity-0 shadow-card backdrop-blur transition duration-300 hover:bg-ink-700 group-hover/row:opacity-100 md:block"
          >
            <ChevronRight size={20} />
          </button>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-ink-950 to-transparent md:block" />
      </div>
    </section>
  );
}
