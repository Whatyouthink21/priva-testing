import { useMemo, useState } from 'react';
import { ExternalLink, Quote, Star } from 'lucide-react';
import { IMG } from '../lib/tmdb';
import { cx } from '../lib/utils';

function scoreTone(score) {
  if (!score) return 'text-white/50 border-white/15';
  if (score >= 8) return 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10';
  if (score >= 6.5) return 'text-amber-300 border-amber-400/30 bg-amber-400/10';
  return 'text-rose-300 border-rose-400/30 bg-rose-400/10';
}

export default function CriticsSection({ reviews = [], voteAverage, voteCount, title }) {
  const [expanded, setExpanded] = useState(null);

  // Show the most substantive reviews first — those with a rating and real text.
  const sorted = useMemo(() => {
    return [...reviews]
      .filter((r) => r.content && r.content.length > 40)
      .sort((a, b) => (b.author_details?.rating || 0) - (a.author_details?.rating || 0))
      .slice(0, 6);
  }, [reviews]);

  const average = Number(voteAverage) || 0;
  const fresh = average >= 6.5;

  return (
    <section id="critics" className="container-page scroll-mt-24" data-reveal>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-[19px] font-bold tracking-tight sm:text-[22px]">
            <span className="h-[18px] w-[3px] rounded-full bg-brand-500 sm:h-5" />
            Critics &amp; media
          </h2>
          <p className="mt-1.5 pl-[11px] text-[13px] text-white/45">
            Critic and press takes on {title}, alongside audience scores
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Scorecard */}
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Critic consensus
          </p>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-[46px] font-black leading-none tracking-tight">
              {average ? average.toFixed(1) : '—'}
            </span>
            <span className="pb-1 text-[12px] text-white/40">/ 10</span>
            <span
              className={cx(
                'mb-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider',
                fresh
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                  : 'border-rose-400/30 bg-rose-400/10 text-rose-300'
              )}
            >
              {fresh ? 'Fresh' : 'Mixed'}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className={cx(
                  'h-1.5 flex-1 rounded-full',
                  i < Math.round(average) ? 'bg-brand-400' : 'bg-white/10'
                )}
              />
            ))}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-white/40">
            <Star size={12} className="fill-gold text-gold" />
            {Number(voteCount || 0).toLocaleString()} ratings on TMDB
          </p>

          <p className="mt-4 border-t border-white/[0.07] pt-3 text-[12px] leading-relaxed text-white/35">
            {sorted.length
              ? `Based on ${sorted.length} published review${sorted.length === 1 ? '' : 's'} from critics, press and audience contributors.`
              : 'No published critic reviews yet for this title. The score above reflects audience ratings.'}
          </p>
        </div>

        {/* Review cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.length === 0 && (
            <div className="sm:col-span-2 grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <Quote size={22} className="mb-3 text-white/20" />
              <p className="text-[13px] font-medium text-white/60">No critic reviews yet</p>
              <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-white/35">
                Reviews are published as critics file them. In the meantime, the audience
                score reflects how viewers are rating this title.
              </p>
            </div>
          )}

          {sorted.map((review) => {
            const isOpen = expanded === review.id;
            const author = review.author || 'Anonymous';
            const score = review.author_details?.rating;
            const rawAvatar = review.author_details?.avatar_path;
            const avatar = rawAvatar?.startsWith('http')
              ? rawAvatar
              : IMG.profile(rawAvatar, 'w185');
            return (
              <article
                key={review.id}
                className="group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand-400/70 to-brand-600/70 text-[12px] font-bold">
                      {avatar ? (
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        author.slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">{author}</p>
                      <p className="text-[11px] text-white/35">
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Critic review'}
                      </p>
                    </div>
                  </div>
                  {score ? (
                    <span
                      className={cx(
                        'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold',
                        scoreTone(score)
                      )}
                    >
                      {Number(score).toFixed(1)}
                    </span>
                  ) : (
                    <Quote size={15} className="shrink-0 text-white/15" />
                  )}
                </div>

                <p
                  className={cx(
                    'whitespace-pre-line text-[12.5px] leading-relaxed text-white/55',
                    !isOpen && 'line-clamp-5'
                  )}
                >
                  {review.content}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2 pt-1">
                  {review.content.length > 260 && (
                    <button
                      onClick={() => setExpanded(isOpen ? null : review.id)}
                      className="text-[11.5px] font-semibold text-brand-400 transition hover:text-brand-300"
                    >
                      {isOpen ? 'Show less' : 'Read full review'}
                    </button>
                  )}
                  {review.url && (
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="ml-auto inline-flex items-center gap-1 text-[11px] text-white/30 transition hover:text-white/70"
                    >
                      Source <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
