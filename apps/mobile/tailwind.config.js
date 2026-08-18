/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Same palette as the web app's tailwind.config.ts ("Charte graphique
      // SENSHOOTSN"), so the two apps read as the same brand.
      colors: {
        'sn-orange': '#ff8e00',
        'sn-teal': '#16877e',
        'sn-slate': '#526272',
        'sn-white': '#ffffff',
      },
    },
  },
  plugins: [],
};
