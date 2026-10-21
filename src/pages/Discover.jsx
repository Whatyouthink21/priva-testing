import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Dices, Loader2 } from 'lucide-react';
import PosterCard from '../components/PosterCard';
import {
  CATEGORY_FETCHERS,
  POPULAR_GENRES,
  POPULAR_LANGUAGES,
  STUDIOS,
} from '../lib/catalog';
import { api, normalizeItem } from '../lib/tmdb';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popular' },
  { value: 'vote_average.desc', label: 'Top Rated' },
  { value: 'primary_release_date.desc', label: 'Newest First' },
  { value: 'revenue.desc', label: 'Box Office' },
];

const YEARS = Array.from({ length: 30 }, (_, idx) => String(2026 - idx));

export default function Discover({ mode = 'discover' }) {
  const { slug, media = 'movie' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const decodedCategory = slug ? decodeURIComponent(slug) : '';
  const isCategoryShelf = mode === 'category' && Boolean(CATEGORY_FETCHERS[decodedCategory]);

  const activeMedia = media === 'tv' || media === 'anime' ? media : 'movie';
  const [genre, setGenre] = useState(searchParams.get('genre') || '');
  const [year, setYear] = useState(searchParams.get('year') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popularity.desc');
  const [studioSlug, setStudioSlug] = useState(searchParams.get('studio') || '');
  const [lang, setLang] = useState(searchParams.get('lang') || '');

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setGenre(searchParams.get('genre') || '');
    setYear(searchParams.get('year') || '');
    setSortBy(searchParams.get('sort') || 'popularity.desc');
    setStudioSlug(searchParams.get('studio') || '');
    setLang(searchParams.get('lang') || '');
  }, [searchParams]);

  const fetchBatch = async (targetPage = 1) => {
    if (isCategoryShelf) {
      return CATEGORY_FETCHERS[decodedCategory](targetPage);
    }

    const endpointType = activeMedia === 'movie' ? 'movie' : 'tv';
    const params = {
      page: targetPage,
      sort_by:
        endpointType === 'tv' && sortBy === 'primary_release_date.desc'
          ? 'first_air_date.desc'
          : sortBy,
    };

    if (sortBy === 'vote_average.desc') {
      params['vote_count.gte'] = 250;
    }

    if (activeMedia === 'anime') {
      params.with_genres = genre ? `16,${genre}` : '16';
      params.with_original_language = 'ja';
    } else if (genre) {
      params.with_genres = genre;
    }

    if (year) {
      if (endpointType === 'movie') params.primary_release_year = year;
      else params.first_air_date_year = year;
    }

    if (lang && activeMedia !== 'anime') {
      params.with_original_language = lang;
    }

    if (studioSlug) {
      const st = STUDIOS.find((s) => s.slug === studioSlug);
      if (st) {
        if (endpointType === 'tv' && st.networkId) {
          params.with_networks = st.networkId;
        } else if (st.providerId) {
          params.with_watch_providers = st.providerId;
          params.watch_region = 'US';
        } else if (st.companyId) {
          params.with_companies = st.companyId;
        }
      }
    }

    const res = await api.discover(endpointType, params);
    return (res.results || []).map((x) =>
      normalizeItem(activeMedia === 'anime' ? { ...x, isAnime: true } : x, endpointType)
    );
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);

    const heading = isCategoryShelf
      ? `${decodedCategory} · Priva`
      : `Priva Finds · ${
          activeMedia === 'anime' ? 'Anime' : activeMedia === 'tv' ? 'Series' : 'Movies'
        }`;
    document.title = heading;

    fetchBatch(1)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isCategoryShelf, decodedCategory, activeMedia, genre, year, sortBy, studioSlug, lang]);

  const syncUrlParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    next.delete('label');
    setSearchParams(next);
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const more = await fetchBatch(nextPage);
      setItems((prev) => {
        const seen = new Set(prev.map((x) => `${x.type}:${x.id}`));
        return [...prev, ...more.filter((x) => !seen.has(`${x.type}:${x.id}`))];
      });
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRandomPick = () => {
    if (!items.length) return;
    const pick = items[Math.floor(Math.random() * items.length)];
    navigate(`/${pick.type}/${pick.id}`);
  };

  const studioObj = STUDIOS.find((s) => s.slug === studioSlug);
  const customLabel = searchParams.get('label');

  return (
    <div className="min-h-screen bg-[#0f1014] px-4 pt-16 sm:px-8 lg:pl-[108px] lg:pr-12 lg:pt-10">
      {/* Header + Media Type Switcher */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-white sm:text-[32px]">
            {isCategoryShelf
              ? decodedCategory
              : studioObj
                ? `${studioObj.name} · Originals & Hits`
                : customLabel
                  ? `${customLabel} · Priva Finds`
                  : `Priva Finds · ${
                      activeMedia === 'anime'
                        ? 'Anime'
                        : activeMedia === 'tv'
                          ? 'Series'
                          : 'Movies'
                    }`}
          </h1>
        </div>

        {!isCategoryShelf && (
          <div className="flex items-center gap-1 rounded-xl bg-[#16181f] p-1 ring-1 ring-white/[0.08]">
            {[
              { id: 'movie', label: 'Movies' },
              { id: 'tv', label: 'Series' },
              { id: 'anime', label: 'Anime' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(`/discover/${tab.id}?${searchParams.toString()}`)}
                className={`rounded-lg px-4 py-1.5 text-[12.5px] font-bold transition ${
                  activeMedia === tab.id
                    ? 'bg-white text-[#0f1014]'
                    : 'text-[#8f98b2] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Row matching bingr.one/discover/movie: Genre | Year | Sort | Studio | Language | Random */}
      {!isCategoryShelf && (
        <div className="mb-7 flex flex-wrap items-center gap-2.5">
          <select
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              syncUrlParams({ genre: e.target.value });
            }}
            className="h-10 rounded-xl border border-white/[0.08] bg-[#16181f] px-3.5 text-[13px] font-semibold text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Genres</option>
            {POPULAR_GENRES.filter((g) => g.slug !== 'anime').map((g) => (
              <option key={g.slug} value={activeMedia === 'movie' ? g.movieGenre : g.tvGenre}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              syncUrlParams({ year: e.target.value });
            }}
            className="h-10 rounded-xl border border-white/[0.08] bg-[#16181f] px-3.5 text-[13px] font-semibold text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              syncUrlParams({ sort: e.target.value });
            }}
            className="h-10 rounded-xl border border-white/[0.08] bg-[#16181f] px-3.5 text-[13px] font-semibold text-white focus:border-blue-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={studioSlug}
            onChange={(e) => {
              setStudioSlug(e.target.value);
              syncUrlParams({ studio: e.target.value });
            }}
            className="h-10 rounded-xl border border-white/[0.08] bg-[#16181f] px-3.5 text-[13px] font-semibold text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Studios</option>
            {STUDIOS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>

          {activeMedia !== 'anime' && (
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.target.value);
                syncUrlParams({ lang: e.target.value });
              }}
              className="h-10 rounded-xl border border-white/[0.08] bg-[#16181f] px-3.5 text-[13px] font-semibold text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Languages</option>
              {POPULAR_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleRandomPick}
            disabled={!items.length}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/[0.09] px-4 text-[13px] font-bold text-white transition hover:bg-blue-600 disabled:opacity-40"
          >
            <Dices size={15} />
            <span>Random</span>
          </button>
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton aspect-[2/3] w-full rounded-[8px]" />
              <div className="skeleton h-3.5 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {items.map((item) => (
              <PosterCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>

          {items.length > 0 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.1] bg-[#16181f] px-7 text-[13.5px] font-bold text-white transition hover:bg-[#1e2230] disabled:opacity-50"
              >
                {loadingMore && <Loader2 size={15} className="animate-spin" />}
                <span>Load More</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
