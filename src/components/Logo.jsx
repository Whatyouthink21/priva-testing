import { Link } from 'react-router-dom';

export default function Logo({ showText = true, size = 'md', className = '' }) {
  const iconDim = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const textSize = size === 'lg' ? 'text-[25px]' : size === 'sm' ? 'text-[18px]' : 'text-[20px]';

  return (
    <Link
      to="/home"
      aria-label="Priva Home"
      className={`group inline-flex items-center gap-2.5 select-none ${className}`}
    >
      <span
        className={`relative grid ${iconDim} shrink-0 place-items-center rounded-[11px] border border-white/[0.13] bg-gradient-to-br from-[#1b2030] to-[#0f1014] shadow-[0_6px_22px_rgba(0,0,0,0.65)] transition-transform duration-200 group-hover:scale-105 group-hover:border-white/25`}
      >
        <svg viewBox="0 0 64 64" fill="none" className="h-[68%] w-[68%]">
          <defs>
            <linearGradient
              id="privaPrismGrad"
              x1="26"
              y1="18"
              x2="48"
              y2="38"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <rect x="16" y="13" width="8" height="38" rx="4" fill="#ffffff" />
          <path
            d="M28.5 15.2C28.5 13.92 29.9 13.14 30.98 13.81L47.2 23.85C48.24 24.49 48.24 26.01 47.2 26.65L30.98 36.69C29.9 37.36 28.5 36.58 28.5 35.3V15.2Z"
            fill="url(#privaPrismGrad)"
          />
          <path
            d="M28.5 15.2C28.5 13.92 29.9 13.14 30.98 13.81L40.3 19.58L28.5 26.9V15.2Z"
            fill="#ffffff"
            fillOpacity="0.95"
          />
        </svg>
      </span>
      {showText && (
        <span
          className={`font-display ${textSize} font-extrabold tracking-[-0.03em] text-white`}
        >
          Priva
        </span>
      )}
    </Link>
  );
}
