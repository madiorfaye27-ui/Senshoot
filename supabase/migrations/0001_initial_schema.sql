-- =========================================================
-- Senshoot Sénégal — Schéma de base de données V1
-- Basé sur le cahier des charges, section 18 (Base de données)
-- =========================================================

-- Extension nécessaire pour les UUID
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. PROFILES (étend auth.users de Supabase)
-- ---------------------------------------------------------
create type user_role as enum ('client', 'photographer', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  first_name text,
  last_name text,
  phone text,
  city text,
  country text default 'Sénégal',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 2. PHOTOGRAPHERS
-- ---------------------------------------------------------
create type photographer_status as enum ('pending', 'validated', 'rejected', 'suspended');

create table photographers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  slug text unique not null,               -- utilisé dans /photographe/[slug]
  studio_name text,
  description text,
  logo_url text,
  specialties text[],
  social_links jsonb default '{}',
  status photographer_status not null default 'pending',
  commission_rate numeric(5,2) not null default 90.00, -- % reversé au photographe
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 3. PLANS (abonnements)
-- ---------------------------------------------------------
create table plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                      -- Starter, Basic, Pro, Business, Premium
  price_fcfa integer not null,
  max_events integer,
  max_storage_gb integer,
  max_photos integer,
  max_galleries integer,
  max_downloads integer,
  max_collaborators integer default 0,
  features jsonb default '[]',
  is_active boolean not null default true,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 4. SUBSCRIPTIONS
-- ---------------------------------------------------------
create type subscription_status as enum (
  'active', 'past_due', 'canceled', 'suspended', 'grace_period'
);

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  photographer_id uuid not null references photographers(id) on delete cascade,
  plan_id uuid not null references plans(id),
  status subscription_status not null default 'active',
  stripe_subscription_id text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  renewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 5. EVENTS
-- ---------------------------------------------------------
create type event_category as enum (
  'mariage', 'bapteme', 'anniversaire', 'conference', 'concert',
  'festival', 'sport', 'professionnel', 'remise_diplomes',
  'scolaire', 'institutionnel', 'shooting', 'autre'
);
create type event_status as enum ('brouillon', 'publie', 'archive');
create type event_visibility as enum ('public', 'prive', 'sur_invitation');

create table events (
  id uuid primary key default uuid_generate_v4(),
  photographer_id uuid not null references photographers(id) on delete cascade,
  name text not null,
  description text,
  event_date date,
  event_time time,
  location text,
  city text,
  organizer text,
  category event_category not null default 'autre',
  cover_image_url text,
  status event_status not null default 'brouillon',
  visibility event_visibility not null default 'public',
  qr_code_url text,
  qr_short_code text unique,               -- code utilisé dans l'URL courte du QR
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 6. GALLERIES
-- ---------------------------------------------------------
create table galleries (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 7. PHOTOS
-- ---------------------------------------------------------
create table photos (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  photo_number text,                       -- référence recherche par numéro
  original_url text not null,              -- stockage privé
  web_url text,                            -- version web compressée
  thumbnail_url text,
  watermark_url text,                      -- version publique avec filigrane
  price_fcfa integer not null default 2000,
  width integer,
  height integer,
  views_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_photos_gallery on photos(gallery_id);

-- ---------------------------------------------------------
-- 8. ORDERS
-- ---------------------------------------------------------
create type order_status as enum (
  'en_attente', 'payee', 'echouee', 'annulee', 'remboursee'
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,       -- ex : SS-2026-000001
  client_id uuid not null references profiles(id),
  photographer_id uuid not null references photographers(id),
  event_id uuid references events(id),
  total_fcfa integer not null,
  payment_method text,                     -- wave | orange_money | paydunya | stripe
  status order_status not null default 'en_attente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 9. ORDER_ITEMS
-- ---------------------------------------------------------
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  photo_id uuid not null references photos(id),
  unit_price_fcfa integer not null,
  downloaded boolean not null default false,
  downloaded_at timestamptz
);

-- ---------------------------------------------------------
-- 10. PAYMENTS
-- ---------------------------------------------------------
create type payment_status as enum (
  'en_attente', 'initie', 'reussi', 'echoue', 'annule', 'rembourse'
);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,                  -- wave | orange_money | paydunya | stripe
  provider_transaction_id text,
  amount_fcfa integer not null,
  status payment_status not null default 'en_attente',
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Row Level Security (RLS) — activé par défaut sur toutes les tables
-- Les policies détaillées (client / photographe / admin) sont à écrire
-- dans une migration séparée une fois les rôles applicatifs finalisés.
-- ---------------------------------------------------------
alter table profiles enable row level security;
alter table photographers enable row level security;
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table events enable row level security;
alter table galleries enable row level security;
alter table photos enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

-- Exemple de policy de base : un utilisateur peut lire son propre profil
create policy "Un utilisateur peut voir son propre profil"
  on profiles for select
  using (auth.uid() = id);

-- Les événements publiés et publics sont visibles par tous
create policy "Les événements publics sont visibles par tous"
  on events for select
  using (visibility = 'public' and status = 'publie');

-- Les plans actifs sont visibles par tous
create policy "Les plans actifs sont visibles par tous"
  on plans for select
  using (is_active = true);
