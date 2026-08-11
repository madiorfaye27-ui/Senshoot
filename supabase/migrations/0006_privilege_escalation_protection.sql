-- =========================================================
-- Senshoot Sénégal — Protection contre l'escalade de privilèges
--
-- La migration 0004_rls_policies.sql couvre les policies RLS
-- standard (chacun lit/modifie ses propres données), mais elle
-- autorise un utilisateur à modifier SON PROPRE profil / profil
-- photographe sans restreindre certaines colonnes sensibles :
--
--   1. Un client pourrait modifier son profil et y écrire
--      role = 'admin' — la policy autorise l'update tant que
--      auth.uid() = id, sans regarder la valeur de "role".
--   2. Un photographe pourrait modifier son propre statut vers
--      "validated" (contournant la modération admin) ou augmenter
--      son propre commission_rate.
--
-- Ce fichier ferme ces deux trous avec des triggers qui annulent
-- silencieusement toute tentative de modification de ces colonnes
-- sensibles par quelqu'un qui n'est pas déjà admin.
-- =========================================================

-- ---------------------------------------------------------
-- Fonction utilitaire : l'utilisateur courant est-il admin ?
-- SECURITY DEFINER : nécessaire pour lire la table profiles sans
-- dépendre des policies RLS de profiles (évite toute récursion).
-- ---------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------
-- Un utilisateur ne peut jamais s'auto-attribuer le rôle admin
-- ---------------------------------------------------------
create or replace function prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() est NULL pour les appels via service_role (le client
  -- admin côté serveur, ex. panneau d'administration) : on les laisse
  -- toujours passer, c'est le seul chemin légitime pour promouvoir
  -- quelqu'un admin.
  if auth.uid() is null then
    return new;
  end if;

  if new.role = 'admin' and not is_admin() then
    if TG_OP = 'UPDATE' then
      new.role := old.role;
    else
      new.role := 'client';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on profiles;
create trigger trg_prevent_role_escalation
  before insert or update on profiles
  for each row execute function prevent_role_escalation();

-- ---------------------------------------------------------
-- Un photographe ne peut ni s'auto-valider, ni modifier son propre
-- taux de commission
-- ---------------------------------------------------------
create or replace function prevent_photographer_self_validation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if not is_admin() then
    if TG_OP = 'UPDATE' then
      new.status := old.status;
      new.commission_rate := old.commission_rate;
    else
      new.status := 'pending';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_photographer_self_validation on photographers;
create trigger trg_prevent_photographer_self_validation
  before insert or update on photographers
  for each row execute function prevent_photographer_self_validation();
