-- =========================================================
-- Senshoot Sénégal — Commission variable selon le forfait
--
-- Jusqu'ici, photographers.commission_rate était un taux fixe (90% par
-- défaut) identique pour tout le monde. Nouvelle règle métier : un
-- photographe SANS forfait actif reverse une commission plus élevée à
-- la plateforme ; chaque forfait payant offre un taux progressivement
-- meilleur (la plateforme se contente de moins puisqu'elle encaisse
-- déjà l'abonnement). photographers.commission_rate n'est donc plus la
-- source de vérité pour le calcul (voir lib/utils/payouts.ts) — conservée
-- en base mais plus lue, au cas où elle serait réutilisée plus tard
-- pour un taux négocié au cas par cas.
-- =========================================================

alter table public.plans
  add column if not exists commission_rate numeric(5,2) not null default 90.00;

comment on column public.plans.commission_rate is '% du prix de vente reversé au photographe (le reste est la commission plateforme).';
comment on column public.photographers.commission_rate is 'Ancien taux fixe, superseded par plans.commission_rate — voir migration 0014. Non lu par le calcul de solde actuel.';

update public.plans set commission_rate = 80.00 where name = 'Starter';
update public.plans set commission_rate = 83.00 where name = 'Basic';
update public.plans set commission_rate = 85.00 where name = 'Pro';
update public.plans set commission_rate = 88.00 where name = 'Business';
update public.plans set commission_rate = 90.00 where name = 'Premium';
