-- =========================================================
-- Senshoot Sénégal — Bucket pour la photo de profil du photographe
--
-- Public (visible sur l'annuaire et la fiche /photographe/[slug]), mais
-- écrit uniquement par le serveur (service_role, voir
-- app/api/photographers/profile/route.ts) — même schéma que "photos-public"
-- dans 0003_storage_watermark_protection.sql : aucune policy d'insertion
-- n'est donnée côté client.
-- =========================================================

insert into storage.buckets (id, name, public)
values ('photographer-avatars', 'photographer-avatars', true)
on conflict (id) do nothing;

create policy "Les photos de profil sont publiques"
  on storage.objects for select
  using (bucket_id = 'photographer-avatars');
