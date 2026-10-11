'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Trait décoratif qui se déploie de gauche à droite quand il entre dans le
 * viewport (ex. le fil qui relie les étapes de "Comment ça marche ?").
 * Purement visuel : masqué aux lecteurs d'écran. Avec prefers-reduced-motion,
 * la transition est instantanée (voir globals.css).
 */
export default function GrowLine({
  className = '',
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`origin-left transition-transform duration-[1400ms] ease-out ${className}`}
      style={{
        transform: visible ? 'scaleX(1)' : 'scaleX(0)',
        transitionDelay: visible ? `${delay}ms` : '0ms',
      }}
    />
  );
}
