import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Trending from './pages/Trending';
import Browse from './pages/Browse';
import Detail from './pages/Detail';
import Watch from './pages/Watch';
import Search from './pages/Search';
import Person from './pages/Person';
import MyList from './pages/MyList';
import HistoryPage from './pages/History';
import Settings from './pages/Settings';
import Platforms from './pages/Platforms';
import ProviderPage from './pages/Provider';
import Static from './pages/Static';
import NotFound from './pages/NotFound';
import { useReveal } from './hooks/useReveal';

export default function App() {
  const location = useLocation();
  useReveal([location.pathname]);

  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b]">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/movies" element={<Browse kind="movie" />} />
          <Route path="/tv" element={<Browse kind="tv" />} />
          <Route path="/anime" element={<Browse kind="anime" />} />

          <Route path="/movie/:id" element={<Detail type="movie" />} />
          <Route path="/tv/:id" element={<Detail type="tv" />} />

          {/* Watch routes - support slug in id and bingr-style season/episode path */}
          <Route path="/watch/movie/:id" element={<Watch type="movie" />} />
          <Route path="/watch/tv/:id" element={<Watch type="tv" />} />
          <Route path="/watch/tv/:id/:season/:episode" element={<Watch type="tv" />} />

          <Route path="/person/:id" element={<Person />} />

          <Route path="/search" element={<Search />} />
          <Route path="/platforms" element={<Platforms />} />
          <Route path="/provider/:id" element={<ProviderPage />} />

          <Route path="/my-list" element={<MyList />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="/about" element={<Static page="about" />} />
          <Route path="/faq" element={<Static page="faq" />} />
          <Route path="/contact" element={<Static page="contact" />} />
          <Route path="/privacy" element={<Static page="privacy" />} />
          <Route path="/terms" element={<Static page="terms" />} />
          <Route path="/dmca" element={<Static page="dmca" />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
