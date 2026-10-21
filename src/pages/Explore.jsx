import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Compass, Loader2, Search, User, X } from 'lucide-react';
import PosterCard from '../components/PosterCard';
import { api, IMG, normalizeItem } from '../lib/tmdb';
import { useLibrary } from '../context/LibraryContext';

const TYPE_FILTERS = [
  { id: 'all', label: 'All Types' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'Series' },
  { id: 'anime', label: 'Anime' },
  { id: 'person', label: 'Actors' },
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [typeFilter, setTypeFilter] = useState('all');

  const [trendingDefault, setTrendingDefault] = useState([]);
  const [results, setResults] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);

  const { searchHistory, addSearchTerm, clearSearchHistory } = useLibrary();
  const inputRef = useRef(null);

  useEffect(() => {
    document.title = 'Explore · Priva';
    inputRef.current?.focus();

    let cancelled = false;
    Promise.all([api.trendingAll(1), api.animeSeries(1)])
      .then(([trendRes, animeRes]) => {
        if (cancelled) return;
        const tmdbItems = (trendRes.results || [])
          .filter((x) => x.media_type !== 'person')
          .map((x) => normalizeItem(x));
        const animeItems = (animeRes.results || []).map((x) =>
          normalizeItem({ ...x, isAnime: true }, 'tv')
        );
        // Interleave trending movies/series + anime just like bingr.one/explore
        const mixed = [];
        const seen = new Set();
        const maxLen = Math.max(tmdbItems.length, animeItems.length);
        for (let i = 0; i < maxLen; i += 1) {
          if (tmdbItems[i]) {
            const k = `${tmdbItems[i].type}:${tmdbItems[i].id}`;
            if (!seen.has(k)) {
              seen.add(k);
              mixed.push(tmdbItems[i]);
            }
          }
          if (animeItems[i]) {
            const k = `${animeItems[i].type}:${animeItems[i].id}`;
            if (!seen.has(k)) {
              seen.add(k);
              mixed.push(animeItems[i]);
            }
          }
        }
        setTrendingDefault(mixed.slice(0, 36));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setPeople([]);
      setLoading(false);
      if (searchParams.has('q')) setSearchParams({}, { replace: true });
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      setSearchParams({ q: trimmed }, { replace: true });
      try {
        if (typeFilter === 'person') {
          const res = await api.searchTyped('person', trimmed, 1, {
            signal: controller.signal,
          });
          setPeople(res.results || []);
          setResults([]);
        } else if (typeFilter === 'movie' || typeFilter === 'tv') {
          const res = await api.searchTyped(typeFilter, trimmed, 1, {
            signal: controller.signal,
          });
          setResults((res.results || []).map((x) => normalizeItem(x, typeFilter)));
          setPeople([]);
        } else {
          const res = await api.searchMulti(trimmed, 1, { signal: controller.signal });
          const raw = res.results || [];
          const foundPeople = raw.filter((x) => x.media_type === 'person').slice(0, 8);
          let foundMedia = raw
            .filter((x) => x.media_type === 'movie' || x.media_type === 'tv')
            .map((x) => normalizeItem(x));
          if (typeFilter === 'anime') {
            foundMedia = foundMedia.filter((x) => x.isAnime);
          }
          setResults(foundMedia);
          setPeople(typeFilter === 'anime' ? [] : foundPeople);
        }
        addSearchTerm(trimmed);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setResults([]);
          setPeople([]);
        }
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, typeFilter]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#0f1014] px-4 pt-16 sm:px-8 lg:pl-[108px] lg:pr-12 lg:pt-10">
      {/* Large Bingr / Hotstar Full-Width Search Input */}
      <div className="relative">
        <Search
          size={22}
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#8f98b2]"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Movies, shows, anime and more..."
          className="h-14 w-full rounded-xl border border-white/[0.08] bg-[#16181f] pl-14 pr-12 text-[16px] font-medium text-white placeholder-[#78829d] shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition focus:border-blue-500/70 focus:bg-[#191d28] focus:outline-none sm:h-[60px] sm:text-[17.5px]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/[0.08] text-white/80 hover:bg-white/[0.16] hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Bar + Priva Finds Button */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                typeFilter === f.id
                  ? 'bg-white text-[#0f1014]'
                  : 'bg-[#16181f] text-[#8f98b2] ring-1 ring-white/[0.06] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Link
          to="/discover/movie"
          className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2 text-[13px] font-semibold text-white ring-1 ring-white/[0.08] transition hover:bg-white/[0.13]"
        >
          <Compass size={15} className="text-blue-400" />
          <span>Priva Finds</span>
        </Link>
      </div>

      {/* Recent Searches */}
      {!hasQuery && searchHistory.length > 0 && (
        <div className="mt-6">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#8f98b2]">Recent Searches</span>
            <button
              type="button"
              onClick={clearSearchHistory}
              className="text-[12px] font-medium text-[#8f98b2] hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#16181f] px-3.5 py-2 text-[13px] font-medium text-[#e1e6f0] ring-1 ring-white/[0.06] transition hover:bg-[#1e2230]"
              >
                <Clock size={13} className="text-[#8f98b2]" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results OR Default Mixed Trending Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={30} className="animate-spin text-blue-500" />
          </div>
        ) : hasQuery ? (
          <>
            {people.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3.5 font-display text-[18px] font-bold text-white">People</h2>
                <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                  {people.map((person) => (
                    <Link
                      key={person.id}
                      to={`/person/${person.id}`}
                      className="group w-[112px] shrink-0 text-center"
                    >
                      <div className="mx-auto aspect-square w-24 overflow-hidden rounded-full bg-[#16181f] ring-1 ring-white/10 transition group-hover:scale-105">
                        {person.profile_path ? (
                          <img
                            src={IMG.profile(person.profile_path)}
                            alt={person.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-[#8f98b2]">
                            <User size={24} />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 truncate text-[12.5px] font-semibold text-white">
                        {person.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.length > 0 ? (
              <div>
                <h2 className="mb-4 font-display text-[19px] font-bold text-white">
                  Top Results for &ldquo;{query.trim()}&rdquo;
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                  {results.map((item) => (
                    <PosterCard key={`${item.type}-${item.id}`} item={item} />
                  ))}
                </div>
              </div>
            ) : (
              people.length === 0 && (
                <div className="py-20 text-center">
                  <p className="font-display text-[20px] font-bold text-white">
                    No matches for &ldquo;{query.trim()}&rdquo;
                  </p>
                  <p className="mt-1.5 text-[14px] text-[#8f98b2]">
                    Try checking spelling or switching filter back to All Types.
                  </p>
                </div>
              )
            )}
          </>
        ) : (
          <div>
            <h2 className="mb-4 font-display text-[20px] font-bold text-white">
              Trending Right Now
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {trendingDefault.map((item) => (
                <PosterCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
