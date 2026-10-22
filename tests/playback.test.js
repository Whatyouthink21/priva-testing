import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SERVERS, buildStreamUrl, buildAnimeUrl, parsePlayerMessage } from '../src/lib/sources.js';
import { resolveAnimeMapping } from '../src/lib/anime.js';
const rows = JSON.parse(readFileSync(new URL('../public/data/anime-mappings.json', import.meta.url)));

test('v2.2 server lineup and tags', () => {
  assert.deepEqual(SERVERS.map(s => s.id), [1, 2, 3, 4]);
  assert.deepEqual(SERVERS[0].tags, ['Fast', 'High quality', 'Ad free']);
  assert.deepEqual(SERVERS[3].tags, ['4K', 'Ad free']);
  assert.match(buildStreamUrl(1, 'movie', 550), /bingr.one/);
  assert.match(buildStreamUrl(2, 'movie', 550), /vidstuck.cc/);
  assert.match(buildStreamUrl(3, 'movie', 550), /tgvid.lovable.app/);
  assert.equal(buildStreamUrl(99, 'movie', 550), buildStreamUrl(1, 'movie', 550));
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
  assert.equal(buildAnimeUrl(199, 1, 'dub'), 'https://megaplay.buzz/stream/mal/199/1/dub');
  assert.equal(buildAnimeUrl(199, 1, 'sub'), 'https://megaplay.buzz/stream/mal/199/1/sub');
  assert.equal(buildAnimeUrl(''), '');
});
