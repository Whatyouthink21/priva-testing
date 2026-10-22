import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import CatalogPage from './pages/CatalogPage';
import Explore from './pages/Explore';
import Categories from './pages/Categories';
import Discover from './pages/Discover';
import MySpace from './pages/MySpace';
import AuthPage from './pages/AuthPage';
import Detail from './pages/Detail';
import Watch from './pages/Watch';
import Person from './pages/Person';
import Help from './pages/Help';
import Announcements from './pages/Announcements';
import AdNotice from './components/AdNotice';
import NotFound from './pages/NotFound';

export default function App() {
  const location = useLocation();
  const isWatchPage = location.pathname.startsWith('/watch/');
  const isAuthPage =
    location.pathname === '/auth' ||
    location.pathname === '/login' ||
    location.pathname === '/signup';
  const hideChrome = isWatchPage || isAuthPage;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0f1014] text-[#e1e6f0]">
      <AdNotice />
      {!hideChrome && <Sidebar />}

      <main className="flex-1">
        <ErrorBoundary key={location.pathname}>
          <div key={location.pathname} className="animate-page-fade">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />

              <Route path="/auth" element={<AuthPage defaultMode="signin" />} />
              <Route path="/login" element={<AuthPage defaultMode="signin" />} />
              <Route path="/signup" element={<AuthPage defaultMode="signup" />} />

              <Route path="/explore" element={<Explore />} />
              <Route path="/search" element={<Explore />} />

              <Route path="/movies" element={<CatalogPage key="movie" kind="movie" />} />
              <Route path="/tv" element={<CatalogPage key="tv" kind="tv" />} />
              <Route path="/anime" element={<CatalogPage key="anime" kind="anime" />} />

              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:slug" element={<Discover mode="category" />} />
              <Route path="/discover" element={<Discover mode="discover" />} />
              <Route path="/discover/:media" element={<Discover mode="discover" />} />

              <Route path="/announcements" element={<Announcements />} />
              <Route path="/space" element={<MySpace />} />
              <Route path="/my-space" element={<Navigate to="/space" replace />} />
              <Route path="/my-list" element={<Navigate to="/space" replace />} />

              <Route path="/movie/:id" element={<Detail key="detail-movie" type="movie" />} />
              <Route path="/tv/:id" element={<Detail key="detail-tv" type="tv" />} />
              <Route path="/anime/:id" element={<Detail key="detail-anime" type="tv" />} />

              <Route path="/watch/movie/:id" element={<Watch type="movie" />} />
              <Route path="/watch/tv/:id" element={<Watch type="tv" />} />
              <Route path="/watch/tv/:id/:season/:episode" element={<Watch type="tv" />} />
              <Route path="/watch/anime/:id" element={<Watch type="tv" />} />
              <Route path="/watch/anime/:id/:season/:episode" element={<Watch type="tv" />} />

              <Route path="/person/:id" element={<Person />} />

              <Route path="/help" element={<Help />} />
              <Route path="/legal/:section" element={<Help />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </main>

      {!hideChrome && <Footer />}
    </div>
  );
}
