import { useEffect, useRef, useState } from 'react';
import Row from './Row';
import RankedRow from './RankedRow';
import { normalize } from '../lib/tmdb';

/**
 * Self-fetching row. The loader is captured once so passing an inline
 * function doesn't refetch on every render, and rows only hit the API
 * when they're within a screen of the viewport.
 */
export default function ApiRow({
  title,
  subtitle,
  link,
  loader,
  transform,
  ranked = false,
  limit,
  cardWidth,
  className,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const holder = useRef(null);
  const loaderRef = useRef(loader);
  const transformRef = useRef(transform);

  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    setLoading(true);
    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : data?.results || [];
        const mapped = list
          .filter((x) => x && (x.media_type ? ['movie', 'tv'].includes(x.media_type) : true))
          .map((x, i) => (transformRef.current ? transformRef.current(x, i) : normalize(x)))
          .filter((x) => x && x.id)
          .slice(0, limit || 20);
        setItems(mapped);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [active, limit]);

  const props = { title, subtitle, link, items, loading, cardWidth, className };

  return (
    <div ref={holder}>
      {ranked ? <RankedRow {...props} /> : <Row {...props} />}
    </div>
  );
}
