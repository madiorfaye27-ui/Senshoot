-- =========================================================
-- Senshoot Sénégal — Politiques de sécurité (RLS) complètes
--
-- La migration 0001 activait la RLS sur toutes les tables mais ne
-- posait que 2 policies (lecture du profil, lecture des événements
-- publics). Résultat : par défaut, PostgreSQL/Supabase REFUSE toute
-- opération non explicitement autorisée — donc l'inscription, la
-- création d'événements, l'upload de photos ou la création de
-- commandes pouvaient échouer silencieusement selon le client utilisé.
--
-- Cette migration ajoute les règles manquantes, avec le principe :
-- chacun ne peut lire/modifier que SES PROPRES données, sauf ce qui
-- est explicitement public (photographes validés, événements publiés,
-- plans actifs).
-- =========================================================

-- -----------------------------------------------------------------
-- PROFILES
-- -----------------------------------------------------------------
create policy "Un utilisateur peut créer son propre profil"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Un utilisateur peut modifier son propre profil"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -----------------------------------------------------------------
-- PHOTOGRAPHERS
-- -----------------------------------------------------------------
create policy "Un utilisateur peut créer son propre profil photographe"
  on photographers for insert
  with check (auth.uid() = profile_id);

create policy "Un photographe peut voir son propre profil"
  on photographers for select
  using (auth.uid() = profile_id);

create policy "Les photographes validés sont visibles publiquement"
  on photographers for select
  using (status = 'validated');

create policy "Un photographe peut modifier son propre profil"
  on photographers for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- -----------------------------------------------------------------
-- EVENTS (la policy de lecture publique existe déjà, migration 0001)
-- -----------------------------------------------------------------
create policy "Un photographe peut voir ses propres événements"
  on events for select
  using (
    photographer_id in (
      select id from photographers where profile_id = auth.uid()
    )
  );

create policy "Un photographe peut créer ses propres événements"
  on events for insert
  with check (
    photographer_id in (
      select id from photographers where profile_id = auth.uid()
    )
  );

create policy "Un photographe peut modifier ses propres événements"
  on events for update
  using (
    photographer_id in (
      select id from photographers where profile_id = auth.uid()
    )
  )
  with check (
    photographer_id in (
      select id from photographers where profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------
-- GALLERIES (visibles si l'événement parent est public OU si le
-- photographe est propriétaire de l'événement)
-- -----------------------------------------------------------------
create policy "Galeries visibles si événement public"
  on galleries for select
  using (
    event_id in (
      select id from events where visibility = 'public' and status = 'publie'
    )
  );

create policy "Un photographe peut voir ses propres galeries"
  on galleries for select
  using (
    event_id in (
      select e.id from events e
      join photographers p on p.id = e.photographer_id
      where p.profile_id = auth.uid()
    )
  );

create policy "Un photographe peut créer des galeries pour ses événements"
  on galleries for insert
  with check (
    event_id in (
      select e.id from events e
      join photographers p on p.id = e.photographer_id
      where p.profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------
-- PHOTOS (même logique que galleries, via la galerie parente)
-- -----------------------------------------------------------------
create policy "Photos visibles si événement public"
  on photos for select
  using (
    gallery_id in (
      select g.id from galleries g
      join events e on e.id = g.event_id
      where e.visibility = 'public' and e.status = 'publie'
    )
  );

create policy "Un photographe peut voir les photos de ses galeries"
  on photos for select
  using (
    gallery_id in (
      select g.id from galleries g
      join events e on e.id = g.event_id
      join photographers p on p.id = e.photographer_id
      where p.profile_id = auth.uid()
    )
  );

create policy "Un photographe peut ajouter des photos à ses galeries"
  on photos for insert
  with check (
    gallery_id in (
      select g.id from galleries g
      join events e on e.id = g.event_id
      join photographers p on p.id = e.photographer_id
      where p.profile_id = auth.uid()
    )
  );

create policy "Un client peut voir les photos de ses commandes"
  on photos for select
  using (
    id in (
      select oi.photo_id from order_items oi
      join orders o on o.id = oi.order_id
      where o.client_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------
-- ORDERS — un client crée et voit ses propres commandes ; un
-- photographe voit les commandes passées sur ses événements. Le
-- changement de STATUT (paiement confirmé) passe uniquement par le
-- webhook Stripe côté serveur (service_role, qui contourne la RLS) —
-- aucune policy UPDATE n'est donnée aux utilisateurs, pour empêcher
-- un client de s'auto-valider une commande impayée.
-- -----------------------------------------------------------------
create policy "Un client peut créer sa propre commande"
  on orders for insert
  with check (auth.uid() = client_id);

create policy "Un client peut voir ses propres commandes"
  on orders for select
  using (auth.uid() = client_id);

create policy "Un photographe peut voir les commandes sur ses événements"
  on orders for select
  using (
    photographer_id in (
      select id from photographers where profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------
-- ORDER_ITEMS — visibles/insérables seulement via une commande dont
-- l'utilisateur est propriétaire.
-- -----------------------------------------------------------------
create policy "Un client peut ajouter des articles à sa propre commande"
  on order_items for insert
  with check (
    order_id in (select id from orders where client_id = auth.uid())
  );

create policy "Un client peut voir les articles de ses commandes"
  on order_items for select
  using (
    order_id in (select id from orders where client_id = auth.uid())
  );

-- -----------------------------------------------------------------
-- SUBSCRIPTIONS — un photographe voit son propre abonnement.
-- La création/modification passe par le serveur (webhook de paiement
-- d'abonnement, à venir) donc aucune policy INSERT/UPDATE ici.
-- -----------------------------------------------------------------
create policy "Un photographe peut voir son propre abonnement"
  on subscriptions for select
  using (
    photographer_id in (
      select id from photographers where profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------
-- PAYMENTS — aucune lecture/écriture directe par les utilisateurs.
-- Le statut de paiement se consulte via orders.status ; les lignes de
-- payments elles-mêmes ne sont manipulées que par le serveur
-- (service_role, dans app/api/orders et app/api/payments/webhook).
-- -----------------------------------------------------------------
-- (intentionnellement aucune policy : accès refusé par défaut pour
-- anon/authenticated, seul service_role peut lire/écrire)
