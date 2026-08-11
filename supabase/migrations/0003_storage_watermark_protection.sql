-- =========================================================
-- Senshoot Sénégal — Buckets de stockage et protection des photos
-- Basé sur le cahier des charges, section 6 (Traitement et protection)
--
-- Deux buckets distincts :
--  - photos-originals (PRIVÉ) : fichiers uploadés par les photographes,
--    jamais exposés publiquement. Accessible uniquement via le client
--    admin (service_role) côté serveur, ou via une URL signée temporaire
--    générée après vérification qu'une commande est payée.
--  - photos-public (PUBLIC) : uniquement les versions filigranées
--    générées automatiquement (voir lib/utils/watermark.ts). Seul le
--    serveur (service_role) peut y écrire — aucune policy d'insertion
--    n'est donnée aux utilisateurs authentifiés, ce qui empêche un
--    photographe de publier une image non filigranée en contournant
--    le traitement serveur.
-- =========================================================

insert into storage.buckets (id, name, public)
values
  ('photos-originals', 'photos-originals', false),
  ('photos-public', 'photos-public', true)
on conflict (id) do nothing;

-- Un photographe authentifié peut déposer ses originaux
create policy "Utilisateurs authentifiés peuvent uploader des originaux"
  on storage.objects for insert
  with check (bucket_id = 'photos-originals' and auth.role() = 'authenticated');

-- Un utilisateur authentifié peut lire ce qu'il a déposé (aperçu avant
-- traitement) ; la lecture pour téléchargement final passe par une URL
-- signée générée côté serveur, qui contourne cette policy via service_role.
create policy "Utilisateurs authentifiés peuvent lire les originaux"
  on storage.objects for select
  using (bucket_id = 'photos-originals' and auth.role() = 'authenticated');

-- Tout le monde peut voir les photos filigranées (galerie publique)
create policy "Les photos filigranées sont publiques"
  on storage.objects for select
  using (bucket_id = 'photos-public');

-- Aucune policy d'insertion n'est créée pour "photos-public" côté client :
-- seul le service_role (routes API serveur) peut y écrire.
