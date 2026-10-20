import { Link } from 'react-router-dom';
import { Check, LogOut, Shield, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { openAuth } from '../lib/ui';
import { useReveal } from '../hooks/useReveal';
import { cx } from '../lib/utils';
import { PLAYERS } from '../lib/sources';

const SUBTITLES = [
  { id: 'english', label: 'English' },
  { id: 'hindi', label: 'Hindi' },
  { id: 'spanish', label: 'Spanish' },
  { id: 'french', label: 'French' },
  { id: '', label: 'Off' },
];

export default function Settings() {
  const { isSignedIn, displayName, user, guest, signOut } = useAuth();
  const { settings, updateSettings, clearHistory, history, myList, favorites } = useLibrary();
  const { toast } = useToast();
  useReveal();

  return (
    <div className="container-page max-w-4xl pb-16 pt-[104px]">
      <header className="mb-8" data-reveal>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] sm:text-[40px]">Settings</h1>
        <p className="mt-2 text-[13.5px] text-white/45">
          Account, playback preferences and your data.
        </p>
      </header>

      {/* Account */}
      <section className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5" data-reveal>
        <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold">
          <UserRound size={16} className="text-brand-400" /> Account
        </h2>

        {isSignedIn ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold">
              {(displayName || user?.email || 'P').slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">{displayName || 'Priva member'}</p>
              <p className="truncate text-[12px] text-white/40">{user?.email}</p>
              <p className="mt-1 text-[11px] text-white/25">
                {myList.length} in watchlist · {favorites.length} favourites · {history.length} watched
              </p>
            </div>
            <button
              onClick={async () => {
                await signOut();
                toast('Signed out.', 'info');
              }}
              className="btn-ghost ml-auto py-2.5"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-semibold">
                {guest ? 'You are browsing as a guest' : 'No account connected'}
              </p>
              <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-white/40">
                Sign in to keep your list, favourites and resume points on every device.
                Guest data stays in this browser only.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openAuth('signin')} className="btn-ghost py-2.5">
                Sign in
              </button>
              <button onClick={() => openAuth('signup')} className="btn-brand py-2.5">
                Create account
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Playback */}
      <section className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5" data-reveal>
        <h2 className="mb-1 flex items-center gap-2 text-[15px] font-bold">
          <Sparkles size={16} className="text-brand-400" /> Playback
        </h2>
        <p className="mb-5 text-[12px] text-white/35">These preferences apply to every player.</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13.5px] font-medium">Autoplay next episode</p>
              <p className="mt-0.5 text-[12px] text-white/35">
                Keep the binge going when an episode ends.
              </p>
            </div>
            <Toggle
              checked={settings.autoplayNext}
              onChange={(v) => {
                updateSettings({ autoplayNext: v });
                toast(`Autoplay ${v ? 'enabled' : 'disabled'}.`, 'info');
              }}
            />
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13.5px] font-medium">Default server</p>
              <p className="mt-0.5 text-[12px] text-white/35">
                Which source the player tries first.
              </p>
            </div>
            <div className="flex gap-1.5">
              {PLAYERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    updateSettings({ preferredServer: p.id });
                    toast(`Server ${p.id} set as default.`, 'info');
                  }}
                  className={cx(
                    'rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition',
                    settings.preferredServer === p.id
                      ? 'border-white bg-white text-ink-950'
                      : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white'
                  )}
                >
                  Server {p.id}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13.5px] font-medium">Preferred subtitles</p>
              <p className="mt-0.5 text-[12px] text-white/35">
                Passed to players that support it.
              </p>
            </div>
            <select
              value={settings.subtitles}
              onChange={(e) => updateSettings({ subtitles: e.target.value })}
              className="rounded-full border border-white/12 bg-ink-850 px-3.5 py-2 text-[12.5px] text-white/75 focus:border-brand-500 focus:outline-none"
            >
              {SUBTITLES.map((s) => (
                <option key={s.label} value={s.id} className="bg-ink-850">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5" data-reveal>
        <h2 className="mb-1 flex items-center gap-2 text-[15px] font-bold">
          <Shield size={16} className="text-brand-400" /> Your data
        </h2>
        <p className="mb-4 text-[12px] leading-relaxed text-white/35">
          {isSignedIn
            ? 'Saved to your Priva account (Firestore) and available on any device you sign into.'
            : 'Stored locally in this browser. Sign in to sync it to your account.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (window.confirm('Clear watch history and resume points?')) {
                clearHistory();
                toast('Watch history cleared.', 'info');
              }
            }}
            className="chip py-2 text-rose-300/80 hover:border-rose-400/40 hover:text-rose-200"
          >
            Clear watch history
          </button>
          <Link to="/my-list" className="chip py-2">
            Manage My List
          </Link>
          <Link to="/history" className="chip py-2">
            Review history
          </Link>
        </div>

        <div className="mt-5 grid gap-2 border-t border-white/[0.06] pt-4 text-[11.5px] text-white/25 sm:grid-cols-2">
          <p className="flex items-center gap-1.5">
            <Check size={12} className="text-emerald-400/70" /> Metadata and artwork by TMDB
          </p>
          <p className="flex items-center gap-1.5">
            <Check size={12} className="text-emerald-400/70" /> Authentication by Firebase
          </p>
        </div>
      </section>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
        checked ? 'bg-brand-500' : 'bg-white/15'
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}
