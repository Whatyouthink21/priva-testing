import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import Modal from './Modal';

const KEY = 'priva:ad-notice:last-shown';
const INTERVAL = 12 * 60 * 60 * 1000;
export default function AdNotice() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    let memoryLast = 0;
    const check = () => {
      if (document.visibilityState === 'hidden') return;
      let last = memoryLast;
      try { last = Number(localStorage.getItem(KEY)) || last; } catch { /* Storage may be disabled. */ }
      if (Date.now() - last < INTERVAL) return;
      memoryLast = Date.now();
      try { localStorage.setItem(KEY, String(memoryLast)); } catch { /* Use this session's timestamp. */ }
      setOpen(true);
    };
    check();
    const timer = window.setInterval(check, 30000);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', check); };
  }, []);
  return (
    <Modal open={open} onClose={close} maxWidth="max-w-[500px]">
      <ShieldCheck size={34} className="mb-5 text-blue-400" />
      <h2 className="font-display text-2xl font-bold text-white">A better viewing experience</h2>
      <p className="mt-3 text-sm leading-relaxed text-[#8f98b2]">Priva does not have ads, but third-party sources may show them. Here’s how to reduce interruptions:</p>
      <div className="mt-5 space-y-3">
        <a href="https://chromewebstore.google.com/detail/adguard-adblocker/bgnkhhnnamicmpeenaelnjfhikgbkllg?pli=1" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
          <span><strong className="block text-sm text-white">Windows · Chrome</strong><span className="text-xs text-[#8f98b2]">Install AdGuard AdBlocker</span></span><ExternalLink size={17} />
        </a>
        <a href="https://brave.com/download/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
          <span><strong className="block text-sm text-white">Mobile</strong><span className="text-xs text-[#8f98b2]">Use Brave browser for built-in ad blocking</span></span><ExternalLink size={17} />
        </a>
      </div>
      <button autoFocus onClick={close} className="btn-priva-blue mt-6 w-full rounded-xl px-4 py-3 text-sm font-bold text-white">Got it</button>
      <p className="mt-3 text-center text-xs text-[#8f98b2]">This reminder appears once every 12 hours.</p>
    </Modal>
  );
}
