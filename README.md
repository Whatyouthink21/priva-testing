# Priva

Stream movies, TV series, and anime with personalized cloud watchlists, live continue-watching resume timestamps, multi-server streaming (`Server 1`, `Server 2`, `Server 3`), and multi-source direct downloads (`Source 1`, `Source 2`).

## Features
- **Immersive Cinema UI (`#0f1014`)**: Collapsible left rail navigation (`My Space`, `Search`, `Home`, `TV`, `Anime`, `Movies`, `Categories`, `Priva Finds`), full-bleed parallax Hero banner with transparent title logos & interactive bottom-right thumbnail strip, Top 10 Ranked rows, Hover Pop-Out preview cards, Studios, Popular Genres, and Popular Languages.
- **My Space (`/space`)**:
  - Firebase Authentication (`Sign Up`, `Sign In`, `Reset Password`, `Google Sign-In`) + Cloud Firestore real-time sync (`priva-movies`).
  - **Continue Watching** with real-time `postMessage` playback progress capture and automatic episode/timestamp resume.
  - **My List** watchlist synced across devices.
  - **Because You Watched** personalized recommendations dynamically generated from watch history.
- **Numbered Streaming & Download Sources**:
  - Strictly numbered streaming servers (`Server 1`, `Server 2`, `Server 3`) with automatic resume offset & TV autoplay support.
  - Multi-quality direct downloads via `Source 1` and `Source 2`.

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

### v2.2 maintenance

- Edit release notes in `src/pages/Announcements.jsx`, under `EDIT ANNOUNCEMENTS HERE`.
- Server URL builders live in `src/lib/sources.js`: 1 = Bingr, 2 = Vidstuck, 3 = TGVID, 4 = frameXTV. Nxsha and Frost were removed. ANIME is selected automatically for anime; other titles start on Server 1.
- MegaPlay uses MAL IDs, not TMDB IDs. The unsupported ani.zip TMDB query has been replaced by a compact local mapping at `public/data/anime-mappings.json`. This includes film/TV distinctions, TMDB seasons, and episode offsets. Ambiguous or missing mappings expose a numbered-server fallback and optional manual MAL/episode controls; provider coverage is not guaranteed.
- Mapping source: [Fribb/anime-lists](https://github.com/Fribb/anime-lists), derived from its upstream anime ID mapping projects. Refresh with `python3 scripts/update-anime-mappings.py` (requires authenticated `gh`). Only numeric mapping fields are retained, not the full source dataset. Run `npm test` after refreshing.
- frameXTV uses the documented `/embed/{tmdbId}` and `/embed/{tmdbId}/{season}/{episode}` routes, with resume timestamps. 4K/language availability and third-party ad behavior depend on the source/title; badges are not guarantees.
- The ad notice stores its last-display time locally in the browser and checks every 30 seconds while the tab is visible. Clearing site storage resets the reminder.
- Validate actual third-party playback on the deployed site; build/unit tests do not verify external stream availability.

### v2.3 — AniList and later seasons

- Anime catalog now includes public AniList trending/current-season discovery. Requests go directly to `https://graphql.anilist.co`; no OAuth token, client ID, or client secret is needed for these public queries. This release does not add AniList login or private-list synchronization. **Never put OAuth client secrets into Vite environment variables or browser code.**
- AniList failures/rate limits display a retry state without blocking TMDB shelves. Metadata is cached in memory for five minutes. Catalog cards use a unique MAL→TMDB season mapping where available; otherwise they link to AniList rather than guessing a watch URL.
- Continuous series with a single MAL entry now accumulate prior regular-season episode counts (e.g. One Piece season 2 does not restart at MAL episode 1). Specials are excluded. Split-series use local season/cour mapping plus a bounded AniList sequel lookup and original episode air dates to accommodate differing season layouts. No match is guaranteed for every title/provider.
- Existing explicit season mappings remain the fallback if AniList is unavailable. Test actual later-season Sub/Dub playback on the deployed site; source coverage cannot be verified by unit tests.
