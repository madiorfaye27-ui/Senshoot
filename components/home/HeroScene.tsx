import QRCode from 'qrcode';

// Vrai QR Code (il pointe vers le site) : quelqu'un qui regarde l'accueil sur
// un ordinateur peut le scanner avec son téléphone. Calculé une seule fois,
// au chargement du module, côté serveur.
const SITE_URL = 'https://shootsenegal.com';

const qr = (() => {
  const { modules } = QRCode.create(SITE_URL, { errorCorrectionLevel: 'M' });
  const size = modules.size;
  let d = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules.data[y * size + x]) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { size, d };
})();

/**
 * Scène animée du hero : un téléphone scanne un QR Code, des photos
 * apparaissent autour puis flottent, et une pastille confirme le paiement.
 * Entièrement décorative (aria-hidden) : le sens de la page est porté par le
 * texte. Seuls transform/opacity sont animés ; avec prefers-reduced-motion,
 * tout s'affiche directement dans son état final (voir globals.css).
 */
export default function HeroScene({ badge }: { badge: string }) {
  return (
    <div
      aria-hidden
      className="relative mx-auto h-[21rem] w-full max-w-sm select-none sm:h-[26rem]"
    >
      {/* Halo de fond */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-sn-orange/25 via-sn-teal/15 to-transparent blur-2xl" />

      {/* Téléphone */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-pop [animation-delay:150ms]">
          <div className="animate-float-slow">
            <div className="w-40 -rotate-3 rounded-[2rem] bg-sn-slate p-2 shadow-2xl ring-1 ring-black/10 sm:w-48">
              <div className="mx-auto mb-1.5 h-1.5 w-12 rounded-full bg-white/20" />
              <div className="relative overflow-hidden rounded-[1.5rem] bg-white p-4">
                {/* QR + cadre de visée */}
                <div className="relative">
                  <svg
                    viewBox={`0 0 ${qr.size} ${qr.size}`}
                    shapeRendering="crispEdges"
                    className="block w-full text-sn-slate"
                  >
                    <path d={qr.d} fill="currentColor" />
                  </svg>
                  <span className="absolute -left-2 -top-2 h-4 w-4 rounded-tl-md border-l-[3px] border-t-[3px] border-sn-orange" />
                  <span className="absolute -right-2 -top-2 h-4 w-4 rounded-tr-md border-r-[3px] border-t-[3px] border-sn-orange" />
                  <span className="absolute -bottom-2 -left-2 h-4 w-4 rounded-bl-md border-b-[3px] border-l-[3px] border-sn-orange" />
                  <span className="absolute -bottom-2 -right-2 h-4 w-4 rounded-br-md border-b-[3px] border-r-[3px] border-sn-orange" />
                </div>
                {/* Faux libellés d'interface */}
                <div className="mt-4 space-y-1.5">
                  <div className="h-2 w-3/4 rounded-full bg-gray-200" />
                  <div className="h-2 w-1/2 rounded-full bg-gray-100" />
                </div>
                {/* Barre de scan */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  {/* opacity-0 par défaut : sans animation (mouvement réduit),
                      la barre ne reste pas figée en bas de l'écran. */}
                  <div className="h-full animate-scan opacity-0 [animation-delay:900ms]">
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-sn-orange/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-[3px] bg-sn-orange shadow-[0_0_14px_3px_rgba(255,142,0,0.7)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo 1 : coucher de soleil sur un baobab */}
      <div className="absolute left-0 top-3 z-20 animate-pop [animation-delay:700ms]">
        <div className="animate-float-slow [animation-delay:0.4s]">
          <div className="w-24 -rotate-[9deg] rounded-sm bg-white p-1.5 pb-5 shadow-xl sm:w-28">
            <svg viewBox="0 0 80 100" className="block w-full">
              <defs>
                <linearGradient id="hero-sunset" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ff8e00" />
                  <stop offset="0.6" stopColor="#ffb347" />
                  <stop offset="1" stopColor="#ff6b6b" />
                </linearGradient>
              </defs>
              <rect width="80" height="100" fill="url(#hero-sunset)" />
              <circle cx="40" cy="64" r="15" fill="#fff6d6" />
              <path d="M0 100V82Q20 74 40 80T80 78V100Z" fill="#0f5c55" />
              <path d="M36 100C37 90 35 84 34 78H46C45 84 43 90 44 100Z" fill="#0b3f3a" />
              <g fill="#0b3f3a">
                <circle cx="30" cy="75" r="7" />
                <circle cx="40" cy="71" r="8" />
                <circle cx="50" cy="75" r="7" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Photo 2 : bord de mer */}
      <div className="absolute right-0 top-[30%] z-20 animate-pop [animation-delay:950ms]">
        <div className="animate-float-slow [animation-delay:1.2s]">
          <div className="w-24 rotate-[8deg] rounded-sm bg-white p-1.5 pb-5 shadow-xl sm:w-28">
            <svg viewBox="0 0 80 100" className="block w-full">
              <defs>
                <linearGradient id="hero-sea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#bdeee6" />
                  <stop offset="0.5" stopColor="#16877e" />
                  <stop offset="1" stopColor="#0f5c55" />
                </linearGradient>
              </defs>
              <rect width="80" height="100" fill="url(#hero-sea)" />
              <circle cx="58" cy="24" r="9" fill="#fff6d6" />
              <path d="M0 58Q10 52 20 58T40 58T60 58T80 58V100H0Z" fill="#ffffff" opacity="0.28" />
              <path d="M0 72Q10 66 20 72T40 72T60 72T80 72V100H0Z" fill="#ffffff" opacity="0.2" />
              <path d="M0 86Q10 80 20 86T40 86T60 86T80 86V100H0Z" fill="#ffffff" opacity="0.14" />
            </svg>
          </div>
        </div>
      </div>

      {/* Photo 3 : portrait de groupe */}
      <div className="absolute bottom-1 left-3 z-20 animate-pop [animation-delay:1200ms]">
        <div className="animate-float-slow [animation-delay:2s]">
          <div className="w-20 rotate-[5deg] rounded-sm bg-white p-1.5 pb-4 shadow-xl sm:w-24">
            <svg viewBox="0 0 80 80" className="block w-full">
              <defs>
                <linearGradient id="hero-group" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#526272" />
                  <stop offset="1" stopColor="#16877e" />
                </linearGradient>
              </defs>
              <rect width="80" height="80" fill="url(#hero-group)" />
              <g fill="#ffffff" opacity="0.9">
                <circle cx="27" cy="34" r="8" />
                <path d="M13 80c0-14 6-22 14-22s14 8 14 22Z" />
                <circle cx="54" cy="30" r="9" />
                <path d="M39 80c0-16 7-25 15-25s15 9 15 25Z" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Pastille de confirmation */}
      <div className="absolute bottom-6 right-0 z-30 animate-pop [animation-delay:1900ms] sm:bottom-8">
        <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-sn-slate shadow-lg ring-1 ring-black/5 dark:bg-slate-800 dark:text-white dark:ring-white/10">
          <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-sn-teal text-white">
            <span className="absolute inset-0 animate-ping rounded-full bg-sn-teal/50 [animation-delay:2.4s]" />
            <svg viewBox="0 0 20 20" className="relative h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10.5l4 4 8-9" />
            </svg>
          </span>
          {badge}
        </div>
      </div>
    </div>
  );
}
