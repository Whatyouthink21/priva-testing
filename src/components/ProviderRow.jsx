import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IMG, api } from '../lib/tmdb';
import { SectionHeading } from './Row';
import { useReveal } from '../hooks/useReveal';

const FEATURED = [
  8, 9, 15, 337, 350, 531, 1899, 386, 283, 43, 520, 526, 34, 300, 73, 538, 151, 11, 99, 237, 232,
  38, 41,
];

export default function ProviderRow() {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    let alive = true;
    api
      .providers('US')
      .then((data) => {
        if (!alive) return;
        const map = new Map((data.results || []).map((p) => [p.provider_id, p]));
        const picked = FEATURED.map((id) => map.get(id)).filter(Boolean);
        setProviders(picked.slice(0, 18));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useReveal([providers.length]);

  if (!providers.length) return null;

  return (
    <section className="container-page" data-reveal>
      <SectionHeading
        title="Streaming platforms"
        subtitle="Jump into the catalogue you already subscribe to"
        link="/platforms"
      />
      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {providers.map((provider) => (
          <Link
            key={provider.provider_id}
            to={`/provider/${provider.provider_id}?name=${encodeURIComponent(provider.provider_name)}`}
            title={provider.provider_name}
            className="group relative grid h-[76px] w-[104px] shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.035] transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.08] sm:h-[84px] sm:w-[118px]"
          >
            {provider.logo_path ? (
              <img
                src={IMG.provider(provider.logo_path)}
                alt={provider.provider_name}
                className="max-h-11 max-w-[72px] object-contain transition duration-500 group-hover:scale-110"
              />
            ) : (
              <span className="px-2 text-center text-[11px] text-white/60">
                {provider.provider_name}
              </span>
            )}
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.35),transparent_60%)] opacity-0 transition duration-500 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}
