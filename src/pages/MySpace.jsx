import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Check,
  Cloud,
  Edit3,
  HelpCircle,
  History,
  LogOut,
  Play,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';
import ContinueCard from '../components/ContinueCard';
import PosterCard from '../components/PosterCard';
import ContentRow from '../components/ContentRow';
import { AVATAR_PRESETS, useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { api, normalizeItem } from '../lib/tmdb';
import { SERVERS } from '../lib/sources';

export default function MySpace() {
  const {
    user,
    isSignedIn,
    displayName,
    avatarGradient,
    openAuthModal,
    updateUserProfile,
    signOut,
  } = useAuth();
  const {
    myList,
    history,
    continueWatching,
    recentSeeds,
    settings,
    removeFromList,
    removeWatchProgress,
    clearWatchHistory,
    updateSettings,
  } = useLibrary();
  const { toast } = useToast();

  const [listFilter, setListFilter] = useState('all');
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState(displayName || '');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [fallbackSeed, setFallbackSeed] = useState(null);
  const [becausePrimary, setBecausePrimary] = useState([]);
  const [becauseSecondary, setBecauseSecondary] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    document.title = 'My Space · Priva';
  }, []);

  useEffect(() => {
    setDraftName(displayName || '');
  }, [displayName]);

  // Determine the seed title(s) for "Because You Watched"
  const activeSeed = recentSeeds[0] || fallbackSeed;
  const secondSeed = recentSeeds[1] || null;

  useEffect(() => {
    if (recentSeeds.length > 0) return undefined;
    let cancelled = false;
    api
      .trendingAll(1)
      .then((res) => {
        if (cancelled) return;
        const first = (res.results || []).find((x) => x.media_type !== 'person');
        if (first) setFallbackSeed(normalizeItem(first));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [recentSeeds.length]);

  useEffect(() => {
    if (!activeSeed?.id) return undefined;
    let cancelled = false;
    setLoadingRecs(true);
    api
      .recommendationsFor(activeSeed.type || 'movie', activeSeed.id)
      .then((items) => {
        if (!cancelled) setBecausePrimary(items);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSeed?.id, activeSeed?.type]);

  useEffect(() => {
    if (!secondSeed?.id) {
      setBecauseSecondary([]);
      return undefined;
    }
    let cancelled = false;
    api.recommendationsFor(secondSeed.type || 'movie', secondSeed.id).then((items) => {
      if (!cancelled) setBecauseSecondary(items);
    });
    return () => {
      cancelled = true;
    };
  }, [secondSeed?.id, secondSeed?.type]);

  const filteredList = useMemo(() => {
    if (listFilter === 'all') return myList;
    if (listFilter === 'anime') return myList.filter((i) => i.isAnime);
    return myList.filter((i) => i.type === listFilter && !i.isAnime);
  }, [myList, listFilter]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!draftName.trim()) return;
    await updateUserProfile({ name: draftName.trim() });
    setEditingProfile(false);
    toast('Profile updated');
  };

  return (
    <div className="myspace-glow min-h-screen pt-16 lg:pt-10">
      {/* Top Bar: Profile / Sign In Hero matching bingr.one/space */}
      <div className="border-b border-white/[0.06] pb-10">
        <div className="px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
          {/* Top-right utility buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/[0.14]"
            >
              <Settings size={15} />
              <span>Player Settings</span>
            </button>

            <Link
              to="/help"
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/[0.14]"
            >
              <HelpCircle size={15} />
              <span>Help &amp; Support</span>
            </Link>

            {isSignedIn && (
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  toast('Signed out of Priva', 'info');
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-[13px] font-semibold text-[#cbd5e1] transition hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-300"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            )}
          </div>

          {/* Collapsible Player Preferences Panel */}
          {settingsOpen && (
            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#16181f]/90 p-5 backdrop-blur-xl animate-pop-card">
              <h3 className="font-display text-[16px] font-bold text-white">
                Playback Preferences
              </h3>
              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13.5px] font-semibold text-white">Default Server</p>
                  <p className="text-[12px] text-[#8f98b2]">
                    Automatically start every movie &amp; episode on your preferred server
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {SERVERS.map((srv) => (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => {
                          updateSettings({ defaultServer: srv.id });
                          toast(`Default set to ${srv.label}`);
                        }}
                        className={`rounded-lg px-4 py-2 text-[12.5px] font-bold transition ${
                          settings.defaultServer === srv.id
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-[#0f1014] text-[#8f98b2] ring-1 ring-white/[0.08] hover:text-white'
                        }`}
                      >
                        {srv.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#0f1014] px-4 py-3 ring-1 ring-white/[0.07]">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.autoplayNext)}
                    onChange={(e) => updateSettings({ autoplayNext: e.target.checked })}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  <div>
                    <span className="block text-[13px] font-semibold text-white">
                      Auto-play Next Episode
                    </span>
                    <span className="block text-[11.5px] text-[#8f98b2]">
                      Seamless binge mode for TV &amp; Anime
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Signed Out vs Signed In Hero */}
          {!isSignedIn ? (
            <div className="mx-auto mt-6 flex max-w-lg flex-col items-center text-center">
              {/* Glowing Cosmic Emblem matching Hotstar/Bingr My Space Login */}
              <div className="relative mb-5 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-b from-blue-500/25 via-indigo-600/20 to-transparent ring-1 ring-blue-400/25 shadow-[0_0_60px_rgba(37,99,235,0.45)]">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#38bdf8] via-[#2563eb] to-[#4f46e5] text-white shadow-lg">
                  <Sparkles size={28} />
                </div>
              </div>

              <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-white sm:text-[30px]">
                Log in to Priva
              </h1>
              <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-[#8f98b2]">
                Start watching from where you left off, sync your My List across devices, and unlock
                personalized recommendations.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => openAuthModal('signin')}
                  className="btn-priva-blue h-12 min-w-[190px] rounded-xl px-8 text-[15px] font-bold text-white"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="h-12 rounded-xl border border-white/[0.12] bg-white/[0.06] px-6 text-[14px] font-semibold text-white transition hover:bg-white/[0.12]"
                >
                  Sign Up
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div
                  className={`grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br ${avatarGradient} font-display text-[24px] font-extrabold text-white ring-4 ring-white/15 shadow-[0_10px_30px_rgba(37,99,235,0.4)]`}
                >
                  {(displayName || 'U').charAt(0).toUpperCase()}
                </div>

                <div>
                  {editingProfile ? (
                    <form onSubmit={handleSaveProfile} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className="h-9 rounded-lg border border-white/15 bg-[#0f1014] px-3 text-[15px] font-semibold text-white focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white"
                      >
                        <Check size={16} />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <h1 className="font-display text-[24px] font-extrabold text-white sm:text-[28px]">
                        {displayName}
                      </h1>
                      <button
                        type="button"
                        onClick={() => setEditingProfile(true)}
                        aria-label="Edit profile name"
                        className="text-[#8f98b2] transition hover:text-white"
                      >
                        <Edit3 size={15} />
                      </button>
                    </div>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[12.5px] text-[#8f98b2]">
                    <span>{user?.email}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <Cloud size={13} /> Cloud Synced
                    </span>
                  </div>

                  {/* Quick Avatar Ring Picker */}
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateUserProfile({ avatar: preset })}
                        aria-label="Choose avatar theme"
                        className={`h-5 w-5 rounded-full bg-gradient-to-br ${preset} transition-transform ${
                          avatarGradient === preset ? 'scale-125 ring-2 ring-white' : 'opacity-65 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 rounded-2xl border border-white/[0.07] bg-[#16181f]/75 px-6 py-3.5 backdrop-blur">
                <div>
                  <span className="block font-display text-[20px] font-extrabold text-white">
                    {continueWatching.length}
                  </span>
                  <span className="text-[11.5px] font-medium text-[#8f98b2]">In Progress</span>
                </div>
                <div className="h-8 w-px bg-white/[0.08]" />
                <div>
                  <span className="block font-display text-[20px] font-extrabold text-white">
                    {myList.length}
                  </span>
                  <span className="text-[11.5px] font-medium text-[#8f98b2]">My List</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. CONTINUE WATCHING SECTION                                         */}
      {/* ==================================================================== */}
      <section className="pt-8">
        <div className="mb-3.5 flex items-center justify-between px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
          <div className="flex items-center gap-2.5">
            <History size={19} className="text-blue-400" />
            <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
              Continue Watching
            </h2>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearWatchHistory();
                toast('Cleared Continue Watching history', 'info');
              }}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#8f98b2] transition hover:text-red-400"
            >
              <Trash2 size={14} />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {continueWatching.length > 0 ? (
          <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-4 sm:px-8 lg:pl-[108px] lg:pr-12">
            {continueWatching.map((entry) => (
              <ContinueCard
                key={`${entry.type}-${entry.id}`}
                entry={entry}
                onRemove={(item) => {
                  removeWatchProgress(item);
                  toast(`Removed "${item.title}" from Continue Watching`, 'info');
                }}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/[0.07] bg-[#16181f]/65 p-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-[15px] font-semibold text-white">
                  Pick up right where you left off
                </p>
                <p className="mt-1 text-[13px] text-[#8f98b2]">
                  Any movie, series, or anime you start watching appears here automatically with your
                  saved timestamp.
                </p>
              </div>
              <Link
                to="/home"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/[0.1] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.18]"
              >
                <Play size={14} className="fill-current" />
                <span>Start Watching</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* 2. MY LIST SECTION                                                   */}
      {/* ==================================================================== */}
      <section className="pt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
          <div className="flex items-center gap-2.5">
            <Bookmark size={19} className="text-blue-400" />
            <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
              My List
            </h2>
            {myList.length > 0 && (
              <span className="rounded-full bg-white/[0.09] px-2.5 py-0.5 text-[12px] font-semibold text-[#cbd5e1]">
                {myList.length}
              </span>
            )}
          </div>

          {myList.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-[#16181f] p-1 ring-1 ring-white/[0.07]">
              {[
                { id: 'all', label: 'All' },
                { id: 'movie', label: 'Movies' },
                { id: 'tv', label: 'Series' },
                { id: 'anime', label: 'Anime' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setListFilter(tab.id)}
                  className={`rounded-lg px-3 py-1 text-[12px] font-semibold transition ${
                    listFilter === tab.id
                      ? 'bg-white text-[#0f1014]'
                      : 'text-[#8f98b2] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredList.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:px-8 md:grid-cols-4 lg:grid-cols-5 lg:pl-[108px] lg:pr-12 xl:grid-cols-6 2xl:grid-cols-7">
            {filteredList.map((item) => (
              <PosterCard
                key={`${item.type}-${item.id}`}
                item={item}
                onRemove={(target) => {
                  removeFromList(target);
                  toast(`Removed "${target.title}" from My List`, 'info');
                }}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/[0.07] bg-[#16181f]/65 p-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-[15px] font-semibold text-white">Your watchlist is ready</p>
                <p className="mt-1 text-[13px] text-[#8f98b2]">
                  Tap the <span className="font-bold text-white">+</span> button on any movie, TV
                  series, or anime to save it to My List.
                </p>
              </div>
              <Link
                to="/explore"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/[0.1] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.18]"
              >
                <span>Browse Titles</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* 3. BECAUSE YOU WATCHED SECTION                                       */}
      {/* ==================================================================== */}
      <div className="pt-6">
        <ContentRow
          title={
            recentSeeds.length > 0
              ? `Because You Watched ${activeSeed?.title || ''}`
              : activeSeed?.title
                ? `Because You Watched · Trending Like ${activeSeed.title}`
                : 'Because You Watched'
          }
          items={becausePrimary}
          loading={loadingRecs}
          viewAllTo={activeSeed ? `/${activeSeed.type || 'movie'}/${activeSeed.id}` : '/explore'}
        />

        {secondSeed && becauseSecondary.length > 0 && (
          <ContentRow
            title={`Because You Watched ${secondSeed.title}`}
            items={becauseSecondary}
            viewAllTo={`/${secondSeed.type || 'movie'}/${secondSeed.id}`}
          />
        )}
      </div>
    </div>
  );
}
