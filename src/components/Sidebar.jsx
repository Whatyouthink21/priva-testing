import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Clapperboard,
  Compass,
  Home,
  LayoutGrid,
  Search,
  Sparkles,
  Tv,
  UserCircle2,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    to: '/explore',
    label: 'Search',
    icon: Search,
    match: ['/explore', '/search'],
  },
  {
    to: '/home',
    label: 'Home',
    icon: Home,
    match: ['/', '/home'],
  },
  {
    to: '/tv',
    label: 'TV',
    icon: Tv,
    match: ['/tv'],
  },
  {
    to: '/anime',
    label: 'Anime',
    icon: Sparkles,
    match: ['/anime'],
  },
  {
    to: '/movies',
    label: 'Movies',
    icon: Clapperboard,
    match: ['/movies'],
  },
  {
    to: '/categories',
    label: 'Categories',
    icon: LayoutGrid,
    match: ['/categories', '/category', '/discover'],
  },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { isSignedIn, displayName, avatarGradient } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const isActivePath = (matches) =>
    matches.some((prefix) =>
      prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  const mySpaceActive = pathname === '/space' || pathname.startsWith('/space/');
  const initial = (displayName || 'U').trim().charAt(0).toUpperCase();

  return (
    <>
      {/* Desktop Hotstar / Bingr Collapsible Left Rail */}
      <div className="hidden lg:block">
        {/* Passive edge gradient so icons pop against bright hero scenes */}
        <div className="rail-passive-scrim pointer-events-none fixed inset-y-0 left-0 z-40 w-[124px]" />

        {/* Full-height smooth gradient expansion scrim when hovered */}
        <div
          className={`rail-scrim pointer-events-none fixed inset-y-0 left-0 z-40 w-[340px] transition-opacity duration-300 ease-out ${
            expanded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <aside
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          aria-label="Primary Navigation"
          className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between py-7 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            expanded ? 'w-[228px]' : 'w-[96px]'
          }`}
        >
          {/* Brand Logo */}
          <div className="flex items-center pl-[29px]">
            <Link to="/home" aria-label="Priva Home" className="group flex items-center gap-3">
              <span className="relative grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-gradient-to-br from-[#38bdf8] via-[#2563eb] to-[#4f46e5] shadow-[0_6px_22px_rgba(37,99,235,0.5)] transition-transform duration-300 group-hover:scale-105">
                <svg viewBox="0 0 32 32" fill="none" className="h-[58%] w-[58%]">
                  <path
                    d="M10.5 7.8C10.5 6.62 11.79 5.9 12.8 6.51L24.6 13.71C25.57 14.3 25.57 15.7 24.6 16.29L12.8 23.49C11.79 24.1 10.5 23.38 10.5 22.2V7.8Z"
                    fill="white"
                  />
                  <path
                    d="M10.5 18.2L18.4 23.02L12.8 26.44C11.79 27.05 10.5 26.33 10.5 25.15V18.2Z"
                    fill="white"
                    fillOpacity="0.52"
                  />
                </svg>
              </span>
              <span
                className={`font-display text-[21px] font-extrabold tracking-[-0.03em] text-white transition-all duration-300 ${
                  expanded ? 'translate-x-0 opacity-100' : '-translate-x-3 pointer-events-none opacity-0'
                }`}
              >
                Priva
              </span>
            </Link>
          </div>

          {/* Center Navigation Icons + Sliding Labels */}
          <nav className="my-auto flex flex-col gap-1.5 px-4">
            {/* My Space at top of stack or bottom? On Bingr nav order: My Space is right in the main stack */}
            <NavLink
              to="/space"
              className={() =>
                `group relative flex h-[48px] items-center gap-4 rounded-xl px-[18px] transition-all duration-200 ${
                  mySpaceActive
                    ? 'text-white'
                    : 'text-[#8f98b2] hover:translate-x-1 hover:text-white'
                }`
              }
            >
              {isSignedIn ? (
                <span
                  className={`grid h-[24px] w-[24px] shrink-0 place-items-center rounded-full bg-gradient-to-br ${avatarGradient} text-[11px] font-extrabold text-white ring-2 ${
                    mySpaceActive ? 'ring-white scale-110' : 'ring-white/25 group-hover:ring-white/70'
                  } transition-transform duration-200`}
                >
                  {initial}
                </span>
              ) : (
                <UserCircle2
                  size={22}
                  strokeWidth={mySpaceActive ? 2.4 : 1.9}
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    mySpaceActive ? 'drop-shadow-[0_0_12px_rgba(255,255,255,0.55)]' : ''
                  }`}
                />
              )}
              <span
                className={`whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] transition-all duration-200 ${
                  expanded ? 'translate-x-0 opacity-100' : '-translate-x-3 pointer-events-none opacity-0'
                } ${mySpaceActive ? 'font-bold text-white' : ''}`}
              >
                My Space
              </span>
              {mySpaceActive && (
                <span className="absolute left-1 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_#fff]" />
              )}
            </NavLink>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(item.match);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={() =>
                    `group relative flex h-[48px] items-center gap-4 rounded-xl px-[19px] transition-all duration-200 ${
                      active
                        ? 'text-white'
                        : 'text-[#8f98b2] hover:translate-x-1 hover:text-white'
                    }`
                  }
                >
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.4 : 1.85}
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      active ? 'drop-shadow-[0_0_12px_rgba(255,255,255,0.55)]' : ''
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] transition-all duration-200 ${
                      expanded
                        ? 'translate-x-0 opacity-100'
                        : '-translate-x-3 pointer-events-none opacity-0'
                    } ${active ? 'font-bold text-white' : ''}`}
                  >
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute left-1 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_#fff]" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Subtle Discover / Priva Finds Quick Trigger at Bottom */}
          <div className="px-4">
            <Link
              to="/discover/movie"
              className="group flex h-[44px] items-center gap-4 rounded-xl px-[19px] text-[#8f98b2] transition-all duration-200 hover:translate-x-1 hover:text-white"
            >
              <Compass
                size={20}
                strokeWidth={1.85}
                className="shrink-0 transition-transform duration-300 group-hover:rotate-45"
              />
              <span
                className={`whitespace-nowrap text-[14px] font-medium transition-all duration-200 ${
                  expanded ? 'translate-x-0 opacity-100' : '-translate-x-3 pointer-events-none opacity-0'
                }`}
              >
                Priva Finds
              </span>
            </Link>
          </div>
        </aside>
      </div>

      {/* Mobile Top Floating Header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-gradient-to-b from-[#0f1014]/95 via-[#0f1014]/65 to-transparent px-4 lg:hidden">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md"
          >
            <LayoutGrid size={14} />
            Categories
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Glass Dock */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[64px] items-center justify-around border-t border-white/[0.08] bg-[#0f1014]/95 px-1 backdrop-blur-xl lg:hidden"
      >
        {[
          { to: '/home', label: 'Home', icon: Home, match: ['/', '/home'] },
          { to: '/explore', label: 'Search', icon: Search, match: ['/explore', '/search'] },
          { to: '/tv', label: 'TV', icon: Tv, match: ['/tv'] },
          { to: '/anime', label: 'Anime', icon: Sparkles, match: ['/anime'] },
          { to: '/movies', label: 'Movies', icon: Clapperboard, match: ['/movies'] },
          { to: '/space', label: 'My Space', icon: UserCircle2, match: ['/space'] },
        ].map((item) => {
          const Icon = item.icon;
          const active = isActivePath(item.match);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-1 text-[10.5px] font-medium transition-colors ${
                active ? 'text-white font-semibold' : 'text-[#8f98b2]'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
