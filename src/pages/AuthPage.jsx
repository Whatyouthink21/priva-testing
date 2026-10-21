import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BookmarkCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, IMG } from '../lib/tmdb';

// Curated Movie & TV Show TMDB posters so the flowing wall renders on frame 0 without waiting
const CURATED_POSTERS = [
  { id: 'm1', title: 'Dune: Part Two', poster: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' },
  { id: 't1', title: 'Breaking Bad', poster: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg' },
  { id: 'm2', title: 'Interstellar', poster: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { id: 't2', title: 'Stranger Things', poster: '/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg' },
  { id: 'm3', title: 'Oppenheimer', poster: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
  { id: 't3', title: 'Arcane', poster: '/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg' },
  { id: 'm4', title: 'The Dark Knight', poster: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
  { id: 't4', title: 'Game of Thrones', poster: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg' },
  { id: 'm5', title: 'Avengers: Endgame', poster: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg' },
  { id: 't5', title: 'Attack on Titan', poster: '/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg' },
  { id: 'm6', title: 'Spider-Man: Across the Spider-Verse', poster: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg' },
  { id: 't6', title: 'The Last of Us', poster: '/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg' },
  { id: 'm7', title: 'Inception', poster: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg' },
  { id: 't7', title: 'Chernobyl', poster: '/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg' },
  { id: 'm8', title: 'Blade Runner 2049', poster: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg' },
  { id: 't8', title: 'House of the Dragon', poster: '/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg' },
  { id: 'm9', title: 'Parasite', poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' },
  { id: 't9', title: 'Jujutsu Kaisen', poster: '/fHpKWq9ayzSk8nSwqRuaAUemRKh.jpg' },
  { id: 'm10', title: 'Your Name.', poster: '/q719jXXEzOoYaps6babgKnONONX.jpg' },
  { id: 't10', title: 'Severance', poster: '/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg' },
  { id: 'm11', title: 'The Batman', poster: '/74xTEgt7R36Fpooo50r9T25onhq.jpg' },
  { id: 't11', title: 'Shogun', poster: '/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg' },
  { id: 'm12', title: 'Whiplash', poster: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg' },
  { id: 't12', title: 'One Piece', poster: '/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg' },
];

function friendlyAuthError(err) {
  const code = err?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'Incorrect email or password. Double-check your credentials and try again.';
  }
  if (code.includes('user-not-found')) {
    return 'No account found with this email. Switch to Sign Up to create one.';
  }
  if (code.includes('email-already-in-use')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (code.includes('weak-password')) {
    return 'Password should be at least 6 characters long.';
  }
  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('popup-closed-by-user')) {
    return 'Google sign-in window was closed before completing.';
  }
  if (code.includes('unauthorized-domain')) {
    return 'Google popup is restricted on this preview domain — please use Email & Password.';
  }
  return err?.message?.replace('Firebase: ', '') || 'Authentication failed. Please try again.';
}

export default function AuthPage({ defaultMode = 'signin' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signInEmail, signUpEmail, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();

  const initialMode = useMemo(() => {
    const q = searchParams.get('mode');
    if (q === 'signup' || q === 'signin' || q === 'reset') return q;
    if (location.pathname === '/signup') return 'signup';
    return defaultMode;
  }, [searchParams, location.pathname, defaultMode]);

  const [mode, setMode] = useState(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [wallPosters, setWallPosters] = useState(CURATED_POSTERS);

  const redirectTo = searchParams.get('redirect') || '/space';

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setInfoMessage('');
  }, [initialMode]);

  useEffect(() => {
    document.title =
      mode === 'signup'
        ? 'Create Account · Priva'
        : mode === 'reset'
          ? 'Reset Password · Priva'
          : 'Sign In · Priva';
  }, [mode]);

  // Redirect signed-in users smoothly to their destination
  useEffect(() => {
    if (user && !user.isAnonymous) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  // Enrich background wall with fresh live Movies & TV Shows from TMDB
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([api.trendingMovies(1), api.trendingTv(1)]).then(([mRes, tRes]) => {
      if (cancelled) return;
      const movies = mRes.status === 'fulfilled' ? mRes.value.results || [] : [];
      const shows = tRes.status === 'fulfilled' ? tRes.value.results || [] : [];
      const combined = [];
      const maxLen = Math.max(movies.length, shows.length);
      for (let i = 0; i < maxLen; i += 1) {
        if (movies[i]?.poster_path) {
          combined.push({
            id: `live-m-${movies[i].id}`,
            title: movies[i].title || 'Movie',
            poster: movies[i].poster_path,
          });
        }
        if (shows[i]?.poster_path) {
          combined.push({
            id: `live-t-${shows[i].id}`,
            title: shows[i].name || 'Series',
            poster: shows[i].poster_path,
          });
        }
      }
      if (combined.length >= 18) {
        setWallPosters(combined.slice(0, 30));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Split posters across 6 counter-flowing columns for rich 60fps cinema backdrop
  const columns = useMemo(() => {
    const colCount = 6;
    const buckets = Array.from({ length: colCount }, () => []);
    wallPosters.forEach((item, idx) => {
      buckets[idx % colCount].push(item);
    });
    return buckets.map((col, idx) => ({
      id: idx,
      direction: idx % 2 === 0 ? 'up' : 'down',
      duration: 38 + (idx % 3) * 7,
      items: [...col, ...col],
    }));
  }, [wallPosters]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setInfoMessage('');
    const next = new URLSearchParams(searchParams);
    next.set('mode', nextMode);
    setSearchParams(next, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInEmail(email.trim(), password);
        toast('Signed in to Priva', 'success');
        navigate(redirectTo, { replace: true });
      } else if (mode === 'signup') {
        await signUpEmail(email.trim(), password, displayName);
        toast('Account created! Your watchlist & history are synced.', 'success');
        navigate(redirectTo, { replace: true });
      } else {
        await resetPassword(email.trim());
        setInfoMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
      toast('Signed in with Google', 'success');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#0a0b0f] text-white">
      {/* Flowing Movie & TV Thumbnail Backdrop Wall */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden select-none"
      >
        <div className="absolute -inset-x-16 -inset-y-24 flex -rotate-[5deg] scale-[1.06] gap-3.5 opacity-60 sm:gap-4">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`flex min-w-0 flex-1 flex-col gap-3.5 sm:gap-4 ${
                col.id >= 3 ? 'hidden sm:flex' : 'flex'
              } ${col.id >= 5 ? 'hidden xl:flex' : ''}`}
            >
              <div
                style={{ animationDuration: `${col.duration}s` }}
                className={`flex flex-col gap-3.5 sm:gap-4 will-change-transform ${
                  col.direction === 'up' ? 'animate-poster-up' : 'animate-poster-down'
                }`}
              >
                {col.items.map((poster, i) => (
                  <div
                    key={`${poster.id}-${i}`}
                    className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#16181f] ring-1 ring-white/[0.08] shadow-[0_12px_30px_rgba(0,0,0,0.65)]"
                  >
                    <img
                      src={IMG.poster(poster.poster, 'w342')}
                      alt=""
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Multi-layer Dark Cinema Vignette for High Contrast */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 72% 50%, rgba(10,11,15,0.72) 0%, rgba(10,11,15,0.88) 58%, rgba(10,11,15,0.96) 100%)',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0b0f] via-[#0a0b0f]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0b0f] via-[#0a0b0f]/75 to-transparent" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-10 lg:px-16">
        <Logo size="lg" />
        <div className="flex items-center gap-2.5">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-[#141720]/85 px-4 py-2.5 text-[13px] font-semibold text-[#e1e6f0] backdrop-blur-md transition-colors hover:border-white/25 hover:bg-[#1b1f2c] hover:text-white"
          >
            <ArrowLeft size={15} />
            <span>Back to Browse</span>
          </Link>
        </div>
      </header>

      {/* Main Split Foreground Content */}
      <div className="relative z-20 mx-auto flex w-full max-w-6xl flex-1 items-center justify-between gap-12 px-5 py-6 sm:px-10 lg:px-16">
        {/* Left Cinema Brand Showcase (Desktop) */}
        <div className="hidden max-w-md space-y-6 lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3.5 py-1.5 text-[12px] font-bold tracking-wide text-blue-300">
            <Sparkles size={13} />
            <span>CLOUD SYNC ACROSS EVERY SCREEN</span>
          </span>

          <h1 className="font-display text-[44px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.8)]">
            Every movie &amp; series, right where you left off.
          </h1>

          <p className="text-[15.5px] leading-relaxed text-[#b2bcd4]">
            Sign in to Priva to sync your Watchlist, exact episode progress, and tailored
            recommendations in real time.
          </p>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.08] bg-[#141720]/75 p-3.5 backdrop-blur-md">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-500/15 text-blue-400">
                <History size={19} />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-white">Automatic Continue Watching</p>
                <p className="text-[12px] text-[#8f98b2]">
                  Picks up on the exact season, episode, and timestamp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.08] bg-[#141720]/75 p-3.5 backdrop-blur-md">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-500/15 text-indigo-400">
                <BookmarkCheck size={19} />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-white">Unified My List &amp; Picks</p>
                <p className="text-[12px] text-[#8f98b2]">
                  Save movies, TV shows, and anime once — watch anywhere.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Dedicated Auth Card */}
        <div className="mx-auto w-full max-w-[440px] lg:mx-0">
          <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-[#141720]/90 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.92)] backdrop-blur-xl sm:p-8">
            {/* Mode Switch Pill Tabs */}
            {mode !== 'reset' && (
              <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#0d0f15] p-1 ring-1 ring-white/[0.07]">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`rounded-lg py-2.5 text-[13.5px] font-bold transition-colors ${
                    mode === 'signin'
                      ? 'bg-[#202534] text-white shadow'
                      : 'text-[#8f98b2] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`rounded-lg py-2.5 text-[13.5px] font-bold transition-colors ${
                    mode === 'signup'
                      ? 'bg-[#202534] text-white shadow'
                      : 'text-[#8f98b2] hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            <div className="mb-5">
              <h2 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-white">
                {mode === 'signin'
                  ? 'Welcome back'
                  : mode === 'signup'
                    ? 'Create your Priva account'
                    : 'Reset your password'}
              </h2>
              <p className="mt-1 text-[13px] text-[#8f98b2]">
                {mode === 'reset'
                  ? 'Enter your email address and we will send you a password reset link.'
                  : 'Stream seamlessly with cloud-synced watchlist and playback progress.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[12.5px] text-red-200">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[12.5px] text-emerald-200">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                <span>{infoMessage}</span>
              </div>
            )}

            {mode !== 'reset' && (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleGoogle}
                  className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.12] bg-white/[0.06] text-[13.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.92-1.77 3.04-4.38 3.04-7.51 0-.72-.06-1.41-.19-2H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.3-2.56c-.91.61-2.08.98-3.45.98-2.65 0-4.9-1.79-5.7-4.2H2.89v2.64A9.997 9.997 0 0 0 12 22z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.3 13.75A5.99 5.99 0 0 1 5.98 12c0-.61.11-1.2.32-1.75V7.61H2.89A9.997 9.997 0 0 0 2 12c0 1.61.39 3.14 1.09 4.39l3.21-2.64z"
                    />
                    <path
                      fill="#4285F4"
                      d="M12 6.05c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 3.02 14.75 2 12 2A9.997 9.997 0 0 0 2.89 7.61l3.41 2.64c.8-2.41 3.05-4.2 5.7-4.2z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="my-4 flex items-center gap-3 text-[11.5px] uppercase tracking-wider text-white/35">
                  <div className="h-px flex-1 bg-white/10" />
                  <span>or email</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#c5cde0]">
                    Display Name
                  </label>
                  <div className="relative">
                    <UserIcon
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8f98b2]"
                    />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#0e1017] pl-10 pr-3.5 text-[14px] text-white placeholder-[#5e667e] focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#c5cde0]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8f98b2]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#0e1017] pl-10 pr-3.5 text-[14px] text-white placeholder-[#5e667e] focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-[#c5cde0]">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('reset')}
                        className="text-[12px] font-medium text-blue-400 hover:text-blue-300"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8f98b2]"
                    />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#0e1017] pl-10 pr-10 text-[14px] text-white placeholder-[#5e667e] focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f98b2] hover:text-white"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-priva-blue mt-2 h-11 w-full rounded-xl text-[14.5px] font-bold text-white disabled:opacity-50"
              >
                {submitting
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Sign In to Priva'
                    : mode === 'signup'
                      ? 'Create Account'
                      : 'Send Reset Link'}
              </button>
            </form>

            {mode === 'reset' && (
              <p className="mt-5 text-center text-[13px] text-[#8f98b2]">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-semibold text-white hover:underline"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
