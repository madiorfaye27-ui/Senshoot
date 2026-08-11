-- =========================================================
-- Senshoot Sénégal — Données initiales des formules d'abonnement
-- Basé sur le cahier des charges, section 10
-- =========================================================

insert into plans (name, price_fcfa, max_events, max_storage_gb, max_photos, max_galleries, max_downloads, sort_order)
values
  ('Starter', 10000, 2, 5, 500, 2, 200, 1),
  ('Basic', 15000, 5, 15, 2000, 5, 1000, 2),
  ('Pro', 20000, 10, 40, 5000, 10, 3000, 3),
  ('Business', 25000, 25, 100, 15000, 25, 8000, 4),
  ('Premium', 30000, null, null, null, null, null, 5);
