import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import Modal from './Modal';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const FRIENDLY_ERRORS = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/missing-password': 'Please enter your password.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed.',
  'auth/popup-blocked': 'Browser blocked the sign-in popup. Use email & password or allow popups.',
  'auth/unauthorized-domain':
    'Google OAuth requires authorizing this preview domain in Firebase Console — use Email & Password sign-in right below.',
};

export default function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    closeAuthModal,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
  } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState(authModalMode || 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    setMode(authModalMode || 'signin');
    setError('');
    setInfo('');
  }, [authModalMode, authModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, name.trim());
        toast('Account created — synced with Priva Cloud!');
      } else {
        await signIn(email.trim(), password);
        toast('Welcome back to Priva!');
      }
      setPassword('');
      closeAuthModal();
    } catch (err) {
      setError(FRIENDLY_ERRORS[err?.code] || err?.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setInfo('');
    setBusy(true);
    try {
      await signInWithGoogle();
      toast('Signed in to Priva!');
      closeAuthModal();
    } catch (err) {
      setError(FRIENDLY_ERRORS[err?.code] || err?.message || 'Google sign-in unavailable.');
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      setError('Enter your email above first, then click Forgot password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setInfo('Password reset link sent to your email.');
    } catch (err) {
      setError(FRIENDLY_ERRORS[err?.code] || err?.message || 'Could not send reset email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={authModalOpen} onClose={closeAuthModal} maxWidth="max-w-[430px]">
      <div className="mb-5">
        <Logo size="md" />
        <h2 className="mt-4 font-display text-[23px] font-extrabold tracking-[-0.02em] text-white">
          {mode === 'signin' ? 'Log in to Priva' : 'Create your Priva account'}
        </h2>
        <p className="mt-1 text-[13px] text-[#8f98b2]">
          Sync Continue Watching, My List, and personalized recommendations across devices.
        </p>
      </div>

      {/* Mode Switch Tabs */}
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-[#0f1014] p-1 ring-1 ring-white/[0.07]">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setError('');
            setInfo('');
          }}
          className={`rounded-lg py-2 text-[13px] font-semibold transition ${
            mode === 'signin' ? 'bg-[#222636] text-white shadow' : 'text-[#8f98b2] hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError('');
            setInfo('');
          }}
          className={`rounded-lg py-2 text-[13px] font-semibold transition ${
            mode === 'signup' ? 'bg-[#222636] text-white shadow' : 'text-[#8f98b2] hover:text-white'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8f98b2]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Profile name"
              required
              className="h-11 w-full rounded-xl border border-white/[0.09] bg-[#0f1014] pl-10 pr-4 text-[14px] text-white placeholder-[#6b738b] focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8f98b2]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-white/[0.09] bg-[#0f1014] pl-10 pr-4 text-[14px] text-white placeholder-[#6b738b] focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8f98b2]" />
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 6 characters)"
            required
            minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="h-11 w-full rounded-xl border border-white/[0.09] bg-[#0f1014] pl-10 pr-11 text-[14px] text-white placeholder-[#6b738b] focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            aria-label="Toggle password visibility"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f98b2] hover:text-white"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {mode === 'signin' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgot}
              className="text-[12px] font-medium text-blue-400 hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-[12.5px] text-red-300">
            {error}
          </div>
        )}

        {info && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-[12.5px] text-emerald-300">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-priva-blue flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14.5px] font-bold text-white disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          <span>{mode === 'signin' ? 'Log In' : 'Create Account'}</span>
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-[11.5px] text-[#6b738b]">
        <span className="h-px flex-1 bg-white/[0.08]" />
        <span>OR</span>
        <span className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.1] bg-white/[0.05] text-[13.5px] font-semibold text-white transition hover:bg-white/[0.1] disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.09z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.09c.95-2.85 3.6-4.96 6.72-4.96z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>
    </Modal>
  );
}
