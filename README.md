# Priva

A cinematic movie, TV and anime streaming front-end — inspired by the layout of
primeshows.org, rebuilt from scratch as **Priva**.

Dark, full-bleed hero carousel, ranked top-10 rows, provider spotlights, critic
reviews, numbered playback servers and per-episode resume — all on one domain.

## Features

- **Home** — auto-rotating hero (transparent title logos from TMDB), continue
  watching, now playing, most viewed, streaming platform row, provider spotlight
  with series/movie toggle, ranked top-10 daily charts, anime spotlight, genre rows.
- **Browse** — Movies / TV Shows / Anime with genre chips, sort options and
  infinite scroll.
- **Detail** — backdrop hero, poster, action bar (play, trailer, download,
  watchlist, favourite), facts panel, production/network logos, full episode
  browser, cast, crew and "more like this".
- **Critics & media** — replaces the usual audience-review block with a critic
  scorecard (fresh/mixed verdict) plus expandable review cards pulled from TMDB.
- **Watch** — 16:9 player with three numbered servers, season/episode selector,
  up-next, start-over, download panel and automatic resume-point tracking from
  player `postMessage` events.
- **Search** — debounced multi-search across titles and people, filters, recent
  searches.
- **Library** — watchlist, favourites, continue watching and history. Synced to
  Firebase for signed-in members, kept in `localStorage` for guests.
- **Auth** — email/password, Google sign-in, password reset, guest mode.
- **Settings** — autoplay next, default server, subtitle preference, data controls.
- **Responsive + accessible** — mobile sheet nav, mobile search overlay, keyboard
  focus states, `prefers-reduced-motion` support.

Live TV, sports and games sections are intentionally excluded.

## Stack

- Vite 6 + React 19 + React Router 6
- Tailwind CSS 3 (custom design tokens, keyframes, scroll-reveal)
- Firebase Auth + Firestore
- TMDB API for all metadata and artwork
- Lucide icons

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

Optional environment variables (`.env`). Working defaults are baked in, so the
app runs without any config:

```
VITE_TMDB_API_KEY=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

## Firebase

Project `priva-movies`. Authentication must have **Email/Password** and
**Google** enabled, and the deployed domain added under *Authentication →
Settings → Authorized domains*.

Library data is stored at `users/{uid}`:

```
{
  name, email, createdAt,
  myList: [{ id, type, title, poster, backdrop, rating, year, addedAt }],
  favorites: [...],
  history: [{ id, type, title, progress, timestamp, duration, season, episode, updatedAt }],
  settings: { autoplayNext, preferredServer, subtitles }
}
```

Suggested Firestore rules (per-user access only):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Player servers

Three embed providers are wired up in `src/lib/sources.js`. The UI only ever
labels them **Server 1 / 2 / 3** — provider names are never rendered.

- Movies: `.../embed/movie/{tmdbId}`
- TV: `.../embed/tv/{tmdbId}/{season}/{episode}`

Server 1 accepts theme/branding, resume position, episode selector and autoplay
flags; server 2 accepts start time and episode selector; server 3 accepts start
time. Progress events are parsed from all three and written to the library.

Downloads open `dl.vidsrc.party` and `vidvault.to` in a new tab, where quality is
chosen.

## Notes

- Priva hosts no video files. Playback and downloads are handled by independent
  third-party services; only stream or download content you have the right to access.
- Metadata, artwork and ratings are supplied by TMDB. This product uses the TMDB
  API but is not endorsed or certified by TMDB.

© 2026 Priva
