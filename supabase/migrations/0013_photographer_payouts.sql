-- =========================================================
-- Senshoot Sénégal — Retraits photographes
--
-- Le photographe peut demander à tout moment le retrait de ses revenus
-- disponibles (commission déjà déduite selon photographers.commission_rate).
-- Il n'y a pas d'étape d'approbation : la demande est immédiatement
-- valide, l'admin n'a qu'à effectuer le virement réel (Wave/Orange
-- Money/banque) hors plateforme et à marquer la demande comme payée —
-- il n'existe pas encore d'API de décaissement automatique branchée
-- (le compte marchand KKiaPay n'est pas activé pour ça).
-- =========================================================

create type payout_status as enum ('pending', 'completed', 'rejected');

create table payouts (
  id uuid primary key default uuid_generate_v4(),
  photographer_id uuid not null references photographers(id) on delete cascade,
  amount_fcfa integer not null check (amount_fcfa > 0),
  payout_method text not null,             -- wave | orange_money | banque
  payout_details text not null,            -- numéro Wave/OM ou coordonnées bancaires
  status payout_status not null default 'pending',
  admin_note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table payouts enable row level security;

-- Le photographe voit et crée ses propres demandes de retrait.
create policy "Un photographe voit ses propres retraits"
  on payouts for select
  using (
    exists (
      select 1 from photographers
      where photographers.id = payouts.photographer_id
      and photographers.profile_id = auth.uid()
    )
  );

create policy "Un photographe crée ses propres demandes de retrait"
  on payouts for insert
  with check (
    exists (
      select 1 from photographers
      where photographers.id = payouts.photographer_id
      and photographers.profile_id = auth.uid()
    )
  );

-- Pas de policy UPDATE : seul le client admin (service_role, qui
-- bypass RLS) peut faire passer une demande à "completed"/"rejected"
-- — cf. app/api/admin/photographers/[photographerId]/status/route.ts
-- pour le même schéma de protection déjà utilisé sur ce projet.
