import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import MediaGrid from '../components/MediaGrid';
import { IMG, api, normalize } from '../lib/tmdb';
import { useReveal } from '../hooks/useReveal';
import { cx } from '../lib/utils';

export default function Provider() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const name = params.get('name') || 'Streaming';
  const [type, setType] = useState(params.get('type') === 'movie' ? 'movie' : 'tv');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [logo, setLogo] = useState(null);
  const sentinel = useRef(null);

  useReveal([type, items.length]);

  useEffect(() => {
    api
      .providers('US')
      .then((data) => {
        const match = (data.results || []).find((p) => String(p.provider_id) === String(id));
        setLogo(match?.logo_path || null);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [id, type]);

  useEffect(() => {
    let alive = true;
    const first = page === 1;
    first ? setLoading(true) : setLoadingMore(true);
    api
      .discover(type, {
        page,
        with_watch_providers: id,
        watch_region: 'US',
        sort_by: 'popularity.desc',
      })
      .then((data) => {
        if (!alive) return;
        const list = (data.results || []).map((r) => normalize(r, type));
        setItems((prev) => {
          const seen = new Set(prev.map((x) => `${x.type}:${x.id}`));
          return first ? list : [...prev, ...list.filter((x) => !seen.has(`${x.type}:${x.id}`))];
        });
        setHasMore(Number(data.page || page) < Number(data.total_pages || page));
      })
      .catch(() => {})
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setLoadingMore(false);
      });
    return () => {
      alive = false;
    };
  }, [id, type, page]);

  useEffect(() => {
    if (!sentinel.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '700px 0px' }
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore]);

  const label = useMemo(() => name, [name]);

  return (
    <div className="container-page pb-12 pt-6">
      <header className="mb-6 flex flex-wrap items-center gap-4" data-reveal>
        <div className="grid h-16 w-24 place-items-center rounded-xl border border-white/10 bg-white/[0.05]">
          {logo ? (
            <img src={IMG.provider(logo)} alt={label} className="max-h-9 max-w-[76px] object-contain" />
          ) : (
            <span className="text-[11px] text-white/50">{label}</span>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">
            Streaming platform
          </p>
          <h1 className="mt-1 text-[30px] font-extrabold tracking-[-0.03em] sm:text-[38px]">
            {label}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
          {[
            { id: 'tv', label: 'Series' },
            { id: 'movie', label: 'Movies' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setType(tab.id)}
              className={cx(
                'rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition',
                type === tab.id ? 'bg-white text-ink-950' : 'text-white/55 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <p className="mb-6 text-[12.5px] text-white/35" data-reveal>
        Popular {type === 'tv' ? 'series' : 'movies'} available on {label} in the US.
      </p>

      <MediaGrid
        items={items}
        loading={loading}
        empty={
          <p className="col-span-full py-16 text-center text-sm text-white/40">
            Nothing found for this platform.
          </p>
        }
      />

      <div ref={sentinel} className="h-10" />
      {loadingMore && (
        <div className="flex justify-center py-4 text-white/35">
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
