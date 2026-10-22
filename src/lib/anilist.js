// Public metadata only: never send an OAuth client secret from browser code.
const cache = new Map();
export async function anilistRequest(query, variables = {}) {
  const key = JSON.stringify([query, variables]);
  if (!cache.has(key) || cache.get(key).expiresAt < Date.now()) {
    const request = fetch('https://graphql.anilist.co', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(12000),
    }).then(async (r) => {
      if (!r.ok) throw new Error(r.status === 429 ? 'AniList is busy. Please try again later.' : 'AniList is temporarily unavailable.');
      const result = await r.json();
      if (result.errors?.length || !result.data) throw new Error('AniList could not load this data.');
      return result.data;
    }).catch((error) => { cache.delete(key); throw error; });
    cache.set(key, { promise: request, expiresAt: Date.now() + 5 * 60 * 1000 });
  }
  return cache.get(key).promise;
}
const fields = `id idMal title { english romaji } coverImage { large } siteUrl episodes format averageScore startDate { year month day }`;
export async function getAnimeDiscovery() {
  const month = new Date().getMonth();
  const season = ['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor(month / 3)];
  return anilistRequest(`query ($season: MediaSeason, $year: Int) {
    trending: Page(perPage: 12) { media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${fields} } }
    seasonal: Page(perPage: 12) { media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) { ${fields} } }
  }`, { season, year: new Date().getFullYear() });
}

export function dateString(date) {
  if (!date?.year || !date.month || !date.day) return null;
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export async function getAnimeRelations(malId) {
  return (await anilistRequest(`query ($mal: Int) {
    Media(idMal: $mal, type: ANIME) {
      ${fields}
      relations { edges { relationType node { ${fields} type } } }
    }
  }`, { mal: Number(malId) })).Media;
}
