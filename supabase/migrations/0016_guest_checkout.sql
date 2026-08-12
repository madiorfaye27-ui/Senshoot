-- =========================================================
-- Senshoot Sénégal — Achat sans compte
--
-- Jusqu'ici, orders.client_id était obligatoire et lié à un compte
-- connecté (auth.getUser()) : impossible pour un invité d'acheter une
-- photo sans s'inscrire d'abord. On rend client_id optionnel et on
-- ajoute guest_email pour identifier l'acheteur invité (c'est le seul
-- moyen de lui envoyer son lien d'accès à usage unique, puisqu'il n'a
-- pas de tableau de bord).
-- =========================================================

alter table public.orders
  alter column client_id drop not null;

alter table public.orders
  add column if not exists guest_email text;

alter table public.orders
  add constraint orders_client_or_guest_check
  check (client_id is not null or guest_email is not null);

comment on column public.orders.guest_email is 'Email de l''acheteur quand la commande est passée sans compte (client_id null).';
