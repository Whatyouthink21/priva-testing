import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Clock, Film, Heart, LogOut, Menu, Search, Settings, Sparkles, TrendingUp, Tv, User, X, Home } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { openAuth } from '../lib/ui';
import { cx } from '../lib/utils';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/tv', label: 'TV Shows' },
  { to: '/anime', label: 'Anime' },
  { to: '/trending', label: 'Trending' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isSignedIn, displayName, signOut, guest } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const initials = useMemo(() => {
    const source = displayName || user?.email || 'G';
    return source.split(/[\s@._-]+/).filter(Boolean).slice(0,1).map(w=>w[0]?.toUpperCase()).join('') || 'U';
  }, [displayName, user?.email]);

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-[56px] border-b border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl">
        <div className="container-page flex h-full items-center gap-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex ml-6">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cx(
                    'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition',
                    isActive ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/10'
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <form onSubmit={submitSearch} className="relative hidden sm:block">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, shows..."
                className="h-9 w-[200px] rounded-full border border-white/10 bg-white/[0.06] pl-9 pr-4 text-[13px] text-white placeholder:text-white/30 focus:w-[260px] focus:border-white/20 focus:outline-none transition-all"
              />
            </form>

            <Link to="/search" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 sm:hidden">
              <Search size={16} />
            </Link>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(v=>!v)}
                className="flex items-center gap-2 rounded-full bg-white/10 px-1 py-1 pr-3 text-white/80 hover:bg-white/15"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-black text-xs font-bold">{initials}</span>
                <span className="hidden sm:block text-[12px] font-medium max-w-[90px] truncate">{isSignedIn ? displayName || 'Account' : guest ? 'Guest' : 'Sign in'}</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-[44px] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#18181b] shadow-xl">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-sm font-semibold truncate">{isSignedIn ? displayName : guest ? 'Guest' : 'Not signed in'}</p>
                    <p className="text-xs text-white/40 truncate">{isSignedIn ? user?.email : 'Sign in to sync'}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link to="/my-list" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white"><Heart size={14}/> My List</Link>
                    <Link to="/history" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white"><Clock size={14}/> History</Link>
                    <Link to="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white"><Settings size={14}/> Settings</Link>
                  </div>
                  <div className="border-t border-white/10 p-2">
                    {isSignedIn ? (
                      <button onClick={async()=>{await signOut(); toast('Signed out','info'); setProfileOpen(false)}} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white"><LogOut size={14}/> Sign out</button>
                    ) : (
                      <>
                        <button onClick={()=>{openAuth('signin'); setProfileOpen(false)}} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white">Sign in</button>
                        <button onClick={()=>{openAuth('signup'); setProfileOpen(false)}} className="mt-1 w-full rounded-full bg-white py-2 text-sm font-semibold text-black">Create account</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={()=>setMenuOpen(v=>!v)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white md:hidden">
              {menuOpen ? <X size={16}/> : <Menu size={16}/>}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="absolute inset-x-0 top-[56px] border-t border-white/10 bg-[#09090b] p-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map(({to,label})=>(
                <Link key={to} to={to} className="rounded-xl px-3 py-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white">{label}</Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      <div className="h-[56px]" />
    </>
  );
}
