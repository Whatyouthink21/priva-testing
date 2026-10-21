import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import StudiosRow from '../components/StudiosRow';
import GenresRow from '../components/GenresRow';
import LanguagesRow from '../components/LanguagesRow';

export default function Categories() {
  useEffect(() => {
    document.title = 'Categories · Priva';
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1014] px-4 pt-16 sm:px-8 lg:pl-[108px] lg:pr-12 lg:pt-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-white sm:text-[34px]">
            Categories
          </h1>
          <p className="mt-1 text-[14px] text-[#8f98b2]">
            Explore by streaming studio, genre, or original language
          </p>
        </div>

        <Link
          to="/discover/movie"
          className="btn-priva-blue inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-bold text-white"
        >
          <Compass size={16} />
          <span>Open Priva Finds Filter</span>
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-[20px] font-bold text-white">Studios</h2>
        <StudiosRow grid />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-[20px] font-bold text-white">Popular Genres</h2>
        <GenresRow grid />
      </section>

      <section className="mb-6">
        <h2 className="mb-4 font-display text-[20px] font-bold text-white">Popular Languages</h2>
        <LanguagesRow grid />
      </section>
    </div>
  );
}
