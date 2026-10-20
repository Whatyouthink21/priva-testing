import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import Modal from './Modal';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ERROR_MESSAGES = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/missing-password': 'Enter your password.',
  'auth/weak-password': 'Use at least 6 characters for your password.',
  'auth/email-already-in-use': 'An account with this email already exists — try signing in.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the Google popup. Allow popups and retry.',
  'auth/unauthorized-domain': 'This domain is not authorised in Firebase Auth yet.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
  'auth/network-request-failed': 'Network error — check your connection.',
};

export default function AuthModal() {
  const { signIn, signUp, signInWithGoogle, resetPassword, continueAsGuest } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handler = (e) => {
      setMode(e.detail?.mode === 'signup' ? 'signup' : 'signin');
      setOpen(true);
      setError('');
      setNotice('');
    };
    window.addEventListener('priva:auth', handler);
    return () => window.removeEventListener('priva:auth', handler);
  }, []);

  const close = () => {
    if (busy) return;
    setOpen(false);
    setPassword('');
    setError('');
    setNotice('');
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, name.trim());
        toast('Welcome to Priva — your account is ready.');
      } else {
        await signIn(email.trim(), password);
        toast('Welcome back.');
      }
      setOpen(false);
      setPassword('');
    } catch (err) {
      setError(ERROR_MESSAGES[err?.code] || err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
      toast('Signed in with Google.');
      setOpen(false);
    } catch (err) {
      setError(ERROR_MESSAGES[err?.code] || err?.message || 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setError('Enter your email first, then choose “Forgot password”.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setNotice('Password reset link sent — check your inbox.');
    } catch (err) {
      setError(ERROR_MESSAGES[err?.code] || err?.message || 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={close} labelledBy="auth-title" className="max-w-[420px]">
      <div className="mb-6 flex flex-col items-start gap-3">
        <Logo />
        <div>
          <h2 id="auth-title" className="text-[22px] font-bold tracking-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-white/45">
            {mode === 'signin'
              ? 'Sign in to sync your list, favourites and watch progress across devices.'
              : 'One account keeps your list, history and resume points in sync.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="btn-ghost w-full py-3 text-sm disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.55-5.17 3.55-8.87Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.29a7.21 7.21 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-white/25">
        <span className="h-px flex-1 bg-white/10" />
        or use email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <Field icon={User}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </Field>
        )}

        <Field icon={Mail}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="email"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
        </Field>

        <Field icon={Lock}>
          <input
            type={showPass ? 'text' : 'password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            aria-label={showPass ? 'Hide password' : 'Show password'}
            className="text-white/35 transition hover:text-white"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </Field>

        {mode === 'signin' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="text-[12px] font-medium text-white/45 transition hover:text-brand-400"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-300">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[12.5px] text-emerald-300">
            {notice}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-brand w-full py-3 disabled:opacity-60">
          {busy && <Loader2 size={16} className="animate-spin" />}
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-[12.5px] text-white/45">
        {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
          className="font-semibold text-white underline-offset-4 hover:underline"
        >
          {mode === 'signin' ? 'Sign up' : 'Sign in'}
        </button>
      </p>

      <button
        onClick={() => {
          continueAsGuest();
          toast('Browsing as a guest — your list is saved on this device.', 'info');
          setOpen(false);
        }}
        className="mt-2 w-full text-center text-[12px] text-white/30 transition hover:text-white/60"
      >
        Continue as guest
      </button>
    </Modal>
  );
}

function Field({ icon: Icon, children }) {
  return (
    <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 transition focus-within:border-brand-500/70 focus-within:bg-white/[0.06]">
      <Icon size={16} className="shrink-0 text-white/35" />
      {children}
    </label>
  );
}
