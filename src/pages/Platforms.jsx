import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IMG, api } from '../lib/tmdb';
import { useReveal } from '../hooks/useReveal';
import { cx } from '../lib/utils';

const ORDER = [8, 9, 15, 337, 350, 531, 1899, 386, 283, 43, 520, 526, 34, 300, 73, 538, 151, 11, 99, 237, 232, 38, 41, 2336];

export default function Platforms() {
  const [providers, setProviders] = useState([]);
  const [region, setRegion] = useState('US');
  useReveal([providers.length, region]);

  useEffect(() => {
    let alive = true;
    api
      .providers(region)
      .then((data) => alive && setProviders(data.results || []))
      .catch(() => alive && setProviders([]));
    return () => {
      alive = false;
    };
  }, [region]);

  const sorted = useMemo(() => {
    const rank = new Map(ORDER.map((id, i) => [id, i]));
    return [...providers].sort(
      (a, b) => (rank.get(a.provider_id) ?? 999) - (rank.get(b.provider_id) ?? 999)
    );
  }, [providers]);

  return (
    <div className="container-page pb-16 pt-6">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4" data-reveal>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">
            Platforms
          </p>
          <h1 className="mt-1.5 text-[32px] font-extrabold tracking-[-0.03em] sm:text-[42px]">
            Streaming platforms
          </h1>
          <p className="mt-2 max-w-xl text-[13.5px] text-white/45">
            Browse what is popular on the services you already use.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
          {['US', 'IN', 'GB'].map((code) => (
            <button
              key={code}
              onClick={() => setRegion(code)}
              className={cx(
                'rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition',
                region === code ? 'bg-white text-ink-950' : 'text-white/50 hover:text-white'
              )}
            >
              {code}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-reveal>
        {sorted.map((provider) => (
          <Link
            key={provider.provider_id}
            to={`/provider/${provider.provider_id}?name=${encodeURIComponent(provider.provider_name)}`}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 text-center transition duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.07]"
          >
            <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-white/[0.04]">
              {provider.logo_path ? (
                <img
                  src={IMG.provider(provider.logo_path)}
                  alt={provider.provider_name}
                  className="max-h-11 max-w-12 object-contain transition duration-500 group-hover:scale-110"
                />
              ) : (
                <span className="text-[10px] text-white/40">TV</span>
              )}
            </span>
            <span className="line-clamp-2 text-[12.5px] font-medium text-white/70 group-hover:text-white">
              {provider.provider_name}
            </span>
          </Link>
        ))}
      </div>

      {!sorted.length && (
        <p className="py-16 text-center text-sm text-white/35">No providers found for this region.</p>
      )}
    </div>
  );
}
