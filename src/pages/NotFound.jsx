import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[82vh] flex-col items-center justify-center px-6 text-center lg:pl-[108px]">
      <span className="rounded-full bg-blue-500/15 px-3.5 py-1 text-[12px] font-bold uppercase tracking-widest text-blue-400">
        Error 404
      </span>
      <h1 className="mt-3 font-display text-[44px] font-black tracking-[-0.03em] text-white sm:text-[56px]">
        Page not found.
      </h1>
      <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-[#8f98b2]">
        The page you are looking for does not exist or may have moved to another section of Priva.
      </p>
      <Link
        to="/home"
        className="btn-priva-blue mt-7 rounded-xl px-7 py-3.5 text-[14.5px] font-bold text-white"
      >
        Back to Home
      </Link>
    </div>
  );
}
