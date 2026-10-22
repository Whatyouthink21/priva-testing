import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Megaphone,
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
      {/* Desktop Collapsible Left Rail */}
      <div className="hidden lg:block">
        <div className="rail-passive-scrim pointer-events-none fixed inset-y-0 left-0 z-40 w-[124px]" />

        <div
          className={`rail-scrim pointer-events-none fixed inset-y-0 left-0 z-40 w-[340px] transition-opacity duration-200 ease-out ${
            expanded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <aside
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          aria-label="Primary Navigation"
          className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between py-7 transition-[width] duration-200 ease-out ${
            expanded ? 'w-[228px]' : 'w-[96px]'
          }`}
        >
          {/* Brand Logo */}
          <div className="flex items-center pl-[29px]">
            <div className="flex items-center gap-3">
              <Logo showText={false} size="md" />
              <Link
                to="/home"
                tabIndex={-1}
                className={`font-display text-[21px] font-extrabold tracking-[-0.03em] text-white transition-[opacity,transform] duration-200 ${
                  expanded
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-2 pointer-events-none opacity-0'
                }`}
              >
                Priva
              </Link>
            </div>
          </div>

          {/* Center Navigation Icons + Sliding Labels */}
          <nav className="my-auto flex flex-col gap-1.5 px-4">
            <NavLink to="/announcements" aria-label="Announcements" className={({ isActive }) => `flex h-[48px] items-center gap-4 rounded-xl px-[18px] ${isActive ? 'text-white' : 'text-[#8f98b2] hover:text-white'}`}>
              <Megaphone size={22} className="shrink-0" />
              <span className={`text-[15px] font-semibold transition-opacity ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Announcements</span>
            </NavLink>
            <NavLink
              to="/space"
              className={() =>
                `group relative flex h-[48px] items-center gap-4 rounded-xl px-[18px] transition-colors duration-150 ${
                  mySpaceActive ? 'text-white' : 'text-[#8f98b2] hover:text-white'
                }`
              }
            >
              {isSignedIn ? (
                <span
                  className={`grid h-[24px] w-[24px] shrink-0 place-items-center rounded-full bg-gradient-to-br ${avatarGradient} text-[11px] font-extrabold text-white ring-2 ${
                    mySpaceActive
                      ? 'ring-white scale-110'
                      : 'ring-white/25 group-hover:ring-white/70'
                  } transition-transform duration-150`}
                >
                  {initial}
                </span>
              ) : (
                <UserCircle2
                  size={22}
                  strokeWidth={mySpaceActive ? 2.4 : 1.9}
                  className="shrink-0 transition-transform duration-150 group-hover:scale-110"
                />
              )}
              <span
                className={`whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] transition-[opacity,transform] duration-200 ${
                  expanded
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-2 pointer-events-none opacity-0'
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
                    `group relative flex h-[48px] items-center gap-4 rounded-xl px-[19px] transition-colors duration-150 ${
                      active ? 'text-white' : 'text-[#8f98b2] hover:text-white'
                    }`
                  }
                >
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.4 : 1.85}
                    className="shrink-0 transition-transform duration-150 group-hover:scale-110"
                  />
                  <span
                    className={`whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] transition-[opacity,transform] duration-200 ${
                      expanded
                        ? 'translate-x-0 opacity-100'
                        : '-translate-x-2 pointer-events-none opacity-0'
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

          {/* Bottom Priva Finds Quick Trigger */}
          <div className="px-4">
            <Link
              to="/discover/movie"
              className="group flex h-[44px] items-center gap-4 rounded-xl px-[19px] text-[#8f98b2] transition-colors duration-150 hover:text-white"
            >
              <Compass
                size={20}
                strokeWidth={1.85}
                className="shrink-0 transition-transform duration-200 group-hover:rotate-45"
              />
              <span
                className={`whitespace-nowrap text-[14px] font-medium transition-[opacity,transform] duration-200 ${
                  expanded
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-2 pointer-events-none opacity-0'
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
          <Link to="/announcements" aria-label="Announcements" className="rounded-full bg-white/10 p-2 text-white"><Megaphone size={18} /></Link>
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
