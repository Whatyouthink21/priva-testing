import { Download, ExternalLink, HardDriveDownload, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { DOWNLOAD_SOURCES, downloadUrl } from '../lib/sources';

export default function DownloadModal({ open, onClose, type, id, title, season = 1, episode = 1 }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="download-title">
      <div className="mb-5">
        <h2 id="download-title" className="text-[20px] font-bold tracking-tight">
          Download
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-white/40">
          {title}
          {type === 'tv' ? ` · S${season} E${episode}` : ''}
        </p>
      </div>

      <div className="space-y-2.5">
        {DOWNLOAD_SOURCES.map((source) => (
          <a
            key={source.id}
            href={downloadUrl(source.id, type, id, { season, episode })}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3.5 transition duration-300 hover:border-brand/50 hover:bg-white/[0.07]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/15 text-brand-400 transition group-hover:bg-brand/25">
              <HardDriveDownload size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold text-white">
                Source {source.id}
              </span>
              <span className="block text-[11.5px] text-white/40">
                Choose quality (480p / 720p / 1080p) on the next page
              </span>
            </span>
            <ExternalLink size={15} className="text-white/30 transition group-hover:text-white" />
          </a>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-[11.5px] leading-relaxed text-white/35">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-400/70" />
        Downloads open in a new tab and are served by third-party providers. Use an ad
        blocker, and only download content you have the right to access.
      </div>

      <button onClick={onClose} className="btn-ghost mt-4 w-full py-2.5">
        <Download size={15} /> Back to {type === 'tv' ? 'episodes' : 'movie'}
      </button>
    </Modal>
  );
}
