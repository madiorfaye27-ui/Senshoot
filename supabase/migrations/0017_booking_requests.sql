-- =========================================================
-- Senshoot Sénégal — Demandes de réservation
--
-- Permet à un visiteur de la fiche publique d'un photographe de
-- demander à réserver ses services pour une date, sans créer de
-- compte (même logique que l'achat de photos sans compte, migration
-- 0016). Le photographe voit la demande dans son tableau de bord et
-- reçoit un email ; le client est lui-même redirigé vers WhatsApp
-- avec un message pré-rempli à envoyer de son propre numéro — la
-- plateforme n'envoie jamais de message WhatsApp "à sa place".
-- =========================================================

create type booking_status as enum ('en_attente', 'contactee', 'refusee');

create table booking_requests (
  id uuid primary key default uuid_generate_v4(),
  photographer_id uuid not null references photographers(id) on delete cascade,
  event_date date not null,
  event_category event_category,
  client_name text not null,
  client_email text not null,
  client_whatsapp text,
  message text,
  status booking_status not null default 'en_attente',
  created_at timestamptz not null default now()
);

create index idx_booking_requests_photographer on booking_requests(photographer_id);

alter table booking_requests enable row level security;

-- Écriture (formulaire public, sans compte) : passe par le client admin
-- depuis la route API dédiée, jamais directement depuis le navigateur —
-- même schéma que les commandes invitées (migration 0016).
create policy "Un photographe voit ses propres demandes de réservation"
  on booking_requests for select
  using (
    exists (
      select 1 from photographers
      where photographers.id = booking_requests.photographer_id
      and photographers.profile_id = auth.uid()
    )
  );
