'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Animation du logo SENSHOOT (souris → câble → appareil photo → lettres),
 * portée depuis `senshoot-logo-reveal.html` : même minuterie `render(t)` et
 * mêmes images clés, sans le lecteur de travail ni les polices Google.
 *
 * - Dessin vectoriel : net à toutes les tailles, quelques Ko.
 * - Démarre toute seule, SANS son, quand elle est à moitié visible.
 *   Le son (voix off « Bienvenue dans SENSHOOT ») est optionnel et ne part
 *   que sur clic, comme l'exigent les navigateurs.
 * - prefers-reduced-motion : image finale, pas de lecture automatique.
 * - Seuls quelques attributs SVG sont mis à jour par image ; la grille de
 *   points n'est recalculée que pendant ses deux fenêtres d'animation.
 */
const DUR = 7.0; // durée visuelle ; la piste son dure ≈ 7,5 s

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t: number, s: number, d: number) => clamp((t - s) / d);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const E = {
  outExpo: (p: number) => (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  outCubic: (p: number) => 1 - Math.pow(1 - p, 3),
  inOutCubic: (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  inOutQuint: (p: number) => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2),
  outBack: (p: number, s = 1.7) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2),
  outElastic: (p: number) =>
    p === 0 || p === 1 ? p : Math.pow(2, -10 * p) * Math.sin(((p * 10 - 0.75) * (2 * Math.PI)) / 3) + 1,
};

type Attrs = Record<string, string | number>;
const set = (el: Element, o: Attrs) => {
  for (const k in o) el.setAttribute(k, String(o[k]));
};

// Le SVG est statique côté React (mémoïsé) : toutes les animations passent par
// setAttribute dans l'effet ci-dessous. Son rendu serveur = l'image finale du
// logo, donc lisible sans JavaScript et pour le mouvement réduit.
const LogoSvg = memo(function LogoSvg({ label }: { label: string }) {
  return (
    <svg viewBox="47 240 900 506" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label} className="block h-full w-full">
      <defs>
        <radialGradient id="lr-vig" cx="50%" cy="50%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e7f1ef" />
        </radialGradient>
        <radialGradient id="lr-flashG">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset=".35" stopColor="#fff7e6" stopOpacity=".85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lr-sparkG">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".3" stopColor="#ffc35a" />
          <stop offset="1" stopColor="#f39200" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lr-sheen" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="lr-badgeClip">
          <rect x="698" y="413" width="62" height="44" />
        </clipPath>
        <clipPath id="lr-camClip">
          <rect x="530" y="340" width="180" height="140" />
        </clipPath>
      </defs>

      <rect x="47" y="240" width="900" height="506" fill="url(#lr-vig)" />
      <g id="lr-grid" fill="#178a7e" />

      <g id="lr-logo">
        <path
          id="lr-cable"
          pathLength={1}
          d="M482 545 C480 515 462 498 450 485 C422 455 416 405 434 370 C455 330 515 316 552 326 C564 330 570 338 573 349"
          fill="none"
          stroke="#178a7e"
          strokeWidth="5.5"
          strokeLinecap="round"
        />

        <g id="lr-mouse">
          <g transform="translate(458 610) rotate(20)">
            <g id="lr-mouseInner">
              <rect id="lr-mBody" pathLength={1} x="-47" y="-68" width="94" height="136" rx="47" ry="56" fill="none" stroke="#178a7e" strokeWidth="9" />
              <line id="lr-mDiv" pathLength={1} x1="-47" y1="-14" x2="47" y2="-14" stroke="#178a7e" strokeWidth="7" />
              <rect id="lr-mWheel" x="-6" y="-44" width="12" height="20" rx="6" fill="none" stroke="#178a7e" strokeWidth="5" />
              <line id="lr-mMark" x1="30" y1="12" x2="30" y2="28" stroke="#178a7e" strokeWidth="4" strokeLinecap="round" />
            </g>
          </g>
          <circle id="lr-rip1" cx="482" cy="548" r="10" fill="none" stroke="#178a7e" strokeWidth="2" opacity="0" />
          <circle id="lr-rip2" cx="482" cy="548" r="10" fill="none" stroke="#f39200" strokeWidth="2" opacity="0" />
        </g>

        <g id="lr-camera">
          <g>
            <g clipPath="url(#lr-camClip)">
              <path id="lr-hump" d="M614 380 V362 a6 6 0 0 1 6 -6 h46 a6 6 0 0 1 6 6 V380 Z" fill="#536070" />
              <rect id="lr-lbump" x="558" y="366" width="32" height="14" rx="4" fill="#536070" />
            </g>
            <rect id="lr-cBody" x="546" y="374" width="147" height="92" rx="9" fill="#536070" />
            <circle id="lr-lensFill" cx="645" cy="420" r="27" fill="#47525f" />
            <circle id="lr-lens" pathLength={1} cx="645" cy="420" r="27" fill="none" stroke="#fff" strokeWidth="9" transform="rotate(-90 645 420)" />
            <rect id="lr-vf" x="574" y="382" width="19" height="11" rx="5.5" fill="#fff" />
            <circle id="lr-glint" cx="636" cy="411" r="4" fill="#fff" />
          </g>
        </g>
        <circle id="lr-dot" cx="573" cy="349" r="12" fill="#f39200" />

        <g id="lr-sen" fontFamily="SenPoppins, Poppins, sans-serif" fontStyle="italic" fontWeight={800} fontSize={98} fill="#178a7e">
          <text id="lr-L0" x="232" y="465">S</text>
          <text id="lr-L1" x="289" y="465">E</text>
          <text id="lr-L2" x="342" y="465">N</text>
        </g>
        <g id="lr-senSheen" fontFamily="SenPoppins, Poppins, sans-serif" fontStyle="italic" fontWeight={800} fontSize={98} fill="url(#lr-sheen)" opacity="0">
          <text x="232" y="465">S</text>
          <text x="289" y="465">E</text>
          <text x="342" y="465">N</text>
        </g>

        <rect id="lr-badge" x="698" y="413" width="62" height="44" fill="#178a7e" />
        <g clipPath="url(#lr-badgeClip)">
          <text id="lr-sn" x="701" y="452" fontFamily="SenPoppins, Poppins, sans-serif" fontStyle="italic" fontWeight={800} fontSize={40} fill="#f39200">
            Sn
          </text>
        </g>
      </g>

      <circle id="lr-spark" r="16" fill="url(#lr-sparkG)" opacity="0" />
      <circle id="lr-flash" cx="583" cy="388" r="10" fill="url(#lr-flashG)" opacity="0" />
      <rect id="lr-whiteout" x="47" y="240" width="900" height="506" fill="#fff" opacity="0" />
    </svg>
  );
});

