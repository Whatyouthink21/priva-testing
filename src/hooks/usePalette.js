import { useEffect, useState } from 'react';
import { extractPalette } from '../lib/palette';

/**
 * Sample a poster/backdrop for its colours. Results are cached per URL so
 * revisiting a title is instant and costs no extra requests.
 */
export function usePalette(url) {
  const [palette, setPalette] = useState(null);

  useEffect(() => {
    if (!url) {
      setPalette(null);
      return;
    }
    let alive = true;
    extractPalette(url).then((result) => {
      if (alive) setPalette(result);
    });
    return () => {
      alive = false;
    };
  }, [url]);

  return palette;
}
