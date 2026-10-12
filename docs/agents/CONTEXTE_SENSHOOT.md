# Contexte Senshoot Sénégal — à lire avant toute tâche

> Document commun à Amadou, Fatou, Amy et Lamine. État connu au **12/10/2026**.
> Ces faits peuvent vieillir : **vérifie dans le code ou sur le site avant d'affirmer**
> quelque chose à un client, un photographe ou dans un document destiné au public.

## 1. Mission

Senshoot Sénégal (shootsenegal.com) met en relation **photographes** et **clients** au
Sénégal : le photographe crée un événement, importe ses photos, génère un QR Code ;
les invités scannent le QR Code, parcourent la galerie, achètent leurs photos et les
téléchargent. Slogan : **« Capturez. Partagez. Vendez. »**

## 2. Qui utilise la plateforme

| Rôle | Ce qu'il fait |
|---|---|
| **Client invité** | Achète sans compte, avec seulement son e-mail ; reçoit un lien d'accès à ses photos |
| **Client avec compte** | Retrouve ses achats dans `/client/dashboard` (commandes, téléchargements) |
| **Photographe** | Crée événements et galeries, fixe le prix de chaque photo, suit ses ventes, demande des retraits, reçoit des demandes de réservation |
| **Admin** | Valide ou suspend les photographes (`/admin/dashboard/photographes`), traite les retraits, voit commandes et abonnements. Le rôle admin ne s'attribue **que par SQL**, jamais depuis l'application |

Un photographe n'apparaît publiquement (accueil, `/photographes`, sa page) que si son
statut est **validé** et que son nom de studio est renseigné.

## 3. Trois mécanismes de QR Code / lien — ne pas les confondre

1. **QR Code public de l'événement** : réutilisable par **tous** les invités, à vie.
   Un mariage de 150 invités doit pouvoir vendre à chacun. Ne jamais le rendre à usage unique.
2. **Lien / QR d'accès après paiement** : **usage unique**. Le premier passage montre les
   photos achetées ; ensuite il renvoie vers la connexion. Le compte client reste l'accès durable.
3. **Lien d'invitation sur place** : **usage unique**, créé par le photographe pour un client
   de passage ; il mène à la galerie publique (mécanisme 1).

## 4. Offres et argent

- **Formules photographe** (noms exacts affichés sur le site) :

  | Formule | Prix / mois | Événements | Stockage | Photos | Part reversée au photographe |
  |---|---|---|---|---|---|
  | Starter | 10 000 F CFA | 2 | 5 Go | 500 | 80 % |
  | Basic | 15 000 F CFA | 5 | 15 Go | 2 000 | 83 % |
  | Pro | 20 000 F CFA | 10 | 40 Go | 5 000 | 85 % |
  | Business | 25 000 F CFA | 25 | 100 Go | 15 000 | 88 % |
  | Premium | 30 000 F CFA | illimités | illimité | illimitées | 90 % |

  Sans formule, le photographe touche 70 % de ses ventes. Utilise toujours ces noms
  (et pas « Essential » ni « Elite », anciens noms du kit marketing).
- **Prix des photos** : fixé **par le photographe**, photo par photo. **−10 % sur chaque
  photo dès 2 photos** dans la même commande. Le total est toujours recalculé côté serveur.
- **Paiements clients** : Wave / Orange Money via le widget **KKiaPay** ; carte bancaire
  via **Stripe**. **Avant de présenter un moyen de paiement comme disponible** (à un
  client, un photographe ou dans un texte public), vérifie son état réel dans
  `docs/agents/ETAT_PRIVE.md` ou demande à Madior : ne le présume jamais.
- **Retraits** : le photographe demande un retrait de son solde disponible ; l'admin
  l'approuve ou le rejette.
- **Abonnements** : paiement mensuel ; un e-mail de rappel part 3 jours avant l'expiration
  (tâche planifiée tous les jours à 8 h).

## 5. Règles produit importantes

- **Suppression d'une photo ou d'un événement déjà acheté** : le contenu est « masqué »
  (soft delete) mais le client qui a payé **garde son téléchargement**. Le contenu jamais
  acheté est supprimé pour de bon.
- Les photos publiques sont **filigranées** ; les originaux sont dans un espace privé et ne
  sont accessibles que par un lien signé temporaire après paiement confirmé.
- Achat **sans compte** autorisé volontairement : « les clients n'ont pas de patience ».
- Les demandes de réservation (page d'un photographe) créent un message au photographe et
  proposent au client un lien WhatsApp pré-rempli.

## 6. Technique (pour Amadou et pour comprendre les incidents)

- Next.js 15 (App Router, TypeScript), Tailwind, `next-intl` (français sans préfixe, anglais `/en`).
- Supabase (base Postgres + RLS, authentification, stockage). Hébergement **Vercel**.
- E-mails transactionnels via Resend.
- Sécurité : en-tête CSP, limites de débit, RLS sur toutes les tables.
- Branche `master`. Migrations SQL dans `supabase/migrations/`.
- **L'état opérationnel détaillé** (configuration réelle, points faibles, dette technique)
  est dans `docs/agents/ETAT_PRIVE.md`. Ce fichier est **volontairement hors du dépôt** :
  lis-le s'il existe, et **ne recopie jamais son contenu dans un document public**
  (site, réseaux sociaux, FAQ, fichier versionné).

## 7. Règles communes à toute l'équipe

1. **Français** par défaut, clair et sans jargon pour le public ; montants au format
   « 2 000 F CFA ».
2. **Aucun secret** (mot de passe, clé d'API, jeton) dans un fichier, un message ou un
   brouillon. Ne demande jamais à un client un mot de passe ou un code reçu par SMS.
3. **Ne contacte jamais** un vrai client, photographe ou prospect : prépare des
   **brouillons** que l'utilisateur (Madior) envoie lui-même.
4. **Ne modifie aucune donnée de production** (base, paiements, comptes) sans accord
   explicite. Paiement, prix, sécurité, accès : décris d'abord **un scénario concret chiffré**
   et obtiens une confirmation, puisqu'un « oui » rapide peut cacher un malentendu.
5. **Sois honnête sur ce qui est vérifié** : distingue « j'ai testé », « j'ai lu le code »
   et « je suppose ». N'invente ni témoignage, ni chiffre, ni fonctionnalité.
6. Chaque agent range ses documents dans son dossier (`docs/support/`, `docs/marketing/`,
   `docs/pilotage/`) et ne touche pas au code, sauf Amadou.
7. Quand une demande sort de ton rôle, **dis-le** et indique à qui la confier.

## 8. L'équipe

| Agent | Rôle | Dossier |
|---|---|---|
| **Lamine** | Coordinateur / chef de projet : priorise, répartit, suit, rend compte | `docs/pilotage/` |
| **Amadou** | Technique / développeur : code, déploiement, incidents, sécurité, performance | le dépôt |
| **Fatou** | Support client & opérations : onboarding photographes, aide aux clients, procédures | `docs/support/` |
| **Amy** | Marketing & business development : démarchage, réseaux sociaux, offres | `docs/marketing/` |
