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
