import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PosterCard from './PosterCard';

export default function ContentRow({
  title,
  items = [],
  loading = false,
  viewAllTo,
  onRemoveItem,
  actionSlot,
}) {
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
    <section className="group/row relative py-3.5">
      <div className="mb-3 flex items-center justify-between px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
        <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-white sm:text-[21px]">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {actionSlot}
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
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          aria-label="Scroll left"
          className="hidden lg:grid place-items-center absolute bottom-6 left-[96px] top-0 z-30 w-12 bg-gradient-to-r from-[#0f1014] via-[#0f1014]/80 to-transparent text-white opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
        >
          <ChevronLeft size={26} />
        </button>

        <div
          ref={scrollerRef}
          className="no-scrollbar flex gap-3.5 overflow-x-auto px-4 pb-6 pt-2 sm:gap-4 sm:px-8 lg:pl-[108px] lg:pr-12"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-[150px] shrink-0 space-y-2 sm:w-[176px]">
                  <div className="skeleton aspect-[2/3] w-full rounded-[8px]" />
                  <div className="skeleton h-3.5 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              ))
            : items.map((item) => (
                <PosterCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onRemove={onRemoveItem}
                  className="w-[150px] shrink-0 sm:w-[178px]"
                />
              ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByDir(1)}
          aria-label="Scroll right"
          className="hidden lg:grid place-items-center absolute bottom-6 right-0 top-0 z-30 w-12 bg-gradient-to-l from-[#0f1014] via-[#0f1014]/80 to-transparent text-white opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
        >
          <ChevronRight size={26} />
        </button>
      </div>
    </section>
  );
}
