import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Cloud, Download, Layers, Shield } from 'lucide-react';

const LEGAL_COPY = {
  terms: {
    title: 'Terms of Use',
    body: [
      'Priva is a personalized discovery, watchlist, and playback interface powered by public metadata.',
      'Priva does not host, upload, transcode, or store any video or media files on its own servers. All embedded streams and external download pages are provided independently by third-party services.',
      'By creating an account in My Space, you agree to keep your login credentials secure and use the service in compliance with applicable laws in your jurisdiction.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'When you sign in to Priva, we store your email address, display profile name, My List entries, and Continue Watching progress securely inside Firebase Authentication & Cloud Firestore so your library stays synced across devices.',
      'If you browse without signing in, your watchlist and playback resume timestamps remain locally inside your browser storage.',
      'You can clear your watch history or remove saved items from My Space at any time.',
    ],
  },
  dmca: {
    title: 'DMCA & Content Notice',
    body: [
      'Priva operates purely as an automated metadata index using public catalog APIs and embeds publicly accessible third-party players.',
      'No video, audio, or subtitle files are hosted on Priva servers. Any copyright takedown request regarding hosted media files should be directed to the respective third-party hosting provider.',
    ],
  },
};

export default function Help() {
  const { section } = useParams();
  const legal = section ? LEGAL_COPY[section] : null;

  useEffect(() => {
    document.title = legal ? `${legal.title} · Priva` : 'Help & Support · Priva';
  }, [legal]);

  if (legal) {
    return (
      <div className="min-h-screen bg-[#0f1014] px-4 pt-16 sm:px-8 lg:pl-[108px] lg:pr-12 lg:pt-12">
        <div className="max-w-3xl">
          <Link to="/help" className="text-[13px] font-semibold text-blue-400 hover:underline">
            ← Back to Help Center
          </Link>
          <h1 className="mt-3 font-display text-[32px] font-extrabold text-white">
            {legal.title}
          </h1>
          <div className="mt-6 space-y-4 rounded-2xl border border-white/[0.08] bg-[#16181f] p-6 text-[14.5px] leading-relaxed text-[#c4ccdf]">
            {legal.body.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1014] px-4 pt-16 sm:px-8 lg:pl-[108px] lg:pr-12 lg:pt-12">
      <div className="max-w-4xl">
        <h1 className="font-display text-[32px] font-extrabold tracking-[-0.02em] text-white sm:text-[38px]">
          Help &amp; Support
        </h1>
        <p className="mt-1.5 text-[15px] text-[#8f98b2]">
          Everything you need to get the best streaming experience on Priva.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-[#16181f] p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Layers size={20} />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold text-white">
                Multi-Server Playback
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 size={12} /> Active
              </span>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#8f98b2]">
              Switch between Servers 1–4 and ANIME 1 (ZokoAnime) or ANIME 2 (MegaPlay) from the player top bar. Anime players offer Sub/Dub, with Hard-sub also available on ANIME 1; track availability varies by title.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#16181f] p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Cloud size={20} />
            </div>
            <h2 className="font-display text-[17px] font-bold text-white">
              My Space Cloud Sync
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#8f98b2]">
              Sign in inside My Space to sync Continue Watching timestamps, My List bookmarks, and
              Because You Watched recommendations across every browser and device.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#16181f] p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Download size={20} />
            </div>
            <h2 className="font-display text-[17px] font-bold text-white">
              Direct Downloads
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#8f98b2]">
              Download any movie or individual episode in 480p, 720p, or 1080p MP4/MKV using Source
              1 or Source 2 from the title page or inside the player.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#16181f] p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Shield size={20} />
            </div>
            <h2 className="font-display text-[17px] font-bold text-white">
              Legal &amp; Notices
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#8f98b2]">
              Priva indexes public metadata and does not host media files. Review our policies
              below.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-[12.5px] font-semibold text-blue-400">
              <Link to="/legal/terms" className="hover:underline">
                Terms
              </Link>
              <Link to="/legal/privacy" className="hover:underline">
                Privacy
              </Link>
              <Link to="/legal/dmca" className="hover:underline">
                DMCA
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
