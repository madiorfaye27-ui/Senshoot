-- =========================================================
-- Senshoot Sénégal — Suppression "douce" du contenu déjà vendu
--
-- Jusqu'ici, supprimer une photo ou un événement ayant au moins une
-- commande était totalement bloqué (voir app/api/photos/[photoId]/route.ts
-- et app/api/photographers/events/[eventId]/route.ts), pour ne jamais
-- faire disparaître l'accès d'un client ayant payé.
--
-- Nouvelle règle métier : le photographe doit pouvoir supprimer même du
-- contenu déjà vendu — mais un client qui a payé doit conserver l'accès
-- à sa photo dans son compte ("Mes téléchargements"). On distingue donc :
--  - Jamais acheté  -> suppression physique (comportement inchangé) :
--    ligne supprimée en base, fichiers Storage supprimés.
--  - Déjà acheté     -> suppression "douce" : deleted_at renseigné, la
--    ligne ET les fichiers Storage originaux restent intacts (le
--    téléchargement post-paiement, /api/downloads/[itemId], lit
--    directement photos.original_url et ne filtre jamais sur deleted_at).
--    Seul l'AFFICHAGE (galerie publique, tableaux de bord, annuaire) est
--    filtré pour ne plus montrer ce contenu.
-- =========================================================

alter table photos add column if not exists deleted_at timestamptz;
alter table events add column if not exists deleted_at timestamptz;
