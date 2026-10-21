import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { POPULAR_GENRES } from '../lib/catalog';
import { IMG } from '../lib/tmdb';

export default function GenresRow({ grid = false }) {
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
        {POPULAR_GENRES.map((genre) => (
          <GenreCard key={genre.slug} genre={genre} />
        ))}
      </div>
    );
  }

  return (
    <section className="group/row relative py-4">
      <div className="mb-3.5 flex items-center justify-between px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
        <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-white sm:text-[21px]">
          Popular Genres
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
          aria-label="Scroll genres left"
          className="hidden lg:grid place-items-center absolute bottom-0 left-[96px] top-0 z-30 w-12 bg-gradient-to-r from-[#0f1014] via-[#0f1014]/80 to-transparent text-white opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
        >
          <ChevronLeft size={26} />
        </button>

        <div
          ref={scrollerRef}
          className="no-scrollbar flex gap-3.5 overflow-x-auto px-4 py-2 sm:gap-4 sm:px-8 lg:pl-[108px] lg:pr-12"
        >
          {POPULAR_GENRES.map((genre) => (
            <div key={genre.slug} className="w-[196px] shrink-0 sm:w-[228px]">
              <GenreCard genre={genre} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByDir(1)}
          aria-label="Scroll genres right"
          className="hidden lg:grid place-items-center absolute bottom-0 right-0 top-0 z-30 w-12 bg-gradient-to-l from-[#0f1014] via-[#0f1014]/80 to-transparent text-white opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
        >
          <ChevronRight size={26} />
        </button>
      </div>
    </section>
  );
}

function GenreCard({ genre }) {
  const target =
    genre.slug === 'anime'
      ? '/anime'
      : `/discover/movie?genre=${genre.movieGenre}&label=${encodeURIComponent(genre.name)}`;

  return (
    <Link
      to={target}
      className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#16181f] ring-1 ring-white/[0.1] transition-transform duration-200 ease-out hover:scale-[1.04] hover:ring-white/30"
    >
      {genre.backdrop && (
        <img
          src={IMG.backdrop(genre.backdrop, 'w500')}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-75"
        />
      )}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${genre.color} to-black/45`}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/25 transition-opacity duration-200 group-hover:opacity-10" />
      <span className="relative z-10 px-3 text-center font-display text-[17px] font-extrabold tracking-[-0.01em] text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.95)] sm:text-[18.5px]">
        {genre.name}
      </span>
    </Link>
  );
}
