import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flame, Loader2 } from 'lucide-react';
import MediaGrid from '../components/MediaGrid';
import { api, normalize } from '../lib/tmdb';
import { useReveal } from '../hooks/useReveal';
import { cx } from '../lib/utils';

const TABS = [
  { id: 'all', label: 'Everything', media: 'all' },
  { id: 'movie', label: 'Movies', media: 'movie' },
  { id: 'tv', label: 'TV Shows', media: 'tv' },
];

export default function Trending() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('tab') || 'all';
  const [tab, setTab] = useState(TABS.some((t) => t.id === initial) ? initial : 'all');
  const [window_, setWindow] = useState(params.get('window') === 'day' ? 'day' : 'week');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useReveal([tab, window_, loading]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const media = TABS.find((t) => t.id === tab)?.media || 'all';
    api
      .trending(media, window_)
      .then((data) => {
        if (!alive) return;
        setItems(
          (data.results || [])
            .filter((r) => r.media_type !== 'person')
            .map((r) => normalize(r, r.media_type || (media === 'movie' ? 'movie' : 'tv')))
        );
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tab, window_]);

  const update = (nextTab, nextWindow) => {
    const next = new URLSearchParams(params);
    next.set('tab', nextTab);
    next.set('window', nextWindow);
    setParams(next, { replace: true });
  };

  const heading = useMemo(() => {
    if (tab === 'movie') return 'Trending movies';
    if (tab === 'tv') return 'Trending series';
    return 'Trending now';
  }, [tab]);

  return (
    <div className="container-page pb-12 pt-6">
      <header className="mb-7" data-reveal>
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/30">
          <Flame size={13} /> Live rankings
        </p>
        <h1 className="text-[28px] font-black tracking-tight sm:text-[32px]">{heading}</h1>
        <p className="mt-1 max-w-xl text-sm text-white/40">
          What the world is watching right now, refreshed throughout the day from TMDB.
        </p>
      </header>

      <div
        className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/5 bg-[#18181b] px-3 py-3 sm:px-4"
        data-reveal
      >
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                update(t.id, window_);
              }}
              className={cx(
                'rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition',
                tab === t.id ? 'bg-white text-ink-950' : 'text-white/55 hover:text-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
          {[
            { id: 'day', label: 'Today' },
            { id: 'week', label: 'This week' },
          ].map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setWindow(w.id);
                update(tab, w.id);
              }}
              className={cx(
                'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition',
                window_ === w.id ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white'
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24 text-white/30">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <MediaGrid items={items} />
      )}
    </div>
  );
}
