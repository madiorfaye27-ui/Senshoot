-- =========================================================
-- Senshoot Sénégal — Application réelle du quota de stockage par forfait
--
-- plans.max_storage_gb existait déjà (0002_seed_plans.sql) mais n'était
-- qu'affiché sur /tarifs, jamais vérifié à l'upload. Cette migration
-- ajoute de quoi calculer l'espace réellement utilisé par un photographe :
--  - photos.storage_bytes : taille cumulée (original + web + thumbnail)
--    enregistrée par app/api/photos/route.ts au moment de l'upload.
--  - get_photographer_storage_bytes() : somme ces tailles pour toutes
--    les photos d'un photographe, via galleries -> events. Une fonction
--    SQL plutôt qu'une agrégation côté client pour éviter de rapatrier
--    une ligne par photo (un forfait Business autorise jusqu'à 15 000
--    photos) à chaque vérification de quota.
-- =========================================================

alter table photos add column if not exists storage_bytes bigint not null default 0;

create or replace function get_photographer_storage_bytes(p_photographer_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(photos.storage_bytes), 0)
  from photos
  join galleries on galleries.id = photos.gallery_id
  join events on events.id = galleries.event_id
  where events.photographer_id = p_photographer_id;
$$;
