/**
 * Browse query builder.
 *
 * Kept separate from the page so the filtering rules are explicit (and
 * testable): whenever a genre is selected we must go through `/discover`,
 * because `/popular`, `/top_rated`, `/now_playing` and `/upcoming` cannot be
 * filtered by genre.
 */

const SORT_TO_DISCOVER = {
  popular: 'popularity.desc',
  top_rated: 'vote_average.desc',
  trending: 'popularity.desc',
  now_playing: 'popularity.desc',
  upcoming: 'popularity.desc',
};

function dateSort(type) {
  return type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc';
}

/**
 * @param {object} api        the tmdb api helpers
 * @param {object} options
 * @param {'movie'|'tv'|'anime'} options.kind
 * @param {'movie'|'tv'} options.type
 * @param {string} options.genre      genre id, '' for all
 * @param {string} options.sort       one of SORTS
 * @param {number} options.page
 */
export function buildBrowseRequest(api, { kind, type = 'movie', genre = '', sort = 'popular', page = 1 }) {
  const genreId = String(genre || '').trim();

  if (kind === 'anime') {
    return api.discover('tv', {
      page,
      with_genres: genreId ? `16,${genreId}` : '16',
      with_original_language: 'ja',
      sort_by: sort === 'top_rated' ? 'vote_average.desc' : 'popularity.desc',
      'vote_count.gte': 40,
    });
  }

  // A genre is active → always discover, with the chosen sort mapped onto it.
  if (genreId) {
    const sortBy = sort === 'newest' ? dateSort(type) : SORT_TO_DISCOVER[sort] || 'popularity.desc';
    return api.discover(type, {
      page,
      with_genres: genreId,
      sort_by: sortBy,
      'vote_count.gte': sort === 'newest' ? 10 : 20,
    });
  }

  switch (sort) {
    case 'top_rated':
      return api.topRated(type, page);
    case 'now_playing':
      return type === 'movie' ? api.nowPlaying(page) : api.popular('tv', page);
    case 'upcoming':
      return type === 'movie' ? api.upcoming(page) : api.popular('tv', page);
    case 'trending':
      return api.trending(type, 'week');
    case 'newest':
      return api.discover(type, {
        page,
        sort_by: dateSort(type),
        'vote_count.gte': 10,
      });
    case 'popular':
    default:
      return api.popular(type, page);
  }
}

/** Sort options for a given media type. */
export const SORTS = [
  { id: 'popular', label: 'Popular' },
  { id: 'top_rated', label: 'Top rated' },
  { id: 'newest', label: 'Newest' },
  { id: 'now_playing', label: 'In cinemas', movieOnly: true },
  { id: 'upcoming', label: 'Coming soon', movieOnly: true },
  { id: 'trending', label: 'Trending' },
];
