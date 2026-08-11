-- =========================================================
-- Senshoot Sénégal — Liens/QR à usage unique
--
-- Deux mécanismes distincts, tous deux à usage unique, qui viennent
-- s'ajouter au QR public de l'événement (qui reste réutilisable par
-- tous les invités — ne pas confondre les deux) :
--
-- 1. order_access_tokens : après un paiement confirmé, un lien/QR
--    personnel est généré pour accéder directement aux photos
--    achetées, sans ressaisir de mot de passe. Une fois ouvert une
--    première fois, il est marqué "used_at" — les ouvertures
--    suivantes renvoient le client vers la connexion classique
--    (son compte reste l'accès durable et sécurisé).
--
-- 2. event_client_links : le photographe peut générer, sur place,
--    un lien/QR individuel par client pour l'emmener directement
--    vers la galerie de son événement. À usage unique lui aussi,
--    mais indépendant par client — n'affecte jamais les autres.
-- =========================================================

create table order_access_tokens (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  token text unique not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_order_access_tokens_order on order_access_tokens(order_id);

alter table order_access_tokens enable row level security;

-- Aucune policy générale : la page publique d'accès (/acces/[token]) et
-- le webhook de paiement utilisent le client admin (service_role), qui
-- contourne la RLS — cohérent avec le traitement de la table "payments"
-- (voir migration 0004). Le client authentifié peut néanmoins consulter
-- le token de SES propres commandes, pour l'afficher dans son dashboard.
create policy "Un client peut voir les tokens d'accès de ses commandes"
  on order_access_tokens for select
  using (
    order_id in (select id from orders where client_id = auth.uid())
  );

create table event_client_links (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  token text unique not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_event_client_links_event on event_client_links(event_id);

alter table event_client_links enable row level security;

create policy "Un photographe peut créer des liens clients pour ses événements"
  on event_client_links for insert
  with check (
    event_id in (
      select id from events where photographer_id in (
        select id from photographers where profile_id = auth.uid()
      )
    )
  );

create policy "Un photographe peut voir les liens clients de ses événements"
  on event_client_links for select
  using (
    event_id in (
      select id from events where photographer_id in (
        select id from photographers where profile_id = auth.uid()
      )
    )
  );
