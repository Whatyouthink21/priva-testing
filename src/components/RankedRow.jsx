import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from './MediaCard';
import { SectionHeading } from './Row';
import { cx } from '../lib/utils';

export default function RankedRow({ title, link, items = [], loading = false, subtitle }) {
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
    const t = window.setTimeout(measure, 300);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      window.clearTimeout(t);
    };
  }, [measure, items.length, loading]);

  const scrollBy = (dir) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 320), behavior: 'smooth' });
  };

  if (!loading && !items.length) return null;

  return (
    <section className="group/rank relative" data-reveal>
      <div className="container-page">
        <SectionHeading title={title} subtitle={subtitle} link={link} />
      </div>

      <div className="relative">
        <div
          ref={scroller}
          className="row-scroller container-page flex snap-x gap-0 overflow-x-auto pb-2"
        >
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex shrink-0 items-end gap-1 pr-2">
                  <div className="h-24 w-12 animate-pulse rounded bg-white/5" />
                  <div className="skeleton aspect-[2/3] w-[132px] sm:w-[150px]" />
                </div>
              ))
            : items.slice(0, 10).map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className={cx(
                    'group/rank-item flex shrink-0 snap-start items-end',
                    i === 0 ? 'pl-0' : '-ml-4 sm:-ml-7'
                  )}
                >
                  <span className="rank-number relative z-0 -mr-3 select-none pb-1 transition-colors duration-500 group-hover/rank-item:text-white/10 sm:-mr-4">
                    {i + 1}
                  </span>
                  <MediaCard
                    item={item}
                    width="w-[128px] sm:w-[145px] lg:w-[158px]"
                    className="relative z-10"
                    eager={i < 3}
                  />
                </div>
              ))}
        </div>

        {edges.left && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-ink-900/90 p-2.5 text-white opacity-0 shadow-card backdrop-blur transition duration-300 hover:bg-ink-700 group-hover/rank:opacity-100 md:block"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {edges.right && (
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-ink-900/90 p-2.5 text-white opacity-0 shadow-card backdrop-blur transition duration-300 hover:bg-ink-700 group-hover/rank:opacity-100 md:block"
          >
            <ChevronRight size={20} />
          </button>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-ink-950 to-transparent md:block" />
      </div>
    </section>
  );
}
