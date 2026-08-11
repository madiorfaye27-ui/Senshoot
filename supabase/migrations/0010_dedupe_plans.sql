-- =========================================================
-- Senshoot Sénégal — Correction des formules en double
--
-- La migration 0002_seed_plans.sql a été exécutée deux fois (une première
-- fois avant ce projet, une seconde fois en configurant Supabase) : comme
-- "plans" n'avait aucune contrainte d'unicité sur le nom, l'INSERT n'a
-- jamais renvoyé d'erreur et a simplement dupliqué les 5 formules,
-- d'où les répétitions vues sur /tarifs.
-- =========================================================

-- Garde la ligne la plus ancienne de chaque formule, supprime les doublons
delete from plans a
using plans b
where a.name = b.name
  and a.created_at > b.created_at;

-- Empêche que ça se reproduise si cette migration (ou 0002) est
-- relancée par erreur à l'avenir
alter table plans add constraint plans_name_key unique (name);