type Controls = { play: () => void; stop: () => void };

export default function LogoReveal() {
  const t = useTranslations('HomePage');
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const controls = useRef<Controls | null>(null);
  const soundRef = useRef(false);
  const [sound, setSound] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const $ = (id: string) => root.querySelector('#lr-' + id) as SVGElement;

    // Grille de points d'ambiance (créée côté client uniquement : ~800 éléments)
    const grid = $('grid');
    const dots: { c: SVGCircleElement; d: number }[] = [];
    for (let x = 59; x <= 940; x += 24) {
      for (let y = 252; y <= 745; y += 24) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        set(c, { cx: x, cy: y, r: 1.1, opacity: 0 });
        grid.appendChild(c);
        dots.push({ c, d: Math.hypot(x - 497, y - 500) });
      }
    }
    let dotsMode = '';
    function renderDots(tt: number) {
      if (tt < 1.6 || (tt >= 4.6 && tt < 5.8)) {
        dotsMode = 'anim';
        const fade = 1 - 0.5 * prog(tt, 4.6, 1.2);
        for (const { c, d } of dots) {
          const p = E.outCubic(prog(tt, 0.05 + d / 900, 0.8));
          c.setAttribute('opacity', (p * 0.1 * fade).toFixed(3));
        }
      } else {
        const mode = tt < 4.6 ? 'steady1' : 'steady2';
        if (mode !== dotsMode) {
          dotsMode = mode;
          const o = mode === 'steady1' ? '0.100' : '0.050';
          for (const { c } of dots) c.setAttribute('opacity', o);
        }
      }
    }

    const cable = $('cable') as unknown as SVGPathElement;
    const cableLen = cable.getTotalLength();
    const L = [$('L0'), $('L1'), $('L2')];

    function render(tt: number) {
      const push = E.outCubic(prog(tt, 0, 5.6));
      const sc = lerp(1.12, 1, push);
      const ty = lerp(14, 0, push);
      set($('logo'), { transform: `translate(497 500) scale(${sc}) translate(-497 ${-500 + ty})` });

      renderDots(tt);

      // 1 · souris : le contour se trace, les pièces arrivent, clic
      const mo = E.inOutCubic(prog(tt, 0.15, 0.75));
      set($('mBody'), { 'stroke-dasharray': 1, 'stroke-dashoffset': 1 - mo });
      const md = E.outExpo(prog(tt, 0.6, 0.4));
      set($('mDiv'), { 'stroke-dasharray': 1, 'stroke-dashoffset': 1 - md });
      const wp = E.outBack(prog(tt, 0.75, 0.35), 3);
      set($('mWheel'), { transform: `translate(0 -34) scale(${wp}) translate(0 34)`, opacity: prog(tt, 0.75, 0.05) });
      set($('mMark'), { opacity: E.outCubic(prog(tt, 0.85, 0.25)) });
      const pop = E.outBack(prog(tt, 0.1, 0.7), 1.4);
      const click = tt > 0.95 && tt < 1.25 ? Math.sin(prog(tt, 0.95, 0.3) * Math.PI) : 0;
      set($('mouseInner'), {
        transform: `scale(${(0.6 + 0.4 * pop) * (1 - 0.07 * click)} ${(0.6 + 0.4 * pop) * (1 + 0.03 * click)})`,
        opacity: clamp(tt / 0.25),
      });
      ([['rip1', 0.98], ['rip2', 1.08]] as const).forEach(([id, s]) => {
        const p = prog(tt, s, 0.7);
        const e = E.outCubic(p);
        set($(id), { r: 6 + e * 46, opacity: p > 0 && p < 1 ? (1 - e) * 0.9 : 0, 'stroke-width': 2.5 * (1 - e) + 0.3 });
      });

      // 2 · le câble avance avec une étincelle en tête
      const cp = E.inOutQuint(prog(tt, 1.05, 1.15));
      set(cable, { 'stroke-dasharray': 1, 'stroke-dashoffset': 1 - cp, opacity: cp > 0 ? 1 : 0 });
      const sp = $('spark');
      if (cp > 0 && cp < 1) {
        const pt = cable.getPointAtLength(cp * cableLen);
        set(sp, { cx: pt.x, cy: pt.y, opacity: 1, r: 14 + 4 * Math.sin(tt * 40) });
      } else set(sp, { opacity: 0 });

      // 3 · le point orange arrive, l'appareil se construit
      const dp = prog(tt, 2.15, 0.55);
      set($('dot'), { transform: `translate(573 349) scale(${E.outElastic(dp)}) translate(-573 -349)`, opacity: dp > 0 ? 1 : 0 });
      const bp = E.outBack(prog(tt, 2.3, 0.6), 1.5);
      const shot = tt > 3.05 ? Math.sin(prog(tt, 3.05, 0.22) * Math.PI) : 0;
      const cs = bp * (1 - 0.05 * shot);
      set($('camera'), {
        transform: `translate(573 372) scale(${cs}) rotate(${lerp(-14, 0, E.outCubic(prog(tt, 2.3, 0.7)))}) translate(-573 -372)`,
        opacity: prog(tt, 2.3, 0.06),
      });
      set($('hump'), { transform: `translate(0 ${lerp(26, 0, E.outBack(prog(tt, 2.55, 0.45), 2.2))})` });
      set($('lbump'), { transform: `translate(0 ${lerp(16, 0, E.outBack(prog(tt, 2.65, 0.4), 2.2))})` });
      const lp = E.inOutCubic(prog(tt, 2.6, 0.55));
      set($('lens'), {
        'stroke-dasharray': lp >= 1 ? 'none' : 1,
        'stroke-dashoffset': 1 - lp,
        transform: `rotate(${-90 + lerp(-180, 0, lp)} 645 420)`,
      });
      const iris = 1 - 0.55 * shot;
      set($('lensFill'), { transform: `translate(645 420) scale(${iris}) translate(-645 -420)` });
      set($('vf'), { transform: `translate(583.5 387.5) scale(${E.outBack(prog(tt, 2.85, 0.3), 3)}) translate(-583.5 -387.5)` });
      set($('glint'), {
        opacity: E.outCubic(prog(tt, 3.2, 0.4)) * 0.9,
        transform: `translate(${lerp(-6, 0, E.outCubic(prog(tt, 3.2, 0.5)))} 0)`,
      });

      // 4 · flash
      const fp = prog(tt, 3.05, 0.6);
      set($('flash'), { r: 10 + E.outExpo(fp) * 260, opacity: fp > 0 && fp < 1 ? 1 - E.outCubic(fp) : 0 });
      const wo = prog(tt, 3.05, 0.35);
      set($('whiteout'), { opacity: wo > 0 && wo < 1 ? 0.55 * (1 - E.outCubic(wo)) : 0 });

      // 5 · lettres S E N
      L.forEach((el, i) => {
        const p = prog(tt, 3.35 + i * 0.09, 0.75);
        const e = E.outExpo(p);
        set(el, { transform: `translate(${lerp(-70, 0, e)} 0) skewX(${lerp(-18, 0, e)})`, opacity: clamp(p * 3) });
      });

      // 6 · le badge, « Sn », reflet
      const wp2 = E.inOutCubic(prog(tt, 3.95, 0.45));
      set($('badge'), { transform: `translate(698 0) scale(${wp2} 1) translate(-698 0)` });
      const sn = E.outBack(prog(tt, 4.25, 0.5), 1.8);
      set($('sn'), { transform: `translate(0 ${lerp(46, 0, sn)})` });
      const sh = E.inOutCubic(prog(tt, 4.75, 0.9));
      $('sheen').setAttribute('gradientTransform', `translate(${lerp(140, 860, sh)} 0) skewX(-20)`);
      set($('senSheen'), { opacity: sh > 0 && sh < 1 ? 1 : 0 });
    }

    // ----- lecture -----
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const stop = () => cancelAnimationFrame(raf);
    const play = () => {
      stop();
      setEnded(false);
      const audio = audioRef.current;
      if (soundRef.current && audio) {
        try {
          audio.currentTime = 0;
          void audio.play().catch(() => {});
        } catch {
          /* ignoré : le son reste optionnel */
        }
      }
      const start = performance.now();
      const frame = (now: number) => {
        const tt = Math.min((now - start) / 1000, DUR);
        render(tt);
        if (tt >= DUR) {
          setEnded(true);
          return;
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    controls.current = { play, stop };

    let observer: IntersectionObserver | null = null;
    if (reduce) {
      render(DUR); // image finale, sans mouvement
      setEnded(true);
    } else {
      render(0);
      const fontReady = Promise.race([
        document.fonts?.load('italic 800 98px SenPoppins') ?? Promise.resolve(),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer?.disconnect();
          void fontReady.then(play); // police chargée avant d'écrire les lettres
        },
        { threshold: 0.5 }
      );
      observer.observe(root);
    }

    return () => {
      stop();
      observer?.disconnect();
      audioRef.current?.pause();
      controls.current = null;
      grid.replaceChildren();
    };
  }, []);

  const replay = useCallback(() => controls.current?.play(), []);
  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSound(next);
    if (next) controls.current?.play(); // redémarre avec la voix off
    else audioRef.current?.pause();
  }, []);

  const btn =
    'inline-flex h-10 items-center gap-2 rounded-full bg-white/90 px-4 text-sm font-semibold text-sn-slate shadow ring-1 ring-black/10 backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sn-orange';

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div ref={rootRef} className="relative aspect-video overflow-hidden rounded-2xl bg-[#fbfdfc] shadow-xl ring-1 ring-black/5">
        <LogoSvg label={t('brandAlt')} />
        <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={replay} className={`${btn} ${ended ? 'ring-sn-orange' : ''}`}>
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10a6 6 0 1 0 2-4.5M4 3.5v3h3" />
            </svg>
            {t('brandReplay')}
          </button>
          <button type="button" onClick={toggleSound} aria-pressed={sound} className={`${btn} ${sound ? 'ring-sn-orange' : ''}`}>
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8v4h3l4 3V5L6 8H3Z" />
              {sound ? <path d="M13.5 7.5a3.5 3.5 0 0 1 0 5M15.5 5.5a6.5 6.5 0 0 1 0 9" /> : <path d="M13.5 8l4 4m0-4l-4 4" />}
            </svg>
            {sound ? t('brandSoundOff') : t('brandSoundOn')}
          </button>
        </div>
      </div>
      {/* Texte alternatif de l'animation et de sa voix off */}
      <p className="sr-only">{t('brandDescription')}</p>
      <audio ref={audioRef} preload="none" src="/audio/senshoot-bienvenue-v1.mp3" />
    </div>
  );
}
