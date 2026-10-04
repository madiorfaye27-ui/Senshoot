// Valide le paramètre `next` (page à rejoindre après connexion) pour éviter
// une redirection ouverte : seuls des chemins internes au site sont acceptés.
// Refuse les URL absolues ("https://…"), protocol-relative ("//evil.com"),
// les variantes avec antislash ("/\evil.com") et les caractères de contrôle.
export function safeNextPath(value: FormDataEntryValue | string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  if (value.length === 0 || value.length > 300) return null;
  if (!/^\/(?![/\\])/.test(value)) return null;
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  // Évite de renvoyer vers les routes d'authentification ou l'API elle-même.
  if (/^\/(?:en\/)?(?:login|register|api)(?:[/?#]|$)/.test(value)) return null;
  return value;
}
