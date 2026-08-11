-- =========================================================
-- Senshoot Sénégal — Création automatique du profil
--
-- Bug corrigé : juste après l'inscription (auth.signUp), il n'existe
-- pas encore de session active tant que l'email n'est pas confirmé.
-- Or la policy RLS "Un utilisateur peut créer son propre profil"
-- exige auth.uid() = id. Résultat : l'insertion manuelle du profil
-- depuis l'API (app/api/auth/register/route.ts) échouait toujours.
--
-- Solution standard Supabase : un trigger SECURITY DEFINER sur
-- auth.users qui crée la ligne profiles (et photographers le cas
-- échéant) côté serveur, indépendamment de toute session client.
-- =========================================================

-- Un seul profil photographe par utilisateur (nécessaire pour l'ON CONFLICT ci-dessous)
alter table public.photographers
  add constraint photographers_profile_id_key unique (profile_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
  v_first_name text;
  v_last_name text;
  v_slug text;
begin
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'client');
  v_first_name := new.raw_user_meta_data->>'first_name';
  v_last_name := new.raw_user_meta_data->>'last_name';

  insert into public.profiles (id, role, first_name, last_name)
  values (new.id, v_role, v_first_name, v_last_name)
  on conflict (id) do nothing;

  if v_role = 'photographer' then
    v_slug := lower(regexp_replace(
      coalesce(v_first_name, '') || '-' || coalesce(v_last_name, ''),
      '[^a-zA-Z0-9]+', '-', 'g'
    )) || '-' || substr(new.id::text, 1, 6);

    insert into public.photographers (profile_id, slug, status)
    values (new.id, v_slug, 'pending')
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
