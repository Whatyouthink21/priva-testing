import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SERVERS, buildStreamUrl, buildZokoAnimeUrl, buildMegaPlayAnimeUrl, buildTryEmbedAnimeUrl, buildVidnestAnimeUrl, parsePlayerMessage } from '../src/lib/sources.js';
import { resolveAnimeMapping } from '../src/lib/anime.js';
const rows = JSON.parse(readFileSync(new URL('../public/data/anime-mappings.json', import.meta.url)));

test('numbered server lineup and tags', () => {
  assert.deepEqual(SERVERS.map(s => s.id), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(SERVERS[0].tags, ['Fast', 'High quality', 'Ad free']);
  assert.deepEqual(SERVERS[3].tags, ['4K', 'Ad free']);
  assert.deepEqual(SERVERS[5].tags, ['HD', 'Ad free']);
  assert.match(buildStreamUrl(1, 'movie', 550), /bingr.one/);
  assert.match(buildStreamUrl(2, 'movie', 550), /vidstuck.cc/);
  assert.match(buildStreamUrl(3, 'movie', 550), /tgvid.lovable.app/);
  assert.equal(buildStreamUrl(5, 'movie', 324857), 'https://vidnest.fun/movie/324857');
  assert.equal(buildStreamUrl(5, 'tv', 94997, {season: 1, episode: 1, startAt: 120}), 'https://vidnest.fun/tv/94997/1/1?startAt=120');
  assert.equal(
    buildStreamUrl(6, 'movie', 27205),
    'https://priva-embed.onrender.com/embed/movie/27205?branding=Priva&color=2563EB&providers=vega%3Acastle'
  );
  assert.equal(
    buildStreamUrl(6, 'movie', 27205, { startAt: 10 }),
    'https://priva-embed.onrender.com/embed/movie/27205?branding=Priva&color=2563EB&providers=vega%3Acastle'
  );
  assert.equal(
    buildStreamUrl(6, 'movie', 27205, { startAt: 40.7 }),
    'https://priva-embed.onrender.com/embed/movie/27205?branding=Priva&color=2563EB&start=40&providers=vega%3Acastle'
  );
  assert.equal(
    buildStreamUrl(6, 'tv', 1396, { season: 1, episode: 1, startAt: 42.3 }),
    'https://priva-embed.onrender.com/embed/tv/1396/1/1?branding=Priva&color=2563EB&start=42&providers=vega%3Acastle&subs=en'
  );
  assert.equal(buildStreamUrl(99, 'movie', 550), buildStreamUrl(1, 'movie', 550));
});
test('priva-player postMessage telemetry and completion', () => {
  const tick = parsePlayerMessage({
    source: 'priva-player',
    event: 'timeupdate',
    currentTime: 40,
    duration: 200,
    progress: 20,
    season: 1,
    episode: 2,
  });
  assert.deepEqual(tick, {
    timestamp: 40,
    duration: 200,
    progress: 20,
    season: 1,
    episode: 2,
    ended: false,
  });
  const done = parsePlayerMessage({
    source: 'priva-player',
    event: 'ended',
    currentTime: 200,
    duration: 200,
    progress: 100,
    season: null,
    episode: null,
  });
  assert.equal(done.ended, true);
  assert.equal(done.progress, 100);
  assert.equal(done.season, undefined);
  assert.equal(done.episode, undefined);
});
test('frameXTV movie/TV embeds and resume timestamp', () => {
  assert.equal(buildStreamUrl(4, 'movie', 550), 'https://framextv.xyz/embed/550?autoplay=1&muted=0');
  assert.equal(buildStreamUrl(4, 'tv', 1429, {season: 2, episode: 3, startAt: 120.8}), 'https://framextv.xyz/embed/1429/2/3?autoplay=1&muted=0&t=120');
});
test('frameXTV telemetry and completion', () => {
  assert.equal(parsePlayerMessage({event: 'frameXTV:timeupdate', currentTime: 30, duration: 120}).progress, 25);
  assert.equal(parsePlayerMessage({event: 'frameXTV:ended'}).ended, true);
});
test('real first/later season and film mappings resolve without external lookup', () => {
  assert.deepEqual(resolveAnimeMapping(rows, 'tv', 1429, 1, 4), {malId: '16498', episode: 4});
  assert.deepEqual(resolveAnimeMapping(rows, 'tv', 1429, 2, 3), {malId: '25777', episode: 3});
  assert.deepEqual(resolveAnimeMapping(rows, 'movie', 129, 1, 1), {malId: '199', episode: 1});
  assert.equal(resolveAnimeMapping(rows, 'movie', 999999999), null);
});
test('episode offsets, ambiguity, and language URLs', () => {
  const fixture = [['tv', 1, 1, 0, 100], ['tv', 1, 1, 12, 200]];
  assert.deepEqual(resolveAnimeMapping(fixture, 'tv', 1, 1, 13), {malId: '200', episode: 1});
  assert.equal(resolveAnimeMapping([...fixture, ['tv', 1, 1, 12, 300]], 'tv', 1, 1, 13), null);
  assert.equal(buildZokoAnimeUrl(199, 1, 'dub'), 'https://zokoanime.video/stream/mal/199/1/dub?color=35d5bf');
  assert.equal(buildZokoAnimeUrl(199, 1, 'hsub'), 'https://zokoanime.video/stream/mal/199/1/hsub?color=35d5bf');
  assert.equal(buildZokoAnimeUrl(''), '');
  assert.equal(buildMegaPlayAnimeUrl(199, 1, 'dub'), 'https://megaplay.buzz/stream/mal/199/1/dub');
  assert.equal(buildMegaPlayAnimeUrl(199, 1, 'hsub'), 'https://megaplay.buzz/stream/mal/199/1/sub');
  assert.equal(buildMegaPlayAnimeUrl(''), '');
  assert.equal(buildTryEmbedAnimeUrl(21, 7, 'dub'), 'https://tryembed.us.cc/embed/anime/mal/21/7/dub?autoplay=true&autoSkip=true&autoNext=false&skin=silicon');
  assert.equal(buildTryEmbedAnimeUrl(21, 7, 'hsub'), 'https://tryembed.us.cc/embed/anime/mal/21/7/sub?autoplay=true&autoSkip=true&autoNext=false&skin=silicon');
  assert.equal(buildTryEmbedAnimeUrl('', 1), '');
  assert.equal(buildVidnestAnimeUrl(154587, 1, 'hindi'), 'https://vidnest.fun/anime/154587/1/hindi');
  assert.equal(buildVidnestAnimeUrl(16498, 2, 'dub'), 'https://vidnest.fun/anime/16498/2/dub');
  assert.equal(buildVidnestAnimeUrl('', 1), '');
});

test('continuous anime seasons use absolute episodes and exclude specials', async () => {
  const { resolveContinuousMapping } = await import('../src/lib/anime.js');
  const seasons = [{season_number: 0, episode_count: 9}, {season_number: 1, episode_count: 61}, {season_number: 2, episode_count: 16}, {season_number: 3, episode_count: 20}];
  assert.deepEqual(resolveContinuousMapping(rows, 37854, 2, 1, seasons), {malId: '21', episode: 62});
  assert.deepEqual(resolveContinuousMapping(rows, 37854, 3, 2, seasons), {malId: '21', episode: 79});
  // TMDB can expose a globally numbered episode inside a later season. Do not add the season offset twice.
  assert.deepEqual(resolveContinuousMapping(rows, 37854, 3, 79, seasons), {malId: '21', episode: 79});
  assert.equal(resolveContinuousMapping(rows, 1429, 2, 1, seasons), null);
  assert.equal(resolveContinuousMapping(rows, 37854, 3, 1, []), null);
});

test('One Piece TMDB global episode numbers are not offset a second time', async () => {
  const { resolveContinuousMapping } = await import('../src/lib/anime.js');
  const counts = [61, 16, ...Array(12).fill(43), 49]; // 642 episodes in seasons 1–15
  const seasons = [{season_number: 0, episode_count: 9}, ...counts.map((episode_count, i) => ({season_number: i + 1, episode_count})), {season_number: 16, episode_count: 52}];
  assert.deepEqual(resolveContinuousMapping(rows, 37854, 16, 644, seasons), {malId: '21', episode: 644});
});

test('cour air dates restart episodes at the correct AniList sequel', async () => {
  const { matchAnimeCour } = await import('../src/lib/anime.js');
  const media = [{idMal: 100, start: '2024-01-01', episodes: 12}, {idMal: 200, start: '2024-07-01', episodes: 12}];
  const episodes = [{episode_number: 12, air_date: '2024-03-18'}, {episode_number: 13, air_date: '2024-07-01'}, {episode_number: 14, air_date: '2024-07-08'}];
  assert.deepEqual(matchAnimeCour(media, episodes, 14), {malId: '200', episode: 2});
  assert.equal(matchAnimeCour(media, episodes, 15), null);
  assert.equal(matchAnimeCour(media, [{episode_number: 1, air_date: '2025-01-01'}], 1), null);
});

test('later-season orchestration handles continuous anime, split cours, and API outages', async () => {
  const { resolveAnimePlayback } = await import('../src/lib/animePlayback.js');
  const detail = {seasons: [{season_number: 1, episode_count: 12}, {season_number: 2, episode_count: 12}]};
  const local = [['tv', 10, 1, 0, 100]];
  const episodeList = {episodes: [{episode_number: 1, air_date: '2024-07-01'}, {episode_number: 2, air_date: '2024-07-08'}]};
  const dependencies = {
    loadMappings: async () => local,
    getRelations: async mal => Number(mal) === 100 ? {
      idMal: 100, episodes: 12, format: 'TV', startDate: {year: 2024, month: 1, day: 1},
      relations: {edges: [{relationType: 'SEQUEL', node: {type: 'ANIME', idMal: 200, episodes: 12, format: 'TV', startDate: {year: 2024, month: 7, day: 1}}}]},
    } : {idMal: 200, episodes: 12, format: 'TV', startDate: {year: 2024, month: 7, day: 1}},
  };
  // A single stale local MAL mapping must not force a 12-episode show's sequel to episode 14.
  assert.deepEqual(await resolveAnimePlayback('tv', 10, 2, 2, detail, async () => episodeList, dependencies), {malId: '200', episode: 2});
  assert.deepEqual(await resolveAnimePlayback('tv', 10, 2, 2, detail, async () => episodeList, {...dependencies, getRelations: async () => ({episodes: 100})}), {malId: '100', episode: 14});
  const explicit = { ...dependencies, loadMappings: async () => [...local, ['tv', 10, 2, 0, 200]], getRelations: async () => { throw new Error('offline'); } };
  assert.deepEqual(await resolveAnimePlayback('tv', 10, 2, 2, detail, async () => episodeList, explicit), {malId: '200', episode: 2});
});

test('AniList public client sends no credentials and handles rate limits', async () => {
  const { anilistRequest } = await import('../src/lib/anilist.js');
  const original = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async (url, options) => {
      calls++;
      assert.equal(url, 'https://graphql.anilist.co');
      assert.equal(options.headers.Authorization, undefined);
      assert.deepEqual(JSON.parse(options.body).variables, {id: 1});
      return {ok: true, json: async () => ({data: {Media: {id: 1}}})};
    };
    assert.deepEqual(await anilistRequest('query PublicTest', {id: 1}), {Media: {id: 1}});
    await anilistRequest('query PublicTest', {id: 1});
    assert.equal(calls, 1);
    globalThis.fetch = async () => ({ok: false, status: 429});
    await assert.rejects(anilistRequest('query RateLimitTest'), /busy/);
  } finally { globalThis.fetch = original; }
});
