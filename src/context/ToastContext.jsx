import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Check, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, kind = 'success') => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((list) => [...list.slice(-2), { id, message, kind }]);
      window.setTimeout(() => dismiss(id), 2800);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/10 bg-ink-800/95 py-2.5 pl-3.5 pr-3 text-sm text-white shadow-card backdrop-blur animate-fadeUp"
          >
            <span
              className={
                t.kind === 'info'
                  ? 'text-brand-400'
                  : t.kind === 'error'
                    ? 'text-red-400'
                    : 'text-emerald-400'
              }
            >
              {t.kind === 'info' ? <Info size={16} /> : <Check size={16} />}
            </span>
            <span className="max-w-[70vw] truncate">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
