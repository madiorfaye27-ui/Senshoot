-- =========================================================
-- Senshoot Sénégal — Correction critique de sécurité
--
-- La policy de stockage créée dans 0003 autorisait TOUT utilisateur
-- authentifié à lire TOUS les fichiers du bucket privé
-- "photos-originals" — pas seulement les siens. Concrètement, n'importe
-- quel client connecté aurait pu récupérer n'importe quelle photo en
-- pleine qualité sans payer, en devinant ou en récupérant son chemin
-- (visible via la colonne "original_url" de la table photos).
--
-- Correction : plus AUCUNE policy de lecture n'est donnée sur ce
-- bucket aux utilisateurs. Seul le serveur (client admin / service_role,
-- qui contourne RLS) peut lire les originaux — pour le traitement
-- watermark et pour générer les URLs signées temporaires après paiement.
-- =========================================================

drop policy if exists "Utilisateurs authentifiés peuvent lire les originaux" on storage.objects;

-- L'upload reste autorisé (le photographe doit pouvoir déposer ses
-- fichiers), mais il ne pourra plus jamais les relire directement.

-- Deuxième faille corrigée dans le même mouvement : la policy d'upload
-- de 0003 autorisait N'IMPORTE QUEL utilisateur authentifié à déposer
-- des fichiers dans N'IMPORTE QUELLE galerie (le chemin de stockage
-- est ${gallery_id}/..., mais rien ne vérifiait que la galerie
-- appartenait bien à celui qui uploade). Un photographe malveillant
-- aurait pu polluer les galeries des autres.
drop policy if exists "Utilisateurs authentifiés peuvent uploader des originaux" on storage.objects;

create policy "Upload restreint à ses propres galeries"
  on storage.objects for insert
  with check (
    bucket_id = 'photos-originals'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from galleries
      join events on events.id = galleries.event_id
      join photographers on photographers.id = events.photographer_id
      where galleries.id::text = (storage.foldername(name))[1]
      and photographers.profile_id = auth.uid()
    )
  );

-- Troisième renfort : la limite de 25 Mo / type d'image n'était
-- vérifiée que côté navigateur (contournable avec un simple appel API
-- direct). On l'impose désormais au niveau du bucket lui-même, ce qui
-- est vérifié par Supabase Storage quelle que soit la façon dont la
-- requête d'upload est envoyée.
update storage.buckets
set file_size_limit = 26214400, -- 25 Mo
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'photos-originals';
