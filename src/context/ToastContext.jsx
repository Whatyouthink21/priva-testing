import { createContext, useCallback, useContext, useState } from 'react';
import { Check, Info, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const toast = useCallback((message, tone = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((prev) => [...prev.slice(-3), { id, message, tone }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 right-4 z-[120] flex flex-col gap-2.5 sm:bottom-6 sm:right-6"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border border-white/10 bg-[#191c26]/95 px-4 py-3 text-[13px] font-medium text-white shadow-[0_18px_45px_rgba(0,0,0,0.75)] backdrop-blur-xl animate-pop-card"
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                item.tone === 'error'
                  ? 'bg-red-500/20 text-red-400'
                  : item.tone === 'info'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-blue-500 text-white'
              }`}
            >
              {item.tone === 'error' ? (
                <AlertCircle size={12} />
              ) : item.tone === 'info' ? (
                <Info size={12} />
              ) : (
                <Check size={12} strokeWidth={3} />
              )}
            </span>
            <span>{item.message}</span>
            <button
              onClick={() => dismiss(item.id)}
              className="ml-1 text-white/40 transition hover:text-white"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
