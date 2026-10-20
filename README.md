# PRIVA — CineJoy-inspired Streaming Discovery

**PRIVA** is a modern, CineJoy-inspired streaming discovery site built with React + Vite, Tailwind CSS, TMDB API, Firebase Firestore, and embedded players from TGVID & VidStuck.

> UI closely follows [cinejoy.pk](https://cinejoy.pk) screenshots: hero carousel, Continue Watching, Browse by Provider, provider pages, search, detail with cast/crew, production companies, download sources, and auth via 5-digit code stored in Firestore.

## Features

- **Hero Carousel** with backdrop, rating (★ 6.9/10), year, genres, overview, Play / + List / Info, auto-rotate + dots
- **Continue Watching** with progress bars & time-left
- **Browse by Provider** (Netflix, Prime Video, Disney+, Apple TV+, Apple TV, Hulu, HBO Max, Paramount+, Peacock, Crunchyroll, STARZ, AMC+, MGM+)
- **Provider Pages** — Movies/Series toggle, green swirly header like CineJoy, filtered via `discover` + `with_watch_providers`
- **Because you watched / Trending / Popular rows** — horizontal scroll with hover-expand card (Play / + / Info, progress)
- **Search** — “Discover something new” with chips, Trending Today, multi-search for movies/tv/people
- **Detail Pages** — Backdrop hero, poster, TMDB rating, year, runtime, genres, production companies (with logos), cast/crew grids → Person pages, trailer (YouTube), recommendations, similar, download drawer
- **Person Pages** — biography, filmography, photos via TMDB person API
- **Player** — iframe embed with source switcher:
  - `https://tgvid.lovable.app/embed/movie/{tmdbId}` and `tv/{id}/{s}/{e}`
  - `https://vidstuck.cc/embed/movie/{id}` and `tv/{id}/{s}/{e}`
  - Season/episode selector, real-time progress via `postMessage` → stored in localStorage + context
- **Downloads** — direct links to `https://dl.vidsrc.party/movie/{id}` and `https://vidvault.to/...` with quality options (1080p/720p/480p, mp4/mkv)
- **My List & Watch History** — localStorage per code, synced to UI
- **Auth** — 5-digit code generated randomly, stored in Firestore collection `priva_users` (doc id = code). Login verifies existence. Guest fallback to localStorage.
- **Settings dropdown** — Login/Register, Settings, Watch History (no Shorts)
- **Modals** — Create account (5-digit, Cloudflare-style verifying) + Welcome back (enter code)
- **Mobile + Desktop optimized** — responsive navbar, hamburger, stacked hero, scroll-snap rows
- **New PRIVA icon** — white rounded square with P+play, distinct from CineJoy clapper

## Tech Stack

- Vite + React 19 + React Router 6
- Tailwind CSS 3
- Firebase JS SDK 11 (Firestore)
- TMDB API `a45420333457411e78d5ad35d6c51a2d`
- Lucide React icons
- Embedded players: TGVID, VidStuck

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Firebase

Config from user prompt (project `priva-movies`). Firestore collection:

```
priva_users/{5-digit-code} {
  code: "12345",
  createdAt: serverTimestamp(),
  myList: [],
  watchHistory: []
}
```

AuthContext generates `10000-99999`, checks existence, writes doc. Login reads doc.

## Deployment Notes

- Ensure Firestore rules allow read/write to `priva_users` (for this demo, open for testing):
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /priva_users/{code} {
        allow read, write: if true;
      }
    }
  }
  ```
- TMDB images via `https://image.tmdb.org/t/p/`
- No backend required — Firestore + TMDB + iframes only.

## Credits

- TMDB for data
- TGVID & VidStuck for players
- dl.vidsrc.party & vidvault.to for download links
- Inspired by CineJoy UI

© 2026 PRIVA
