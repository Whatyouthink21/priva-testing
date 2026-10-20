import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Loader2, SlidersHorizontal } from 'lucide-react';
import MediaGrid from '../components/MediaGrid';
import { api, normalize } from '../lib/tmdb';
import { useReveal } from '../hooks/useReveal';
import { cx } from '../lib/utils';

const SORTS = [
  { id: 'popular', label: 'Popular' },
  { id: 'top_rated', label: 'Top rated' },
  { id: 'newest', label: 'Newest' },
  { id: 'now_playing', label: 'In cinemas', movieOnly: true },
  { id: 'upcoming', label: 'Coming soon', movieOnly: true },
  { id: 'trending', label: 'Trending' },
];

const HEADINGS = {
  movie: {
    title: 'Movies',
    blurb: 'Blockbusters, indie gems and everything in between.',
    apiType: 'movie',
  },
  tv: {
    title: 'TV Shows',
    blurb: 'Binge-ready series from every corner of the world.',
    apiType: 'tv',
  },
  anime: {
    title: 'Anime',
    blurb: 'The best of Japanese animation, freshly ranked.',
    apiType: 'tv',
  },
};

export default function Browse({ kind = 'movie' }) {
  const meta = HEADINGS[kind] || HEADINGS.movie;
  const type = meta.apiType;
  const [params, setParams] = useSearchParams();

  const [genre, setGenre] = useState(params.get('genre') || '');
  const [sort, setSort] = useState(params.get('sort') || 'popular');
  const [genres, setGenres] = useState([]);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const sentinel = useRef(null);
  const requestId = useRef(0);

  useReveal([kind, genre, sort]);

  useEffect(() => {
    setGenre(params.get('genre') || '');
    setSort(params.get('sort') || 'popular');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('genre'), params.get('sort')]);

  useEffect(() => {
    let alive = true;
    api
      .genres(type)
      .then((data) => alive && setGenres(data.genres || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [type]);

  const buildRequest = useCallback(
    (requestedPage) => {
      if (kind === 'anime') {
        return api.discover('tv', {
          page: requestedPage,
          with_genres: genre ? `16,${genre}` : '16',
          with_original_language: 'ja',
          sort_by: sort === 'top_rated' ? 'vote_average.desc' : 'popularity.desc',
          'vote_count.gte': 40,
        });
      }
      if (sort === 'popular') return api.popular(type, requestedPage);
      if (sort === 'top_rated') return api.topRated(type, requestedPage);
      if (sort === 'now_playing' && type === 'movie') return api.nowPlaying(requestedPage);
      if (sort === 'upcoming' && type === 'movie') return api.upcoming(requestedPage);
      if (sort === 'trending') return api.trending(type, 'week');
      return api.discover(type, {
        page: requestedPage,
        ...(genre ? { with_genres: genre } : {}),
        sort_by:
          sort === 'newest'
            ? type === 'movie'
              ? 'primary_release_date.desc'
              : 'first_air_date.desc'
            : 'popularity.desc',
        'vote_count.gte': sort === 'newest' ? 10 : 20,
      });
    },
    [kind, type, genre, sort]
  );

  // Reset when filters change
  useEffect(() => {
    setPage(1);
  }, [genre, sort, kind]);

  // First page / filter change
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    buildRequest(1)
      .then((data) => {
        if (id !== requestId.current) return;
        const list = (data.results || []).map((r) => normalize(r, type));
        setItems(list);
        setHasMore(Number(data.page || 1) < Number(data.total_pages || 1));
      })
      .catch(() => id === requestId.current && setError('Could not load titles right now.'))
      .finally(() => id === requestId.current && setLoading(false));
  }, [buildRequest, type]);

  // Load subsequent pages
  useEffect(() => {
    if (page === 1) return;
    const id = requestId.current;
    setLoadingMore(true);
    buildRequest(page)
      .then((data) => {
        if (id !== requestId.current) return;
        const list = (data.results || []).map((r) => normalize(r, type));
        setItems((prev) => {
          const seen = new Set(prev.map((x) => `${x.type}:${x.id}`));
          return [...prev, ...list.filter((x) => !seen.has(`${x.type}:${x.id}`))];
        });
        setHasMore(Number(data.page || page) < Number(data.total_pages || page));
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [page, buildRequest, type]);

  useEffect(() => {
    if (!sentinel.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '800px 0px' }
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const visibleGenres = useMemo(
    () => (kind === 'anime' ? genres.filter((g) => g.id !== 16) : genres),
    [genres, kind]
  );
  const availableSorts = SORTS.filter((s) => !s.movieOnly || type === 'movie');

  return (
    <div className="container-page pb-10 pt-[104px]">
      <header className="mb-7" data-reveal>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">
          Browse
        </p>
        <h1 className="text-[34px] font-extrabold tracking-[-0.03em] sm:text-[44px]">
          {meta.title}
        </h1>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-white/45">{meta.blurb}</p>
      </header>

      <div
        className="sticky top-[70px] z-30 -mx-4 mb-6 border-y border-white/[0.06] bg-ink-950/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6"
        data-reveal
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="mr-1 hidden shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/30 sm:flex">
              <SlidersHorizontal size={13} /> Genre
            </span>
            <button
              onClick={() => {
                setGenre('');
                updateParam('genre', '');
              }}
              className={cx('chip shrink-0', !genre && 'chip-active')}
            >
              All
            </button>
            {visibleGenres.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setGenre(String(g.id));
                  updateParam('genre', String(g.id));
                }}
                className={cx('chip shrink-0', String(g.id) === String(genre) && 'chip-active')}
              >
                {g.name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] text-white/35">
              {loading ? 'Loading titles…' : `${items.length} titles loaded`}
            </p>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  updateParam('sort', e.target.value);
                }}
                aria-label="Sort by"
                className="appearance-none rounded-full border border-white/12 bg-ink-850 py-2 pl-3.5 pr-9 text-[12.5px] font-medium text-white/80 focus:border-brand-500 focus:outline-none"
              >
                {availableSorts.map((s) => (
                  <option key={s.id} value={s.id} className="bg-ink-850">
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
              />
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
          {error}
        </div>
      ) : (
        <MediaGrid
          items={items}
          loading={loading && !items.length}
          empty={
            <p className="col-span-full py-16 text-center text-sm text-white/40">
              Nothing matched those filters. Try another genre.
            </p>
          }
        />
      )}

      <div ref={sentinel} className="h-12" />

      {loadingMore && (
        <div className="flex justify-center py-4 text-white/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="py-6 text-center text-[12px] uppercase tracking-widest text-white/20">
          End of catalogue
        </p>
      )}
    </div>
  );
}
