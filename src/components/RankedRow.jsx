import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { IMG } from '../lib/tmdb';

export default function RankedRow({ title, items = [], loading = false, viewAllTo }) {
  const scrollerRef = useRef(null);

  const scrollByDir = (dir) => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({
      left: dir * scrollerRef.current.clientWidth * 0.82,
      behavior: 'smooth',
    });
  };

  if (!loading && !items.length) return null;

  return (
    <section className="group/row relative py-4">
      <div className="mb-3.5 flex items-center justify-between px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
        <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-white sm:text-[21px]">
          {title}
        </h2>
        {viewAllTo && (
          <Link
            to={viewAllTo}
            className="inline-flex items-center gap-0.5 text-[13.5px] font-semibold text-[#8f98b2] transition-colors hover:text-white"
          >
            <span>View All</span>
            <ChevronRight size={16} />
          </Link>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          aria-label="Scroll left"
          className="hidden lg:grid place-items-center absolute bottom-0 left-[96px] top-0 z-30 w-12 bg-gradient-to-r from-[#0f1014] via-[#0f1014]/80 to-transparent text-white opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
        >
          <ChevronLeft size={26} />
        </button>

        <div
          ref={scrollerRef}
          className="no-scrollbar flex gap-4 overflow-x-auto px-4 py-2 sm:gap-5 sm:px-8 lg:pl-[108px] lg:pr-12"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-[164px] shrink-0 sm:w-[190px]">
                  <div className="skeleton aspect-[2/3] w-full rounded-[8px]" />
                </div>
              ))
            : items.slice(0, 10).map((item, idx) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={`/${item.type}/${item.id}`}
                  className="group/rank relative flex w-[166px] shrink-0 items-end pl-7 sm:w-[196px] sm:pl-9"
                >
                  {/* Hotstar / Bingr Giant Gradient Rank Number */}
                  <span
                    aria-hidden="true"
                    className="rank-glyph pointer-events-none absolute -bottom-1 left-0 z-20 text-[84px] transition-transform duration-300 group-hover/rank:-translate-y-1.5 sm:text-[104px]"
                  >
                    {idx + 1}
                  </span>

                  <div className="relative z-10 aspect-[2/3] w-full overflow-hidden rounded-[8px] bg-[#16181f] ring-1 ring-white/[0.08] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/rank:scale-[1.05] group-hover/rank:ring-white/25 group-hover/rank:shadow-[0_18px_40px_rgba(0,0,0,0.8)]">
                    {item.poster ? (
                      <img
                        src={IMG.poster(item.poster, 'w500')}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-white/30">
                        <Film size={24} />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByDir(1)}
          aria-label="Scroll right"
          className="hidden lg:grid place-items-center absolute bottom-0 right-0 top-0 z-30 w-12 bg-gradient-to-l from-[#0f1014] via-[#0f1014]/80 to-transparent text-white opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
        >
          <ChevronRight size={26} />
        </button>
      </div>
    </section>
  );
}
