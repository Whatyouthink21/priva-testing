import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Check,
  Edit3,
  HelpCircle,
  History,
  LogIn,
  LogOut,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react';
import ContinueCard from '../components/ContinueCard';
import PosterCard from '../components/PosterCard';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { api, normalizeItem } from '../lib/tmdb';

export default function MySpace() {
  const { user, signOut, updateDisplayName } = useAuth();
  const {
    myList,
    continueWatching,
    recentSeeds,
    toggleMyList,
    removeWatchProgress,
    clearContinueWatching,
  } = useLibrary();
  const { toast } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [becauseItems, setBecauseItems] = useState([]);
  const [becauseTitle, setBecauseTitle] = useState('Because You Watched');
  const [loadingBecause, setLoadingBecause] = useState(true);

  useEffect(() => {
    document.title = 'My Space · Priva';
  }, []);

  const seed = recentSeeds[0] || null;

  useEffect(() => {
    let cancelled = false;
    setLoadingBecause(true);

    async function loadRecommendations() {
      try {
        if (seed?.id) {
          setBecauseTitle(`Because You Watched ${seed.title}`);
          const recs = await api.recommendationsFor(seed.type || 'movie', seed.id);
          if (!cancelled && recs.length) {
            setBecauseItems(recs);
            return;
          }
        }
        setBecauseTitle('Recommended For You');
        const fallback = await api.trendingAll(1);
        if (!cancelled) {
          setBecauseItems(
            (fallback.results || [])
              .filter((x) => x.media_type !== 'person' && x.poster_path)
              .slice(0, 14)
              .map((x) => normalizeItem(x))
          );
        }
      } catch {
        if (!cancelled) setBecauseItems([]);
      } finally {
        if (!cancelled) setLoadingBecause(false);
      }
    }

    loadRecommendations();
    return () => {
      cancelled = true;
    };
  }, [seed?.id, seed?.type, seed?.title]);

  const initial = (user?.displayName || user?.email || 'P').trim().charAt(0).toUpperCase();

  const saveProfileName = async (e) => {
    e.preventDefault();
    if (!nameDraft.trim()) return;
    try {
      await updateDisplayName(nameDraft.trim());
      setEditingName(false);
      toast('Profile name updated', 'success');
    } catch {
      toast('Could not update profile name', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1014] pb-12 pt-8 lg:pt-12">
      {/* Top Profile Banner */}
      <div className="px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
        <div
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 sm:p-8"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgba(37, 99, 235, 0.22), rgba(22, 24, 31, 0.96) 62%)',
          }}
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            {user ? (
              <div className="flex items-center gap-4 sm:gap-5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-400/50 sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#06b6d4] font-display text-2xl font-extrabold text-white shadow-lg sm:h-20 sm:w-20 sm:text-3xl">
                    {initial}
                  </div>
                )}

                <div>
                  {editingName ? (
                    <form onSubmit={saveProfileName} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        className="h-9 rounded-lg border border-white/15 bg-[#0f1014] px-3 text-[14px] text-white focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white"
                      >
                        <Check size={16} />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-[22px] font-extrabold text-white sm:text-[26px]">
                        {user.displayName || user.email?.split('@')[0] || 'Priva Member'}
                      </h1>
                      <button
                        type="button"
                        onClick={() => {
                          setNameDraft(user.displayName || '');
                          setEditingName(true);
                        }}
                        aria-label="Edit display name"
                        className="text-[#8f98b2] transition-colors hover:text-white"
                      >
                        <Edit3 size={15} />
                      </button>
                    </div>
                  )}
                  <p className="mt-0.5 text-[13px] text-[#8f98b2]">{user.email}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Cloud Sync Active · {myList.length} Saved</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-lg">
                <h1 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-white sm:text-[28px]">
                  Log in to Priva
                </h1>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#9aa3bc]">
                  Start watching from where you left off, personalise your My List and sync
                  playback across every device.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/help"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/[0.12]"
              >
                <HelpCircle size={16} />
                <span>Help &amp; Support</span>
              </Link>

              {user ? (
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    toast('Signed out of Priva', 'info');
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-[13.5px] font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <>
                  <Link
                    to="/auth?mode=signin"
                    className="btn-priva-blue inline-flex h-11 items-center gap-2 rounded-xl px-6 text-[14px] font-bold text-white"
                  >
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/auth?mode=signup"
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.08] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-white/[0.15]"
                  >
                    <UserPlus size={16} />
                    <span>Create Account</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Continue Watching */}
      <section className="mt-10 px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History size={19} className="text-blue-400" />
            <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
              Continue Watching
            </h2>
            {continueWatching.length > 0 && (
              <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#8f98b2]">
                {continueWatching.length}
              </span>
            )}
          </div>

          {continueWatching.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearContinueWatching();
                toast('Cleared Continue Watching history', 'info');
              }}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#8f98b2] transition-colors hover:text-red-400"
            >
              <Trash2 size={14} />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {continueWatching.length > 0 ? (
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {continueWatching.map((entry) => (
              <ContinueCard
                key={`${entry.type}-${entry.id}`}
                entry={entry}
                onRemove={(item) => {
                  removeWatchProgress(item);
                  toast(`Removed "${item.title}"`, 'info');
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-[#16181f]/65 p-6 text-[13.5px] text-[#8f98b2]">
            Movies, TV episodes, and anime you start watching appear here automatically with your
            resume progress bar.{' '}
            <Link to="/home" className="font-semibold text-white hover:underline">
              Explore titles
            </Link>
          </div>
        )}
      </section>

      {/* SECTION 2: My List */}
      <section className="mt-10 px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
        <div className="mb-4 flex items-center gap-2.5">
          <Bookmark size={19} className="text-blue-400" />
          <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
            My List
          </h2>
          {myList.length > 0 && (
            <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#8f98b2]">
              {myList.length}
            </span>
          )}
        </div>

        {myList.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {myList.map((item) => (
              <PosterCard
                key={`${item.type}-${item.id}`}
                item={item}
                onRemove={(target) => {
                  toggleMyList(target);
                  toast(`Removed "${target.title}" from My List`, 'info');
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-[#16181f]/65 p-6 text-[13.5px] text-[#8f98b2]">
            Your watchlist is empty. Click the <strong className="text-white">+</strong> button on
            any movie, show, or anime to save it to My List.
          </div>
        )}
      </section>

      {/* SECTION 3: Because You Watched */}
      <section className="mt-10 px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
        <div className="mb-4 flex items-center gap-2.5">
          <Sparkles size={19} className="text-blue-400" />
          <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
            {becauseTitle}
          </h2>
        </div>

        {loadingBecause ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-[2/3] w-full rounded-[8px]" />
                <div className="skeleton mt-2 h-3.5 w-3/4 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {becauseItems.slice(0, 14).map((item) => (
              <PosterCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
