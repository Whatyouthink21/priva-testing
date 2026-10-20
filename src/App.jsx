import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Shows from "./pages/Shows";
import MyList from "./pages/MyList";
import SearchPage from "./pages/Search";
import ProviderPage from "./pages/Provider";
import Detail from "./pages/Detail";
import Watch from "./pages/Watch";
import Person from "./pages/Person";
import History from "./pages/History";
import Settings from "./pages/Settings";

import { AuthProvider } from "./context/AuthContext";
import { ListProvider } from "./context/ListContext";
import { WatchHistoryProvider } from "./context/WatchHistoryContext";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(()=> { window.scrollTo(0,0); }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center pt-[64px] px-4 text-center">
      <h1 className="text-3xl font-bold">This page doesn't exist</h1>
      <p className="text-sm text-white/50 mt-2">It may have been moved, removed, or never existed.</p>
      <Link to="/" className="mt-6 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm">Go home</Link>
    </div>
  )
}

function AppShell() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("register");
  const openAuth = (tab="register") => { setAuthTab(tab); setAuthOpen(true); };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar onOpenAuth={openAuth} />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/shows" element={<Shows />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/provider/:id" element={<ProviderPage />} />
        <Route path="/movie/:id" element={<Detail forcedType="movie" />} />
        <Route path="/tv/:id" element={<Detail forcedType="tv" />} />
        <Route path="/:type/:id" element={<Detail />} />
        <Route path="/watch/:type/:id" element={<Watch />} />
        <Route path="/watch/:type/:id/:season/:episode" element={<Watch />} />
        <Route path="/person/:id" element={<Person />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AuthModal isOpen={authOpen} onClose={()=> setAuthOpen(false)} initialTab={authTab} />

      <footer className="border-t border-white/5 bg-[#080808] py-10">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
                  <span className="font-black text-black text-sm">P</span>
                </div>
                <span className="font-black tracking-tight">PRIVA</span>
              </div>
              <p className="text-xs text-white/40 mt-2 max-w-[480px]">PRIVA is a streaming discovery platform. We do not host any video content. All streams are embedded via third-party providers (Server 1 / Server 2). Downloads are via external APIs (dl.vidsrc.party, vidvault.to). TMDB data powers our catalog. Your 5-digit login is stored securely in Firebase Firestore.</p>
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <div className="font-semibold text-white">Browse</div>
                <div className="mt-2 space-y-1 text-white/50">
                  <div><a href="/" className="hover:text-white">Home</a></div>
                  <div><a href="/movies" className="hover:text-white">Movies</a></div>
                  <div><a href="/shows" className="hover:text-white">Shows</a></div>
                  <div><a href="/my-list" className="hover:text-white">My List</a></div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-white">Support</div>
                <div className="mt-2 space-y-1 text-white/50">
                  <div><a href="/history" className="hover:text-white">Watch History</a></div>
                  <div><a href="/settings" className="hover:text-white">Settings</a></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 text-xs text-white/20 flex flex-col md:flex-row justify-between gap-2">
            <span>© 2026 PRIVA. Made for fans of cinema.</span>
            <span>TMDB • Firebase • Server 1 • Server 2 • dl.vidsrc.party</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ListProvider>
          <WatchHistoryProvider>
            <AppShell />
          </WatchHistoryProvider>
        </ListProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
