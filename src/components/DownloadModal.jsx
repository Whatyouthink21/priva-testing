import { useEffect, useState } from 'react';
import { Download, ExternalLink, HardDriveDownload } from 'lucide-react';
import Modal from './Modal';
import { buildDownloadUrl, DOWNLOAD_SOURCES } from '../lib/sources';

export default function DownloadModal({
  open,
  onClose,
  type = 'movie',
  id,
  title = '',
  season = 1,
  episode = 1,
  seasons = [],
  episodeCount = 24,
}) {
  const [selSeason, setSelSeason] = useState(Number(season) || 1);
  const [selEpisode, setSelEpisode] = useState(Number(episode) || 1);

  useEffect(() => {
    setSelSeason(Number(season) || 1);
    setSelEpisode(Number(episode) || 1);
  }, [season, episode, open]);

  const validSeasons = (seasons || []).filter((s) => s.season_number > 0);
  const activeSeasonMeta = validSeasons.find((s) => s.season_number === selSeason);
  const totalEps = activeSeasonMeta?.episode_count || episodeCount || 24;

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-[480px]">
      <div className="mb-5 pr-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-400">
          <Download size={13} />
          Direct Downloads
        </div>
        <h2 className="mt-2.5 font-display text-[21px] font-extrabold tracking-[-0.02em] text-white">
          {title || 'Download'}
        </h2>
        <p className="mt-0.5 text-[13px] text-[#8f98b2]">
          {type === 'tv'
            ? `Season ${selSeason} · Episode ${selEpisode} — choose a download source below`
            : 'Choose a download source & resolution below'}
        </p>
      </div>

      {/* Season / Episode Picker for TV & Anime */}
      {type === 'tv' && (
        <div className="mb-4 grid grid-cols-2 gap-2.5 rounded-xl border border-white/[0.07] bg-[#0f1014] p-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8f98b2]">
              Season
            </label>
            <select
              value={selSeason}
              onChange={(e) => {
                setSelSeason(Number(e.target.value));
                setSelEpisode(1);
              }}
              className="h-9 w-full rounded-lg border border-white/[0.1] bg-[#16181f] px-2.5 text-[13px] font-medium text-white focus:border-blue-500 focus:outline-none"
            >
              {(validSeasons.length
                ? validSeasons
                : [{ season_number: selSeason, name: `Season ${selSeason}` }]
              ).map((s) => (
                <option key={s.season_number} value={s.season_number}>
                  Season {s.season_number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8f98b2]">
              Episode
            </label>
            <select
              value={selEpisode}
              onChange={(e) => setSelEpisode(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-white/[0.1] bg-[#16181f] px-2.5 text-[13px] font-medium text-white focus:border-blue-500 focus:outline-none"
            >
              {Array.from({ length: Math.min(100, Math.max(1, totalEps)) }).map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Episode {idx + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Download Sources */}
      <div className="space-y-3">
        {DOWNLOAD_SOURCES.map((src) => {
          const mainHref = buildDownloadUrl(src.id, type, id, {
            season: selSeason,
            episode: selEpisode,
          });
          const directs = src.directQualities
            ? src.directQualities(type, id, selSeason, selEpisode)
            : [];

          return (
            <div
              key={src.id}
              className="rounded-xl border border-white/[0.09] bg-[#0f1014] p-4 transition hover:border-white/20"
            >
              <a
                href={mainHref}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-center gap-3.5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600/15 text-blue-400 transition group-hover:bg-blue-600 group-hover:text-white">
                  <HardDriveDownload size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-white">{src.label}</span>
                  <span className="block text-[12px] text-[#8f98b2]">{src.subtitle}</span>
                </span>
                <ExternalLink
                  size={16}
                  className="shrink-0 text-[#8f98b2] transition group-hover:translate-x-0.5 group-hover:text-white"
                />
              </a>

              {directs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3">
                  {directs.map((q) => (
                    <a
                      key={q.label}
                      href={q.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#e1e6f0] transition hover:bg-blue-600 hover:text-white"
                    >
                      <Download size={11} />
                      {q.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
