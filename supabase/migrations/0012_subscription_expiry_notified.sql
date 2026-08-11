-- =========================================================
-- Senshoot Sénégal — Suivi de l'email de rappel d'expiration
--
-- Sans cette colonne, une tâche planifiée qui tourne plusieurs fois
-- (ex. tous les jours) renverrait le même email de rappel à chaque
-- exécution tant que l'abonnement n'a pas expiré ou été renouvelé.
-- =========================================================

alter table public.subscriptions
  add column if not exists expiry_notified_at timestamptz;
