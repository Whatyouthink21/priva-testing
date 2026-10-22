import { useEffect } from 'react';
import { Megaphone, Sparkles } from 'lucide-react';

// EDIT ANNOUNCEMENTS HERE: update this array or add a new entry at the top.
const ANNOUNCEMENTS = [
  {
    version: 'v2.1',
    title: 'Priva release v2.1',
    summary: 'Server addition. Anime expansion.',
    updates: [
      'Five numbered servers give you more ways to watch. The former Server 3 is now our default Server 1, tagged Fast and High quality.',
      'Meet the ANIME server with Sub and Dub options. Availability depends on the title and language.',
      'Explore streaming providers with real logos in Categories, and stay up to date right here.',
    ],
  },
];

export default function Announcements() {
  useEffect(() => { document.title = 'Announcements · Priva'; }, []);
  return (
    <div className="min-h-screen px-4 pb-24 pt-20 sm:px-8 lg:pl-[108px] lg:pr-12 lg:pt-12">
      <div className="max-w-3xl">
        <Megaphone className="mb-4 text-blue-400" size={30} />
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">Announcements</h1>
        <p className="mt-2 text-[#8f98b2]">The latest updates from Priva.</p>
        {ANNOUNCEMENTS.map((item) => (
          <article key={item.version} className="relative mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-blue-950/40 to-[#16181f] p-6 sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300"><Sparkles size={14} />{item.version} · Release notes</span>
            <h2 className="mt-5 font-display text-2xl font-bold text-white">{item.title}</h2>
            <p className="mt-2 text-lg text-[#e1e6f0]">{item.summary}</p>
            <ul className="mt-6 list-disc space-y-4 pl-5 text-sm leading-relaxed text-[#8f98b2]">{item.updates.map((update) => <li key={update}>{update}</li>)}</ul>
          </article>
        ))}
      </div>
    </div>
  );
}
