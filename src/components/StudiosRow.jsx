import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STUDIOS } from '../lib/catalog';

export default function StudiosRow({ grid = false }) {
  const scrollerRef = useRef(null);

  const scrollByDir = (dir) => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({
      left: dir * scrollerRef.current.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  if (grid) {
    return (
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {STUDIOS.map((studio) => (
          <StudioCard key={studio.slug} studio={studio} />
        ))}
      </div>
    );
  }

  return (
    <section className="group/row relative py-4">
      <div className="mb-3.5 flex items-center justify-between px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
        <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-white sm:text-[21px]">
          Studios
        </h2>
        <Link
          to="/categories"
          className="inline-flex items-center gap-0.5 text-[13.5px] font-semibold text-[#8f98b2] transition-colors hover:text-white"
        >
          <span>View All</span>
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          aria-label="Scroll studios left"
          className="hidden lg:grid place-items-center absolute bottom-0 left-[96px] top-0 z-30 w-12 bg-gradient-to-r from-[#0f1014] via-[#0f1014]/80 to-transparent text-white opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
        >
          <ChevronLeft size={26} />
        </button>

        <div
          ref={scrollerRef}
          className="no-scrollbar flex gap-3.5 overflow-x-auto px-4 py-2 sm:gap-4 sm:px-8 lg:pl-[108px] lg:pr-12"
        >
          {STUDIOS.map((studio) => (
            <div key={studio.slug} className="w-[196px] shrink-0 sm:w-[228px]">
              <StudioCard studio={studio} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByDir(1)}
          aria-label="Scroll studios right"
          className="hidden lg:grid place-items-center absolute bottom-0 right-0 top-0 z-30 w-12 bg-gradient-to-l from-[#0f1014] via-[#0f1014]/80 to-transparent text-white opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
        >
          <ChevronRight size={26} />
        </button>
      </div>
    </section>
  );
}

function StudioCard({ studio }) {
  const [logoFailed, setLogoFailed] = useState(false);
  return (
    <Link
      to={`/discover/movie?studio=${studio.slug}`}
      className="group relative flex aspect-[16/9] w-full flex-col items-center justify-center overflow-hidden rounded-[10px] bg-[#16181f] ring-1 ring-white/[0.08] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.05] hover:ring-white/30"
    >
      {/* Animated signature studio aura on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${studio.gradient} opacity-45 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div
        style={{
          background: `radial-gradient(circle at 50% 50%, ${studio.glow} 0%, transparent 70%)`,
        }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      {studio.logo && !logoFailed ? <img src={studio.logo} alt={studio.name} loading="lazy" onError={() => setLogoFailed(true)} className="relative z-10 h-16 w-28 rounded-lg object-contain transition-transform duration-300 group-hover:scale-110 sm:h-20" /> : <span className="relative z-10 font-display text-[17px] font-black tracking-[0.06em] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-110 sm:text-[19px]">
        {studio.wordmark}
      </span>}
      <span className="relative z-10 mt-1 text-[10.5px] font-medium tracking-wide text-white/55 opacity-0 transition-all duration-300 group-hover:opacity-100">
        {studio.tagline}
      </span>
    </Link>
  );
}
