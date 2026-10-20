import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '../lib/utils';

export default function Modal({ open, onClose, children, className, labelledBy }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm animate-fadeIn"
      />
      <div
        className={cx(
          'relative z-10 w-full max-w-md rounded-t-3xl border border-white/10 bg-ink-900 p-6 shadow-card animate-fadeUp sm:rounded-3xl sm:p-7',
          className
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
