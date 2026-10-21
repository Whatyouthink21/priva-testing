import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User } from 'lucide-react';
import PosterCard from '../components/PosterCard';
import { api, IMG, normalizeItem } from '../lib/tmdb';

export default function Person() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [tab, setTab] = useState('movie');
  const [expandedBio, setExpandedBio] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .person(id)
      .then((res) => {
        if (cancelled) return;
        setPerson(res);
        document.title = `${res.name || 'Person'} · Priva`;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { movies, series } = useMemo(() => {
    const cast = person?.combined_credits?.cast || [];
    const seenM = new Set();
    const seenT = new Set();
    const m = [];
    const t = [];

    const sorted = [...cast].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    for (const c of sorted) {
      if (!c?.id || !c.poster_path) continue;
      if (c.media_type === 'movie' && !seenM.has(c.id)) {
        seenM.add(c.id);
        m.push(normalizeItem(c, 'movie'));
      } else if (c.media_type === 'tv' && !seenT.has(c.id)) {
        seenT.add(c.id);
        t.push(normalizeItem(c, 'tv'));
      }
    }
    return { movies: m, series: t };
  }, [person]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1014] px-4 pt-16 sm:px-8 lg:pl-[108px] lg:pr-12 lg:pt-12">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="skeleton h-56 w-44 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-9 w-64 rounded-lg" />
            <div className="skeleton h-4 w-80 rounded" />
            <div className="skeleton h-28 w-full max-w-2xl rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!person) return null;

  const activeItems = tab === 'movie' ? movies : series;
  const meta = [
    person.known_for_department,
    person.birthday ? `Born ${person.birthday}` : null,
    person.place_of_birth,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0f1014] px-4 pt-16 sm:px-8 lg:pl-[108px] lg:pr-12 lg:pt-12">
      <div className="flex flex-col gap-7 md:flex-row md:items-start">
        <div className="h-[240px] w-[180px] shrink-0 overflow-hidden rounded-2xl bg-[#16181f] ring-1 ring-white/10">
          {person.profile_path ? (
            <img
              src={IMG.profileLg(person.profile_path)}
              alt={person.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[#8f98b2]">
              <User size={44} />
            </div>
          )}
        </div>

        <div className="max-w-3xl">
          <h1 className="font-display text-[32px] font-extrabold tracking-[-0.02em] text-white sm:text-[40px]">
            {person.name}
          </h1>

          {meta.length > 0 && (
            <p className="mt-1.5 text-[13.5px] font-medium text-[#8f98b2]">
              {meta.join(' · ')}
            </p>
          )}

          {person.biography && (
            <div className="mt-4">
              <p
                className={`text-[14px] leading-relaxed text-[#c4ccdf] ${
                  expandedBio ? '' : 'line-clamp-4'
                }`}
              >
                {person.biography}
              </p>
              {person.biography.length > 340 && (
                <button
                  type="button"
                  onClick={() => setExpandedBio((v) => !v)}
                  className="mt-2 text-[12.5px] font-semibold text-blue-400 hover:underline"
                >
                  {expandedBio ? 'Show less' : 'Read full biography'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Movies / Series Tabs matching bingr.one/person/:id */}
      <div className="mt-10 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('movie')}
            className={`rounded-lg px-4 py-2 text-[13.5px] font-bold transition ${
              tab === 'movie' ? 'bg-white text-[#0f1014]' : 'text-[#8f98b2] hover:text-white'
            }`}
          >
            Movies ({movies.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('tv')}
            className={`rounded-lg px-4 py-2 text-[13.5px] font-bold transition ${
              tab === 'tv' ? 'bg-white text-[#0f1014]' : 'text-[#8f98b2] hover:text-white'
            }`}
          >
            Series ({series.length})
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {activeItems.map((item) => (
          <PosterCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}
