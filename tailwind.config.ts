import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Charte graphique SENSHOOTSN
        'sn-orange': '#ff8e00',   // Orange Flash
        'sn-teal': '#16877e',     // Vert Sarcelle
        'sn-slate': '#526272',    // Bleu Gris Foncé
        'sn-white': '#ffffff',
      },
      fontFamily: {
        sans: ['Montserrat', 'Poppins', 'Open Sans', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        // Variante plus ample pour les éléments de la scène du hero
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        // Apparition "ressort" : petit dépassement avant de se stabiliser
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.6) translateY(16px)' },
          '70%': { opacity: '1', transform: 'scale(1.06) translateY(0)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        // Balayage de scanner : la barre descend du haut vers le bas de
        // l'écran. L'état final (100%) est invisible : c'est celui qu'on
        // voit si les animations sont désactivées.
        scan: {
          '0%': { opacity: '0', transform: 'translateY(-100%)' },
          '12%': { opacity: '1' },
          '88%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(0)' },
        },
        // Tracé progressif d'un trait SVG (pathLength="1")
        draw: {
          '0%': { 'stroke-dasharray': '1', 'stroke-dashoffset': '1' },
          '100%': { 'stroke-dasharray': '1', 'stroke-dashoffset': '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.8s ease-out both',
        float: 'float 5s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        pop: 'pop 0.8s cubic-bezier(0.34, 1.2, 0.64, 1) both',
        scan: 'scan 2.8s ease-in-out infinite',
        draw: 'draw 0.9s cubic-bezier(0.65, 0, 0.35, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
