import { Link } from 'react-router-dom';
import { cx } from '../lib/utils';

export default function Logo({ to = '/', className, compact = false }) {
  return (
    <Link to={to} aria-label="Priva home" className={cx('inline-flex items-center gap-2', className)}>
      <span className="grid h-7 w-7 place-items-center rounded-md bg-white text-black">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-black">
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10-6.5a1 1 0 0 0 0-1.72l-10-6.5A1 1 0 0 0 8 5.5Z" />
        </svg>
      </span>
      {!compact && (
        <span className="text-[20px] font-black tracking-tighter text-white">PRIVA</span>
      )}
    </Link>
  );
}
