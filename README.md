# Senshoot Sénégal

Plateforme web mettant en relation photographes et clients au Sénégal :
créez un événement, importez vos photos, générez un QR Code, partagez votre
galerie et vendez vos photos en ligne.

Basé sur le cahier des charges V1 (shootsenegal.com).

## Stack technique

- **Frontend / Backend** : Next.js 14 (App Router) + TypeScript
- **Base de données & Auth** : Supabase (PostgreSQL, Auth, Storage, RLS)
- **Paiement** : Stripe (Wave / Orange Money / PayDunya à intégrer en modules séparés, cf. `app/api/payments`)
- **QR Code** : librairie `qrcode`
- **Style** : Tailwind CSS (charte graphique SENSHOOTSN : orange `#ff8e00`, vert sarcelle `#16877e`, bleu-gris `#526272`)

## Ouvrir le projet dans Visual Studio Code

1. Décompressez le dossier `shootsenegal`.
2. Ouvrez VS Code → `Fichier` → `Ouvrir le dossier...` → sélectionnez `shootsenegal`.
3. Ouvrez un terminal intégré (`Terminal` → `Nouveau terminal`) et installez les dépendances :

   ```bash
   npm install
   ```

4. Copiez `.env.example` en `.env.local` et complétez les clés (voir ci-dessous).
5. Lancez le serveur de développement :

   ```bash
   npm run dev
   ```

