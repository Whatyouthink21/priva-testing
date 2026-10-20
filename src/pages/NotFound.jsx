import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[80vh] place-items-center pt-24 text-center">
      <div>
        <p className="font-display text-[92px] leading-none text-white/10 sm:text-[130px]">404</p>
        <h1 className="mt-2 flex items-center justify-center gap-2 text-[22px] font-bold sm:text-[26px]">
          <Compass size={20} className="text-brand-400" />
          This scene doesn't exist
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-white/40">
          The page you were looking for has left the building. Let's find you something to
          watch instead.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link to="/" className="btn-primary">
            Back home
          </Link>
          <Link to="/movies" className="btn-ghost">
            Browse movies
          </Link>
        </div>
      </div>
    </div>
  );
}
