// Compact snapshot of Fribb/anime-lists. Refresh with scripts/update-anime-mappings.py.
// Rows: [media type, TMDB ID, TMDB season, TMDB episode offset, MAL ID].
let mappingRequest;
export function resolveAnimeMapping(rows, type, id, season = 1, episode = 1) {
  const candidates = rows.filter(([kind, tmdb, s, offset]) =>
    kind === type && tmdb === Number(id) && s === Number(season) && offset < Number(episode)
  );
  const offset = Math.max(...candidates.map((row) => row[3]));
  const matches = candidates.filter((row) => row[3] === offset);
  // Do not silently pick a random title when the upstream mapping is ambiguous.
  if (new Set(matches.map((row) => row[4])).size !== 1) return null;
  return { malId: String(matches[0][4]), episode: Number(episode) - offset };
}

export async function loadAnimeMappings() {
  if (!mappingRequest) {
    mappingRequest = fetch('/data/anime-mappings.json')
      .then((response) => {
        if (!response.ok) throw new Error('Anime mappings could not be loaded.');
        return response.json();
      })
      .catch((error) => { mappingRequest = undefined; throw error; });
  }
  return mappingRequest;
}

export async function lookupAnimeMapping(type, id, season, episode) {
  return resolveAnimeMapping(await loadAnimeMappings(), type, id, season, episode);
}

// Continuous series (e.g. One Piece) have one MAL entry, but TMDB splits them
// into many seasons. Count all preceding regular episodes, never specials.
export function resolveContinuousMapping(rows, id, season, episode, seasons) {
  const entries = rows.filter(([kind, tmdb, s]) => kind === 'tv' && tmdb === Number(id) && s > 0);
  if (!entries.length || new Set(entries.map(r => r[4])).size !== 1) return null;
  const earlier = seasons.filter(s => s.season_number > 0 && s.season_number < season);
  if (earlier.length !== season - 1 || earlier.some(s => !Number.isInteger(s.episode_count))) return null;
  return { malId: String(entries[0][4]), episode: earlier.reduce((sum, s) => sum + s.episode_count, Number(episode)) };
}

// Match a cour using original episode air dates; numbering restarts for each MAL entry.
export function matchAnimeCour(media, episodes, episode) {
  const current = episodes.find(e => e.episode_number === Number(episode));
  if (!current?.air_date) return null;
  const available = media.filter(m => m.idMal && m.start && m.start <= current.air_date && m.format !== 'MOVIE');
  const latest = available.sort((a, b) => b.start.localeCompare(a.start))[0];
  if (!latest) return null;
  const localEpisodes = episodes.filter(e => e.air_date && e.air_date >= latest.start && e.episode_number <= Number(episode));
  // Only restart numbering if the cour premiere is actually inside this TMDB season.
  const first = localEpisodes[0];
  if (!first || Math.abs(Date.parse(first.air_date) - Date.parse(latest.start)) > 7 * 86400000) return null;
  if (latest.episodes && localEpisodes.length > latest.episodes) return null;
  return { malId: String(latest.idMal), episode: localEpisodes.length };
}
