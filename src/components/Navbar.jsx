import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Clock,
  Film,
  Heart,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Tv,
  User,
  X,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useScrolled } from '../hooks/useReveal';
import { openAuth } from '../lib/ui';
import { cx } from '../lib/utils';

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/trending', label: 'Trending', icon: TrendingUp },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/tv', label: 'TV Shows', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Sparkles },
];

export default function Navbar() {
  useScrolled(20);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isSignedIn, displayName, signOut, guest } = useAuth();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const profileRef = useRef(null);
  const mobileInput = useRef(null);

  const initials = useMemo(() => {
    const source = displayName || user?.email || 'G';
    return source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  }, [displayName, user?.email]);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setMobileSearch(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileOpen]);

  useEffect(() => {
    if (mobileSearch) mobileInput.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setMobileSearch(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileSearch]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setMobileSearch(false);
    setMenuOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <>
      <header className="nav-shell fixed inset-x-0 top-0 z-50">
        <span aria-hidden className="nav-scrim" />
        <div className="container-page flex h-[70px] items-center gap-3">
          <Logo className="mr-1 shrink-0" />

          {/* Desktop pill nav */}
          <nav className="mx-auto hidden items-center gap-0.5 rounded-full border border-white/[0.07] bg-black/35 p-1.5 backdrop-blur-md lg:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive: active }) =>
                  cx(
                    'relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-300 ease-smooth',
                    active
                      ? 'bg-white text-ink-950 shadow-[0_6px_20px_-8px_rgba(255,255,255,0.6)]'
                      : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
                  )
                }
              >
                <Icon size={14.5} strokeWidth={2.2} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {/* Desktop search */}
            <form onSubmit={submitSearch} className="group/search relative hidden md:block">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35 transition group-focus-within/search:text-brand-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, shows…"
                aria-label="Search"
                className="w-[210px] rounded-full border border-white/10 bg-white/[0.05] py-2 pl-9 pr-3 text-[13px] text-white placeholder:text-white/30 transition-all duration-500 ease-smooth focus:w-[290px] focus:border-brand-500/60 focus:bg-white/[0.08] focus:outline-none"
              />
            </form>

            <button
              onClick={() => setMobileSearch(true)}
              aria-label="Search"
              className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white md:hidden"
            >
              <Search size={18} />
            </button>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] p-1 pr-1 transition hover:border-white/25 hover:bg-white/[0.1] sm:pr-2.5"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[12px] font-bold text-white">
                  {isSignedIn || guest ? initials || <User size={14} /> : <User size={15} />}
                </span>
                <span className="hidden max-w-[92px] truncate text-[12.5px] font-medium text-white/75 sm:block">
                  {isSignedIn ? displayName || 'Account' : guest ? 'Guest' : 'Sign in'}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-60 overflow-hidden rounded-2xl border border-white/10 bg-ink-850/95 shadow-card backdrop-blur-xl animate-fadeUp">
                  <div className="border-b border-white/[0.07] px-4 py-3">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {isSignedIn ? displayName || 'Member' : guest ? 'Guest session' : 'Not signed in'}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-white/40">
                      {isSignedIn ? user?.email : 'Sign in to sync across devices'}
                    </p>
                  </div>

                  <div className="py-1.5">
                    <MenuItem to="/my-list" icon={Heart} label="My List" />
                    <MenuItem to="/history" icon={Clock} label="Watch History" />
                    <MenuItem to="/settings" icon={Settings} label="Settings" />
                  </div>

                  <div className="border-t border-white/[0.07] p-1.5">
                    {isSignedIn ? (
                      <button
                        onClick={async () => {
                          await signOut();
                          toast('Signed out.', 'info');
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            openAuth('signin');
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          <User size={15} /> Sign in
                        </button>
                        <button
                          onClick={() => {
                            openAuth('signup');
                            setProfileOpen(false);
                          }}
                          className="mt-1 w-full rounded-lg bg-brand px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-600"
                        >
                          Create account
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="grid h-9 w-9 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile sheet */}
        <div
          className={cx(
            'overflow-hidden transition-[max-height,opacity] duration-500 ease-smooth lg:hidden',
            menuOpen
              ? 'max-h-[420px] border-t border-white/[0.06] bg-ink-950/95 opacity-100 backdrop-blur-xl'
              : 'max-h-0 border-t-0 opacity-0'
          )}
        >
          <nav className="container-page flex flex-col gap-1 py-4">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cx(
                  'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition',
                  isActive(to) ? 'bg-white text-ink-950' : 'text-white/70 hover:bg-white/[0.06]'
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3">
              <Link to="/my-list" className="chip justify-center py-2.5">
                <Heart size={14} /> My List
              </Link>
              <Link to="/history" className="chip justify-center py-2.5">
                <Clock size={14} /> History
              </Link>
              <Link to="/settings" className="chip justify-center py-2.5">
                <Settings size={14} /> Settings
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile search overlay */}
      {mobileSearch && (
        <div className="fixed inset-0 z-[60] bg-ink-950/95 backdrop-blur-xl animate-fadeIn md:hidden">
          <div className="container-page flex h-[70px] items-center gap-3">
            <form onSubmit={submitSearch} className="flex flex-1 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5">
              <Search size={16} className="text-white/40" />
              <input
                ref={mobileInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, shows, people…"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            </form>
            <button
              onClick={() => setMobileSearch(false)}
              className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close search"
            >
              <X size={20} />
            </button>
          </div>
          <div className="container-page mt-2">
            <p className="mb-2 text-[11px] uppercase tracking-widest text-white/30">Try searching</p>
            <div className="flex flex-wrap gap-2">
              {['Dune', 'Breaking Bad', 'Anime', 'Oppenheimer', 'Arcane'].map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="chip"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuItem({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
    >
      <Icon size={15} /> {label}
    </Link>
  );
}
