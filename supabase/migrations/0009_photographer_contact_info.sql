-- =========================================================
-- Senshoot Sénégal — Annuaire des photographes
--
-- Ajoute les champs publics nécessaires pour aider les clients à trouver
-- un photographe pour leur événement (ville, moyens de contact), affichés
-- sur la page d'accueil, l'annuaire /photographes et la fiche publique
-- /photographe/[slug].
--
-- Aucune nouvelle policy RLS nécessaire : la policy existante "Les
-- photographes validés sont visibles publiquement" (migration 0004)
-- couvre déjà ces nouvelles colonnes, et "Un photographe peut modifier
-- son propre profil" leur permet déjà de les éditer.
-- =========================================================

alter table photographers
  add column city text,
  add column contact_phone text,
  add column contact_whatsapp text,
  add column contact_email text;
