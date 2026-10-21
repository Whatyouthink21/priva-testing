import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, children, maxWidth = 'max-w-[440px]' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />
      <div
        className={`relative z-10 w-full ${maxWidth} overflow-hidden rounded-2xl border border-white/[0.1] bg-[#16181f] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.9)] animate-pop-card`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/70 transition hover:bg-white/[0.15] hover:text-white"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}
