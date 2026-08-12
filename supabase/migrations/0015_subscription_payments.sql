-- =========================================================
-- Senshoot Sénégal — Paiement réel des abonnements
--
-- Jusqu'ici, la page /tarifs renvoyait toujours vers /register, même
-- pour un photographe déjà connecté : il n'existait aucun moyen réel
-- de payer une formule (la table "subscriptions" n'était alimentée que
-- manuellement en SQL). Cette migration ajoute le suivi du paiement
-- d'abonnement, sur le même schéma que orders/payments pour l'achat
-- de photos (voir migration 0001) : paiement mensuel ponctuel (pas de
-- prélèvement récurrent automatique — le photographe repaie chaque
-- mois, relancé par l'email de rappel d'expiration déjà en place).
-- =========================================================

create table subscription_payments (
  id uuid primary key default uuid_generate_v4(),
  photographer_id uuid not null references photographers(id) on delete cascade,
  plan_id uuid not null references plans(id),
  provider text not null,                  -- stripe | kkiapay
  provider_transaction_id text,
  amount_fcfa integer not null,
  status payment_status not null default 'en_attente',
  raw_response jsonb,
  created_at timestamptz not null default now()
);

-- Empêche qu'une même transaction confirmée n'active deux abonnements
-- différents — même protection anti-rejeu que migration 0011 pour les
-- commandes de photos.
alter table subscription_payments
  add constraint subscription_payments_provider_transaction_id_key
  unique (provider_transaction_id);

alter table subscription_payments enable row level security;

create policy "Un photographe voit ses propres paiements d'abonnement"
  on subscription_payments for select
  using (
    exists (
      select 1 from photographers
      where photographers.id = subscription_payments.photographer_id
      and photographers.profile_id = auth.uid()
    )
  );

-- L'insertion et les mises à jour de statut passent par le client admin
-- (service_role) depuis les routes API dédiées, jamais directement
-- depuis le navigateur — même schéma que "payments" (migration 0004).
