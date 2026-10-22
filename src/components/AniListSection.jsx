import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { getAnimeDiscovery } from '../lib/anilist';
import { loadAnimeMappings } from '../lib/anime';

export default function AniListSection() {
  const [data, setData] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError('');
    Promise.all([getAnimeDiscovery(), loadAnimeMappings()]).then(([result, rows]) => {
      if (!cancelled) { setData(result); setMappings(rows); }
    }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [attempt]);

  const destination = (item) => {
    const matches = mappings.filter(r => r[4] === item.idMal && (item.format === 'MOVIE' ? r[0] === 'movie' : r[0] === 'tv') && r[2] > 0);
    // A unique mapping links to the exact season/cour, not season 1 of the show.
    const unique = [...new Map(matches.map(r => [JSON.stringify(r), r])).values()];
    if (unique.length !== 1) return null;
    const [type, id, season, offset] = unique[0];
    return type === 'movie' ? `/watch/movie/${id}` : `/watch/anime/${id}/${season}/${offset + 1}`;
  };

  return (
    <section className="py-6" aria-label="AniList anime discovery">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
        <div><h2 className="font-display text-xl font-bold text-white">Discover with AniList</h2><p className="mt-1 text-xs text-[#8f98b2]">Seasonal picks and trending anime · Metadata by AniList</p></div>
        <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400">AniList <ExternalLink size={13} /></a>
      </div>
      {error ? <div role="status" className="px-4 text-sm text-[#8f98b2] sm:px-8 lg:pl-[108px]">{error} Your usual anime catalog is still available.<button onClick={() => setAttempt(a => a + 1)} className="ml-3 inline-flex items-center gap-1 text-blue-400"><RefreshCw size={14} />Retry</button></div> : !data ? <p role="status" className="px-4 text-sm text-[#8f98b2] sm:px-8 lg:pl-[108px]">Loading AniList picks…</p> : [
        ['Trending on AniList', data.trending.media], ['This season on AniList', data.seasonal.media],
      ].map(([label, items]) => (
        <div key={label} className="mb-6">
          <h3 className="mb-3 px-4 text-base font-semibold text-white sm:px-8 lg:pl-[108px]">{label}</h3>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-3 sm:px-8 lg:pl-[108px] lg:pr-12">
            {items.map(item => {
              const to = destination(item);
              const title = item.title.english || item.title.romaji;
              const body = <><img src={item.coverImage.large} alt={title} loading="lazy" className="aspect-[2/3] w-full rounded-xl object-cover transition group-hover:brightness-110" /><h4 className="mt-2 line-clamp-2 text-sm font-semibold text-white">{title}</h4><p className="mt-1 text-xs text-[#8f98b2]">{item.averageScore ? `${item.averageScore}% · ` : ''}{item.episodes ? `${item.episodes} episodes` : 'Ongoing / TBA'}</p><span className="mt-1 block text-xs text-blue-400">{to ? 'Watch · source availability varies' : 'Details on AniList ↗'}</span></>;
              const className = 'group block w-[140px] shrink-0 sm:w-[165px]';
              return to ? <Link className={className} key={item.id} to={to}>{body}</Link> : <a className={className} key={item.id} href={item.siteUrl} target="_blank" rel="noopener noreferrer">{body}</a>;
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
