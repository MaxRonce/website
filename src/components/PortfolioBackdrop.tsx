'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { mulberry32 } from '@/lib/galaxyPainter';

type Star = {
  x: number;
  y: number;
  r: number;
  opacity: number;
  colour: string;
};

const STAR_COLOURS = ['#F2EEE6', '#F2EEE6', '#F2EEE6', '#8DBEFF', '#B6A2FF', '#FFE2BE'];

function generateStars(width: number, height: number): Star[] {
  const rand = mulberry32(20260801);
  const count = Math.min(700, Math.max(180, Math.round((width * height) / 11000)));
  const stars: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    // Bias positions toward the top so the field thins out on the way down —
    // a gradient from the cosmic journey into the quieter portfolio.
    const y = height * Math.pow(rand(), 2.1);
    const fade = Math.pow(Math.max(0, 1 - y / height), 1.25);
    const opacity = (0.14 + rand() * 0.5) * fade;
    if (opacity < 0.025) continue;
    stars.push({
      x: rand() * width,
      y,
      r: 0.4 + rand() * 1.1,
      opacity,
      colour: STAR_COLOURS[Math.floor(rand() * STAR_COLOURS.length)],
    });
  }
  return stars;
}

/**
 * Background layer of the portfolio: the same kind of unresolved sources as
 * the cosmic journey, continuing behind the sections but thinning out
 * progressively on the way down. Sits behind all content (z-index −1) and
 * carries the section area's soft nebula gradients.
 */
export function PortfolioBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setDims((previous) => {
          const w = parent.clientWidth;
          const h = parent.clientHeight;
          if (previous && Math.abs(previous.w - w) < 2 && Math.abs(previous.h - h) < 2) {
            return previous;
          }
          return { w, h };
        });
      });
    });
    observer.observe(parent);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const stars = useMemo(() => (dims ? generateStars(dims.w, dims.h) : []), [dims]);

  return (
    <div ref={ref} className="portfolio-backdrop" aria-hidden="true">
      {dims ? (
        <svg width={dims.w} height={dims.h} role="presentation">
          {stars.map((star, index) => (
            <circle
              key={index}
              cx={star.x.toFixed(1)}
              cy={star.y.toFixed(1)}
              r={star.r.toFixed(2)}
              fill={star.colour}
              opacity={star.opacity.toFixed(3)}
            />
          ))}
        </svg>
      ) : null}
    </div>
  );
}
