import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';
import MediaGrid from '../components/MediaGrid';
import { IMG, api, normalize, titleOf, yearOf } from '../lib/tmdb';
import { useReveal } from '../hooks/useReveal';
import { cx } from '../lib/utils';

const SUGGESTIONS = ['Dune', 'Breaking Bad', 'Arcane', 'Oppenheimer', 'Anime', 'Korean drama'];
const RECENT_KEY = 'priva:recent-searches';

const FILTERS = [
  { id: 'multi', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
  { id: 'person', label: 'People' },
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState(params.get('type') || 'multi');
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 8);
    } catch {
      return [];
    }
  });
  const inputRef = useRef(null);

  useReveal([items.length, people.length, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const q = initialQuery.trim();
    if (!q) {
      setItems([]);
      setPeople([]);
      setSearched(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setSearched(true);
    const timer = window.setTimeout(() => {
      api
        .search(q, 1, filter === 'person' ? 'person' : filter)
        .then((data) => {
          if (!alive) return;
          if (filter === 'person') {
            setPeople((data.results || []).filter((p) => p.media_type !== 'movie'));
            setItems([]);
          } else {
            const list = (data.results || []).filter((r) => r.media_type !== 'person');
            setItems(list.map((r) => normalize(r, r.media_type)));
            setPeople((data.results || []).filter((r) => r.media_type === 'person'));
          }
          try {
            const next = [q, ...recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 8);
            localStorage.setItem(RECENT_KEY, JSON.stringify(next));
            setRecent(next);
          } catch {
            /* ignore storage errors */
          }
        })
        .catch(() => {
          if (!alive) return;
          setItems([]);
          setPeople([]);
        })
        .finally(() => alive && setLoading(false));
    }, 260);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, filter]);

  const submit = (e) => {
    e?.preventDefault();
    const next = new URLSearchParams(params);
    if (query.trim()) next.set('q', query.trim());
    else next.delete('q');
    next.set('type', filter);
    setParams(next);
  };

  const switchFilter = (id) => {
    setFilter(id);
    const next = new URLSearchParams(params);
    next.set('type', id);
    setParams(next);
  };

  const showPeople = filter === 'person' || (filter === 'multi' && people.length > 0);
  const nothing = searched && !loading && !items.length && !(filter === 'multi' && people.length);

  return (
    <div className="container-page pb-14 pt-6">
      <div className="mx-auto max-w-3xl" data-reveal>
        <h1 className="text-center text-[28px] font-extrabold tracking-[-0.03em] sm:text-[36px]">
          Find something great
        </h1>
        <p className="mt-2 text-center text-[13px] text-white/40">
          Search across movies, series and the people behind them.
        </p>

        <form onSubmit={submit} className="mt-6 flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “Interstellar”, “The Bear”, “Zendaya”…"
              className="w-full rounded-full border border-white/12 bg-white/[0.05] py-3.5 pl-11 pr-10 text-[14px] text-white placeholder:text-white/30 focus:border-brand-500/70 focus:bg-white/[0.07] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  const next = new URLSearchParams(params);
                  next.delete('q');
                  setParams(next);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/35 hover:text-white"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-brand px-6 py-3.5">
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => switchFilter(f.id)}
              className={cx('chip', filter === f.id && 'chip-active')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!searched && (
        <div className="mx-auto mt-12 max-w-4xl" data-reveal>
          {recent.length > 0 && (
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
                  Recent searches
                </h2>
                <button
                  onClick={() => {
                    localStorage.removeItem(RECENT_KEY);
                    setRecent([]);
                  }}
                  className="text-[11.5px] text-white/30 hover:text-white/60"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <Link
                    key={r}
                    to={`/search?q=${encodeURIComponent(r)}&type=${filter}`}
                    className="chip"
                  >
                    {r}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
            Popular right now
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Link key={s} to={`/search?q=${encodeURIComponent(s)}&type=multi`} className="chip">
                {s}
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="grid place-items-center py-16 text-white/30">
          <Loader2 size={24} className="animate-spin" />
        </div>
      )}

      {!loading && items.length > 0 && (
        <section className="mt-10" data-reveal>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
            Titles
          </h2>
          <MediaGrid items={items} />
        </section>
      )}

      {!loading && showPeople && people.length > 0 && (
        <section className="mt-12" data-reveal>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
            People
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {people.slice(0, 12).map((person) => (
              <Link
                key={person.id}
                to={`/person/${person.id}`}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-2.5 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-ink-700">
                  {person.profile_path ? (
                    <img
                      src={IMG.profile(person.profile_path, 'w185')}
                      alt={person.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[12px] text-white/40">
                      {person.name?.slice(0, 1)}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold text-white/85">
                    {person.name}
                  </span>
                  <span className="block truncate text-[11px] text-white/35">
                    {(person.known_for || [])
                      .slice(0, 2)
                      .map((k) => titleOf(k))
                      .filter(Boolean)
                      .join(', ') || 'Actor'}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {nothing && (
        <div className="mx-auto mt-16 max-w-md text-center" data-reveal>
          <p className="text-[15px] font-semibold text-white/70">No results for “{initialQuery}”</p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/35">
            Check the spelling, or try a broader search — a title, a franchise or a cast member.
          </p>
        </div>
      )}
    </div>
  );
}
