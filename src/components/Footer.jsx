import { Link } from 'react-router-dom';
import { Github, Instagram, Twitter } from 'lucide-react';
import Logo from './Logo';

const COLUMNS = [
  {
    title: 'Browse',
    links: [
      { to: '/', label: 'Home' },
      { to: '/trending', label: 'Trending' },
      { to: '/movies', label: 'Movies' },
      { to: '/tv', label: 'TV Shows' },
      { to: '/anime', label: 'Anime' },
    ],
  },
  {
    title: 'Your account',
    links: [
      { to: '/my-list', label: 'My List' },
      { to: '/history', label: 'Watch History' },
      { to: '/settings', label: 'Settings' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About Priva' },
      { to: '/faq', label: 'FAQ' },
      { to: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Use' },
      { to: '/dmca', label: 'DMCA' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.07] bg-ink-950">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[13px] leading-relaxed text-white/40">
              A cinematic home for movies, series and anime. Built for people who love
              discovering something new every night.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/10 text-white/40 transition hover:border-brand/50 hover:text-white"
                >
                  <Icon size={15} />
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[13px] text-white/55 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.06] pt-7 text-[11.5px] leading-relaxed text-white/30 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p>
              Priva does not host or upload any video files. All media is provided by
              non-affiliated third-party services, and Priva simply links to publicly
              available embeds. For removal requests, contact us and we will act promptly.
            </p>
            <p>
              This product uses the TMDB API but is not endorsed or certified by TMDB.
              Movie and TV metadata, artwork and ratings are supplied by TMDB.
            </p>
          </div>
          <p className="shrink-0 sm:text-right">
            © {new Date().getFullYear()} Priva. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
