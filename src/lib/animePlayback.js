import { loadAnimeMappings, resolveAnimeMapping, resolveContinuousMapping, matchAnimeCour } from './anime.js';
import { dateString, getAnimeRelations } from './anilist.js';

export async function resolveAnimePlayback(type, id, season, episode, detail, loadSeason, dependencies = {}) {
  const rows = await (dependencies.loadMappings || loadAnimeMappings)();
  const getRelations = dependencies.getRelations || getAnimeRelations;
  const mapped = resolveAnimeMapping(rows, type, id, season, episode);
  if (type === 'movie' || season === 1) return mapped;
  const continuous = resolveContinuousMapping(rows, id, season, episode, detail?.seasons || []);
  // Use dates and AniList sequel relations to handle changed TMDB season layouts
  // and split cours. AniList failure must not break offline/local mappings.
  const root = resolveAnimeMapping(rows, type, id, 1, 1);
  if (!root) return mapped || continuous;
  try {
    const tmdbSeason = await loadSeason(id, season);
    const target = tmdbSeason.episodes?.find(e => e.episode_number === Number(episode));
    if (!target?.air_date) return mapped || continuous;
    let next = [root.malId];
    const seen = new Set();
    const media = [];
    // Bounded traversal: never issue unbounded requests for long-running franchises.
    for (let depth = 0; depth < 6 && next.length; depth++) {
      const mal = next.shift();
      if (seen.has(mal)) continue;
      seen.add(mal);
      const item = await getRelations(mal);
      if (!item) continue;
      if (continuous && mal === root.malId && (!item.episodes || continuous.episode <= item.episodes)) return continuous;
      media.push({ ...item, start: dateString(item.startDate) });
      const sequels = (item.relations?.edges || []).filter(e => e.relationType === 'SEQUEL' && e.node.type === 'ANIME' && e.node.idMal && e.node.format !== 'MOVIE');
      for (const edge of sequels) {
        media.push({ ...edge.node, start: dateString(edge.node.startDate) });
        if (!seen.has(String(edge.node.idMal)) && (!dateString(edge.node.startDate) || dateString(edge.node.startDate) <= target.air_date)) next.push(String(edge.node.idMal));
      }
      const match = matchAnimeCour(media, tmdbSeason.episodes || [], episode);
      const future = sequels.some(e => dateString(e.node.startDate) && dateString(e.node.startDate) <= target.air_date);
      if (match && !future) return match;
    }
    return matchAnimeCour(media, tmdbSeason.episodes || [], episode) || mapped || continuous;
  } catch {
    return mapped || continuous;
  }
}