6. Ouvrez [http://localhost:3000](http://localhost:3000).

Extensions VS Code recommandées : **Tailwind CSS IntelliSense**, **ESLint**, **Prisma/Supabase** (optionnel).

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans `Project Settings → API`, récupérez `URL`, `anon key` et `service_role key` → à coller dans `.env.local`.
3. Dans l'éditeur SQL de Supabase, exécutez dans l'ordre :
   - `supabase/migrations/0001_initial_schema.sql` (tables, types, RLS de base)
   - `supabase/migrations/0002_seed_plans.sql` (formules d'abonnement par défaut)
   - `supabase/migrations/0003_storage_watermark_protection.sql` (crée les buckets `photos-originals` privé et `photos-public`, avec leurs policies)
4. Vérifiez dans `Storage` que les deux buckets sont bien créés : `photos-originals` (icône cadenas = privé) et `photos-public` (public).
5. (Optionnel) régénérez les types TypeScript à jour :

   ```bash
   npx supabase gen types typescript --project-id VOTRE_PROJECT_ID > lib/supabase/database.types.ts
   ```

## Configuration Stripe

1. Récupérez vos clés de test sur [dashboard.stripe.com](https://dashboard.stripe.com/test/apikeys).
2. Complétez `STRIPE_SECRET_KEY` et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` dans `.env.local`.
3. Pour tester les webhooks en local avec la Stripe CLI :

   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

   Copiez le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`.

## Structure du projet

```
app/
  (public)/        Site vitrine : accueil, tarifs, photographes, FAQ...
  (auth)/          Connexion / inscription
  (client)/        Espace client (commandes, téléchargements)
  (photographer)/  Espace photographe (événements, galeries, ventes, abonnement)
  (admin)/         Administration
  galerie/[eventId] Galerie publique accessible via le QR Code
  photographe/[slug] Profil public d'un photographe
  api/             Routes API (auth, events, photos, orders, payments, webhook)
components/        Composants réutilisables (layout, galerie, upload photos...)
lib/
  supabase/        Clients Supabase (browser, server, admin, middleware)
  stripe/          Client Stripe
  utils/           Formatage (FCFA, dates, numéro de commande)
supabase/migrations/ Schéma SQL + données initiales
```

## État d'avancement (V1)

✅ Fait :
- Architecture Next.js + Supabase + Stripe
- Schéma de base de données complet (10 entités, section 18 du CDC)
- Authentification (inscription client/photographe, connexion)
- Création d'événement + génération automatique du QR Code
- Import de photos avec **filigranage automatique côté serveur** (original privé, bucket public = filigrané uniquement)
- Téléchargement haute qualité sécurisé par URL signée temporaire, réservé aux commandes payées
- Galerie publique avec sélection multiple et panier
- Commande + paiement Stripe + webhook de confirmation serveur
- Dashboards client / photographe / admin (bases)
- Site vitrine (accueil, tarifs, comment ça marche, à propos, contact, photographes)

🚧 À compléter pour une V1 complète (voir cahier des charges) :
- Intégration Wave, Orange Money, PayDunya (modules indépendants dans `app/api/payments`)
- Gestion des rôles/permissions fine (RLS avancée par table)
- Pages de modération et gestion utilisateurs côté admin
- Notifications email (inscription, commande, expiration abonnement)
- Recherche par nom/numéro/catégorie dans les galeries volumineuses
- Version anglaise (i18n, fichiers `fr.json` / `en.json`)
- Tests de charge sur galeries de 1000+ photos

## Protection des photos (filigrane automatique)

Quand un photographe importe des photos (`components/photographer/PhotoUploader.tsx`) :

1. L'original est envoyé dans le bucket **privé** `photos-originals` (jamais public).
2. Le serveur (`app/api/photos/route.ts`) télécharge cet original, génère avec
   `sharp` deux versions **filigranées** (« SENSHOOT SÉNÉGAL » répété en
   diagonale) — une version web et une miniature — via `lib/utils/watermark.ts`.
3. Seules ces versions filigranées sont envoyées dans le bucket **public**
   `photos-public`. C'est ce que voient les clients dans la galerie et le panier.
4. Après paiement confirmé (webhook Stripe → statut `payee`), le client peut
   télécharger l'original en pleine qualité via `app/api/downloads/[itemId]`,
   qui génère une **URL signée temporaire** (5 minutes) — l'original n'est
   jamais accessible par une URL publique fixe.

Aucune policy d'upload n'est donnée aux utilisateurs sur le bucket
`photos-public` : seul le serveur (`service_role`) peut y écrire, ce qui
empêche un photographe de contourner le filigranage en uploadant directement
une image en pleine qualité dans l'espace public.

## Sécurité

- **Clés sensibles** : `SUPABASE_SERVICE_ROLE_KEY` et `STRIPE_SECRET_KEY` ne sont
  jamais exposées côté client — elles ne sont utilisées que dans les routes
  API (`app/api/**/route.ts`), jamais dans un composant `'use client'`.
- **Row Level Security (RLS)** : activée sur toutes les tables Supabase, avec
  des policies complètes par rôle (`supabase/migrations/0004_rls_policies.sql`) —
  chacun ne peut lire/modifier que ses propres données ; les statuts de
  paiement et de commande ne sont modifiables que par le serveur
  (`service_role`), jamais par un utilisateur.
- **Contrôle d'accès par rôle** : le middleware (`lib/supabase/middleware.ts`)
  vérifie non seulement que l'utilisateur est connecté, mais aussi que son
  rôle correspond bien à l'espace visité (`/dashboard` = photographe,
  `/client` = client, `/admin` = admin) — un client ne peut pas accéder au
  tableau de bord d'un photographe ou d'un admin en changeant l'URL.
- **Protection CSRF** : les routes qui modifient des données (connexion,
  inscription, déconnexion, création d'événement) vérifient que la requête
  provient bien du site lui-même (`lib/utils/csrf.ts`).
- **Limitation de débit (rate limiting)** : connexion (5/min), inscription
  (5/10min), commandes et téléchargements sont limités par IP/utilisateur
  pour ralentir les attaques par force brute et l'abus (`lib/utils/rate-limit.ts`).
  ⚠️ Implémentation en mémoire simple, suffisante pour la V1 — à remplacer par
  un store partagé (ex. Upstash Redis) si le site tourne sur plusieurs instances.
- **Validation des entrées** : toutes les routes API valident leurs données
  avec `zod` avant tout traitement (formats, longueurs, types autorisés).
- **Prix protégés côté serveur** : le montant d'une commande est toujours
  recalculé depuis les prix stockés en base, jamais accepté tel quel depuis
  le navigateur — impossible de falsifier un prix côté client.
- **Photos protégées** : voir la section « Protection des photos » ci-dessus
  — vérification de propriété stricte avant tout traitement d'un fichier.
- **En-têtes de sécurité HTTP** : `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`
  (`next.config.js`).
- **Messages d'erreur génériques** sur la connexion/inscription pour éviter
  l'énumération de comptes (ne pas révéler si un email existe déjà).
- **Upload de fichiers** : type et taille (25 Mo max) vérifiés côté client
  ET recalculés côté serveur ; noms de fichiers nettoyés.
- **.env.local jamais versionné** : déjà exclu par `.gitignore`.
- **Anti-escalade de privilèges** (`supabase/migrations/0006_privilege_escalation_protection.sql`) :
  un utilisateur qui modifie son propre profil ne peut jamais s'auto-attribuer
  le rôle `admin`, et un photographe ne peut jamais s'auto-valider (`status`)
  ni modifier son propre taux de commission — ces colonnes sont protégées par
  un trigger PostgreSQL, pas seulement par le code applicatif.

⚠️ **Deux failles critiques corrigées** (`supabase/migrations/0005_fix_storage_leak.sql`) :
la policy de stockage initiale permettait à **n'importe quel utilisateur
connecté de lire les photos originales en pleine qualité de n'importe quel
photographe** (pas seulement les siennes après paiement), et à **n'importe quel
photographe d'uploader dans la galerie d'un autre photographe**. Si tu as déjà
exécuté la migration `0003` sur ton projet Supabase, exécute **impérativement**
`0005_fix_storage_leak.sql` pour corriger ces deux failles avant toute mise en ligne.

🚧 À renforcer avant une mise en production réelle :
- Remplacer le rate limiting en mémoire par un store partagé (Upstash Redis)
- Ajouter la vérification reCAPTCHA/hCaptcha sur inscription si le spam devient un problème
- Auditer les policies RLS avec un vrai test d'intrusion avant le lancement
- Activer les alertes Supabase (tentatives de connexion suspectes)
- Mettre en place une Content-Security-Policy stricte une fois tous les
  domaines externes (Stripe, futurs Wave/Orange Money) identifiés
