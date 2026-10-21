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
- **Watch** — 16:9 player with four numbered servers plus a dedicated anime server (Sub/Dub), season/episode selector,
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

## Theme

The base UI is electric blue, driven entirely by CSS custom properties
(`--brand`, `--brand-400`, `--brand-600`, `--accent-2/3/4`) so the palette can be
changed in one place (`src/index.css`).

**Every movie / TV page re-tints itself from its own artwork.** The hero uses a
`mix-blend-mode: color` hue grade built from four sampled colours, reinforced by a
screen-blended light wash and an aurora further down the page, so the whole page
reads as that title's palette. When a title
loads, its poster is sampled on a canvas (`src/lib/palette.js`): pixels are
bucketed by hue, filtered for saturation and brightness, and four well-separated
colours are kept. Those colours become the page's brand tokens plus a
multi-colour mesh wash over the hero, the page background and the player, so
*Spider-Man* feels red/blue, *Dune* sandy, *Arcade* neon — automatically, with no
per-title configuration. Palettes are cached per image URL. If the CDN blocks canvas reads, the poster is
re-fetched through an image proxy (`wsrv.nl`) before giving up, and only then does
the page fall back to the blue theme. Greyscale artwork gets a muted steel tint
instead of an invented rainbow.

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

Four numbered servers plus an anime server are wired up in
`src/lib/sources.js`. The UI only ever labels them **Server 1 / 2 / 3 / 4** and
**Anime** — provider names are never rendered.

- Servers 1–3 — embed players addressed by TMDB id:
  `.../embed/movie/{tmdbId}`, `.../embed/tv/{tmdbId}/{season}/{episode}`.
  Server 1 accepts theme/branding, resume position, episode selector and
  autoplay flags; server 2 accepts start time and episode selector; server 3
  accepts start time.
- Server 4 — a full watch page embedded as-is
  (`bingr.one/watch/movie/{tmdbId}`, `.../watch/tv/{tmdbId}/{season}/{episode}`);
  upstream offers no clean embed endpoint.
- Anime — shown first, and selected automatically, on Japanese animation
  titles. TMDB ids are mapped to AniList/MAL ids by `src/lib/anime.js`
  (AniList search, cached locally), then played via
  `megaplay.buzz/stream/ani/{anilistId}/{episode}/{sub|dub}` with a Sub/Dub
  toggle. Unmapped titles fall back to the numbered servers.

Continue Watching no longer depends on a single player's cooperation: a title
enters history as soon as its watch page opens, player `postMessage` progress
is parsed in all common dialects (fractions normalised to percent, nested
payloads unwrapped), a watch-time estimator covers silent players, and guest
saves hit `localStorage` synchronously plus on `pagehide`, so closing the tab
can't lose the last resume point.

Downloads open `dl.vidsrc.party` and `vidvault.to` in a new tab, where quality is
chosen.

## Notes

- Priva hosts no video files. Playback and downloads are handled by independent
  third-party services; only stream or download content you have the right to access.
- Metadata, artwork and ratings are supplied by TMDB. This product uses the TMDB
  API but is not endorsed or certified by TMDB.

© 2026 Priva
