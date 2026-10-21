import { Link } from 'react-router-dom';

export default function Logo({ showText = true, size = 'md', className = '' }) {
  const iconDim = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const textSize = size === 'lg' ? 'text-[24px]' : size === 'sm' ? 'text-[18px]' : 'text-[21px]';

  return (
    <Link
      to="/home"
      aria-label="Priva Home"
      className={`group inline-flex items-center gap-2.5 select-none ${className}`}
    >
      <span
        className={`relative grid ${iconDim} shrink-0 place-items-center rounded-[11px] bg-gradient-to-br from-[#38bdf8] via-[#2563eb] to-[#4f46e5] shadow-[0_6px_22px_rgba(37,99,235,0.5)] transition-transform duration-300 group-hover:scale-105`}
      >
        <svg viewBox="0 0 32 32" fill="none" className="h-[58%] w-[58%]">
          <path
            d="M10.5 7.8C10.5 6.62 11.79 5.9 12.8 6.51L24.6 13.71C25.57 14.3 25.57 15.7 24.6 16.29L12.8 23.49C11.79 24.1 10.5 23.38 10.5 22.2V7.8Z"
            fill="white"
          />
          <path
            d="M10.5 18.2L18.4 23.02L12.8 26.44C11.79 27.05 10.5 26.33 10.5 25.15V18.2Z"
            fill="white"
            fillOpacity="0.52"
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
