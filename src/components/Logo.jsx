import { Link } from 'react-router-dom';
import { cx } from '../lib/utils';

export default function Logo({ to = '/', className, compact = false }) {
  return (
    <Link
      to={to}
      aria-label="Priva home"
      className={cx('group inline-flex items-center gap-2.5', className)}
    >
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[11px] bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 shadow-[0_8px_24px_-8px_rgba(139,92,246,0.9)] transition duration-500 group-hover:rounded-[14px]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-[1px] fill-white">
          <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l11-6.8a1 1 0 0 0 0-1.7l-11-6.8A1 1 0 0 0 8 5.2Z" />
        </svg>
        <span className="pointer-events-none absolute -inset-6 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_55%)] opacity-0 transition duration-500 group-hover:opacity-100" />
      </span>
      {!compact && (
        <span className="text-[22px] font-extrabold tracking-tight text-white">
          Priva<span className="text-brand-400">.</span>
        </span>
      )}
    </Link>
  );
}
