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

export async function lookupAnimeMapping(type, id, season, episode) {
  if (!mappingRequest) {
    mappingRequest = fetch('/data/anime-mappings.json')
      .then((response) => {
        if (!response.ok) throw new Error('Anime mappings could not be loaded.');
        return response.json();
      })
      .catch((error) => { mappingRequest = undefined; throw error; });
  }
  return resolveAnimeMapping(await mappingRequest, type, id, season, episode);
}
