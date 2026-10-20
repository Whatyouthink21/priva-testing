import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IMG, api, normalize } from '../lib/tmdb';
import { cx } from '../lib/utils';
import RankedRow from './RankedRow';

const TABS = [
  { id: 9, name: 'Prime Video' },
  { id: 8, name: 'Netflix' },
  { id: 1899, name: 'Max' },
  { id: 2336, name: 'JioHotstar' },
  { id: 337, name: 'Disney+' },
  { id: 350, name: 'Apple TV+' },
  { id: 531, name: 'Paramount+' },
];

const logoCache = new Map();

export default function ProviderSpotlight() {
  const [provider, setProvider] = useState(TABS[0]);
  const [type, setType] = useState('tv');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState(null);

  // Provider logos come from the same watch-provider catalogue as the row.
  useEffect(() => {
    if (logoCache.has(provider.id)) {
      setLogo(logoCache.get(provider.id));
      return;
    }
    api
      .providers('US')
      .then((data) => {
        const found = (data.results || []).find((p) => p.provider_id === provider.id);
        const path = found?.logo_path || null;
        logoCache.set(provider.id, path);
        setLogo(path);
      })
      .catch(() => setLogo(null));
  }, [provider.id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .discover(type, {
        with_watch_providers: provider.id,
        watch_region: 'US',
        sort_by: 'popularity.desc',
        page: 1,
      })
      .then((data) => {
        if (!alive) return;
        setItems((data.results || []).slice(0, 10).map((r) => normalize(r, type)));
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [provider.id, type]);

  return (
    <section className="container-page" data-reveal>
      <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-transparent p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[17px] font-bold uppercase tracking-[0.12em] text-white/60 sm:text-[19px]">
              Popular on
            </h2>
            <div className="flex h-9 items-center">
              {logo ? (
                <img
                  src={IMG.provider(logo, 'w154')}
                  alt={provider.name}
                  className="max-h-8 max-w-[110px] object-contain"
                />
              ) : (
                <span className="text-lg font-bold">{provider.name}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
            {[
              { id: 'tv', label: 'Series' },
              { id: 'movie', label: 'Movies' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setType(tab.id)}
                className={cx(
                  'rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition duration-300',
                  type === tab.id ? 'bg-white text-ink-950' : 'text-white/55 hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setProvider(tab)}
              className={cx(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition duration-300',
                provider.id === tab.id
                  ? 'border-white/70 bg-white/10 text-white'
                  : 'border-white/10 text-white/45 hover:border-white/30 hover:text-white/80'
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="-mx-4 sm:-mx-6">
          <RankedRow
            title={type === 'tv' ? 'Binge-worthy series' : 'Movie night picks'}
            subtitle={`What everyone is watching on ${provider.name}`}
            link={`/provider/${provider.id}?name=${encodeURIComponent(provider.name)}`}
            items={items}
            loading={loading}
          />
        </div>

        <div className="mt-1 flex justify-end">
          <Link
            to={`/provider/${provider.id}?name=${encodeURIComponent(provider.name)}`}
            className="text-[12px] font-medium text-white/35 transition hover:text-white"
          >
            See everything on {provider.name} →
          </Link>
        </div>
      </div>
    </section>
  );
}
