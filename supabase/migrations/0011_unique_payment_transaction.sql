-- =========================================================
-- Senshoot Sénégal — Empêche le rejeu d'un paiement KKiaPay
--
-- Faille trouvée lors d'un audit de sécurité : contrairement à Stripe (où
-- le lien commande <-> session de paiement est fixé côté SERVEUR à la
-- création de la session, avant tout paiement), le flux KKiaPay laisse le
-- NAVIGATEUR indiquer quelle commande confirmer avec quel transaction_id
-- (app/api/orders/[orderId]/confirm-kkiapay/route.ts). Sans contrainte,
-- un client aurait pu :
--   1. Payer une seule fois une commande à 2 000 F CFA (transaction_id X)
--   2. Créer plusieurs AUTRES commandes à 2 000 F CFA chacune
--   3. Appeler confirm-kkiapay sur chacune avec le MÊME transaction_id X
--   4. Chaque appel passait la vérification (montant correct, paiement
--      réellement réussi) et marquait la commande payée — alors qu'un
--      seul paiement réel avait eu lieu.
--
-- Cette contrainte d'unicité empêche qu'un même provider_transaction_id
-- serve à plus d'une commande, quel que soit le moyen de paiement.
-- =========================================================

alter table payments
  add constraint payments_provider_transaction_id_key unique (provider_transaction_id);
