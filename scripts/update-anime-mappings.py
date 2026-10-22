"""Refresh the compact TMDB → MAL mapping using authenticated gh (no API keys stored).
Source: https://github.com/Fribb/anime-lists (and its upstream ID mapping projects).
Only numeric IDs, TMDB seasons, and episode offsets are retained.
"""
import json
import pathlib
import subprocess

raw = subprocess.check_output([
    'gh', 'api', 'repos/Fribb/anime-lists/contents/anime-list-full.json',
    '-H', 'Accept: application/vnd.github.raw+json',
])
rows = set()
for entry in json.loads(raw):
    mal = entry.get('mal_id')
    if not isinstance(mal, int) or mal <= 0:
        continue
    for kind, ids in entry.get('themoviedb_id', {}).items():
        if kind not in ('tv', 'movie'):
            continue
        season = entry.get('season', {}).get('tmdb', 1) if kind == 'tv' else 1
        offset = entry.get('episode_offset', {}).get('tmdb', 0)
        if not isinstance(season, int) or not isinstance(offset, int):
            continue
        for tmdb in ids if isinstance(ids, list) else [ids]:
            if isinstance(tmdb, int) and tmdb > 0:
                rows.add((kind, tmdb, season, offset, mal))
path = pathlib.Path(__file__).resolve().parents[1] / 'public/data/anime-mappings.json'
path.write_text(json.dumps(sorted(rows), separators=(',', ':')) + '\n')
print(f'Wrote {len(rows)} mappings to {path}')
