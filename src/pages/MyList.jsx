import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, HeartOff, ListPlus } from 'lucide-react';
import MediaGrid from '../components/MediaGrid';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { useReveal } from '../hooks/useReveal';
import { cx } from '../lib/utils';

export default function MyList() {
  const { myList, favorites, removeFromList, removeFromFavorites } = useLibrary();
  const { toast } = useToast();
  const [tab, setTab] = useState('list');
  useReveal([tab, myList.length, favorites.length]);

  const items = tab === 'list' ? myList : favorites;

  const handleRemove = (item) => {
    if (tab === 'list') {
      removeFromList(item);
      toast(`Removed "${item.title}" from your watchlist`, 'info');
    } else {
      removeFromFavorites(item);
      toast(`Removed "${item.title}" from favourites`, 'info');
    }
  };

  return (
    <div className="container-page pb-14 pt-[104px]">
      <header className="mb-6" data-reveal>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] sm:text-[40px]">My List</h1>
        <p className="mt-2 text-[13.5px] text-white/45">
          Everything you saved for later, synced with your account. Hover a poster and tap × to remove it.
        </p>
      </header>

      <div className="mb-6 flex items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1 sm:w-fit" data-reveal>
        {[
          { id: 'list', label: `Watchlist · ${myList.length}`, icon: ListPlus },
          { id: 'favorites', label: `Favourites · ${favorites.length}`, icon: Heart },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition sm:flex-none',
              tab === id ? 'bg-white text-ink-950' : 'text-white/55 hover:text-white'
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {items.length > 0 ? (
        <MediaGrid items={items.map((i) => ({ ...i, type: i.type }))} />
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-20 text-center" data-reveal>
          <HeartOff size={26} className="mb-3 text-white/20" />
          <p className="text-[15px] font-semibold text-white/70">
            {tab === 'list' ? 'Your watchlist is empty' : 'No favourites yet'}
          </p>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/35">
            {tab === 'list'
              ? 'Tap the + button on any movie or series and it will show up here.'
              : 'Mark titles you love with the heart icon to build your collection.'}
          </p>
          <Link to="/movies" className="btn-primary mt-6">
            Browse movies
          </Link>
        </div>
      )}
    </div>
  );
}
