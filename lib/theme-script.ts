/**
 * Injecté en inline dans le <head> (voir layout.tsx) pour appliquer la
 * classe "dark" avant le premier rendu — évite le flash clair→sombre
 * au chargement. Priorité : choix mémorisé > préférence système.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('senshoot-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored ? stored === 'dark' : prefersDark;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
