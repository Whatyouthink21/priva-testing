import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Cake, MapPin } from 'lucide-react';
import { IMG, api } from '../lib/tmdb';
import MediaGrid from '../components/MediaGrid';
import { SectionHeading } from '../components/Row';
import { useReveal } from '../hooks/useReveal';

export default function Person() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  useReveal([person?.id, expanded]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
    api
      .person(id)
      .then((data) => alive && setPerson(data))
      .catch(() => alive && setPerson(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const credits = useMemo(() => {
    if (!person) return [];
    const seen = new Set();
    return (person.combined_credits?.cast || [])
      .filter((c) => c.media_type === 'movie' || c.media_type === 'tv')
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .filter((c) => {
        const key = `${c.media_type}:${c.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 30)
      .map((c) => ({ ...c, type: c.media_type }));
  }, [person]);

  if (loading) {
    return (
      <div className="container-page pt-[110px]">
        <div className="flex gap-6">
          <div className="skeleton aspect-[2/3] w-[180px] rounded-xl" />
          <div className="flex-1 space-y-3 pt-6">
            <div className="skeleton h-9 w-64 rounded" />
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-28 w-full max-w-2xl rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center pt-24 text-center text-white/50">
        Person not found.
      </div>
    );
  }

  const bio = person.biography || '';
  const shortBio = bio.length > 700 ? `${bio.slice(0, 700)}…` : bio;

  return (
    <div className="container-page pb-16 pt-[104px]">
      <div className="flex flex-col gap-7 sm:flex-row">
        <div className="w-[170px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-card sm:w-[230px]">
          {person.profile_path ? (
            <img
              src={IMG.profile(person.profile_path, 'w342')}
              alt={person.name}
              className="aspect-[2/3] w-full object-cover"
            />
          ) : (
            <div className="grid aspect-[2/3] place-items-center text-white/25">
              {person.name?.slice(0, 1)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1" data-reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">
            {person.known_for_department || 'Cast'}
          </p>
          <h1 className="mt-1.5 text-[32px] font-extrabold tracking-[-0.03em] sm:text-[42px]">
            {person.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-white/40">
            {person.birthday && (
              <span className="inline-flex items-center gap-1.5">
                <Cake size={13} /> {person.birthday}
                {person.deathday ? ` — ${person.deathday}` : ''}
              </span>
            )}
            {person.place_of_birth && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} /> {person.place_of_birth}
              </span>
            )}
          </div>

          {bio && (
            <div className="mt-5">
              <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-white/45">
                Biography
              </h2>
              <p className="max-w-3xl whitespace-pre-line text-[13px] leading-relaxed text-white/55">
                {expanded ? bio : shortBio}
              </p>
              {bio.length > 700 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2 text-[12px] font-semibold text-brand-400 hover:text-brand-300"
                >
                  {expanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {credits.length > 0 && (
        <section className="mt-14" data-reveal>
          <SectionHeading title="Known for" subtitle="Most popular credits" />
          <MediaGrid items={credits} />
        </section>
      )}
    </div>
  );
}
