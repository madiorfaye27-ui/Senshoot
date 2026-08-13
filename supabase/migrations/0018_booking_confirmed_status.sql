-- =========================================================
-- Senshoot Sénégal — Statut "confirmée" pour les réservations
--
-- Ajoute un statut distinct de "contactee" : le photographe contacte
-- d'abord le client, puis marque la date comme confirmée une fois
-- l'accord conclu. Le calendrier du dashboard photographe (migration
-- suivante côté code) n'affiche que les réservations à ce statut.
-- =========================================================

alter type booking_status add value 'confirmee';
