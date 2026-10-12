# Test d'un paiement réel, de bout en bout

Objectif : prouver qu'un client peut **payer, recevoir ses photos et les télécharger**, et que
le photographe est **crédité** — avant de démarcher des photographes.

**Prérequis** : le moyen de paiement testé doit être activé en mode réel (voir
`docs/agents/ETAT_PRIVE.md`, fichier non versionné). Tant que ce n'est pas le cas, ce test
échouera et ce n'est **pas** un défaut du code.

## Préparation (5 min)

- [ ] Choisir une galerie de test et une photo au prix **minimum (500 F CFA)**.
- [ ] Prévoir un téléphone avec **Wave ou Orange Money** et un petit solde.
- [ ] Utiliser une adresse e-mail que vous contrôlez. Si l'envoi d'e-mails est limité à une
      adresse (voir l'état privé), utiliser précisément celle-là.
- [ ] Noter l'heure de départ et ouvrir l'espace admin sur un ordinateur.

## Déroulé

1. [ ] Ouvrir la galerie **sur le téléphone** (scanner le QR Code de l'événement : on teste
       aussi le parcours réel).
2. [ ] Sélectionner **1 photo**, saisir l'e-mail, choisir **Wave / Orange Money**.
3. [ ] Le widget s'ouvre sans message d'erreur. Payer. **Noter** l'heure et le numéro de
       transaction affiché.
4. [ ] Le site confirme le paiement et propose l'accès aux photos (page de confirmation ou
       lien d'accès).

## Vérifications

| # | À vérifier | Où | Attendu |
|---|---|---|---|
| 1 | La commande existe | Admin, Commandes | Statut **payée**, montant = **500 F CFA** |
| 2 | Le paiement est rattaché | Admin / base | Un numéro de transaction KKiaPay, une seule commande liée |
| 3 | L'e-mail arrive | Boîte de réception (et spam) | Lien d'accès reçu en moins de quelques minutes |
| 4 | Le lien d'accès marche | Lien de l'e-mail | La photo achetée s'affiche |
| 5 | Le téléchargement marche | Bouton de téléchargement | L'**original sans filigrane** se télécharge |
| 6 | Le lien est à usage unique | Rouvrir le même lien | Message « déjà utilisé » + renvoi vers la connexion |
| 7 | Le photographe est crédité | Tableau de bord photographe, Ventes | +part reversée (ex. Starter : **400 F** sur 500 F, soit 80 %) |
| 8 | Le montant est exact avec la remise | Refaire avec **2 photos de 500 F** | **900 F** au total (2 × 450 F, remise de 10 %) |

## Cas d'échec à provoquer

- [ ] **Annuler** dans le widget : la commande reste « en attente », **aucun accès** aux photos.
- [ ] **Recharger** la page de confirmation : pas de second crédit au photographe, pas de
      second e-mail (la confirmation est répétable sans effet).
- [ ] Un paiement débité **sans** accès (si cela arrive) : c'est un incident bloquant, à
      transmettre à Amadou avec la fiche ci-dessous.

## Fiche d'incident à transmettre

`Problème · Heure · Numéro de commande (SS-AAAA-NNNNNN) · Numéro de transaction · Montant ·
Ce qui s'est affiché · Capture d'écran · Gravité (bloquant / gênant / mineur)`

## Après le test

- [ ] Si le paiement était réel : demander le **remboursement** depuis le tableau de bord
      KKiaPay, ou garder la somme comme premier encaissement de test (à noter).
- [ ] Marquer la commande de test comme telle dans votre suivi pour qu'elle ne fausse pas les chiffres.
- [ ] Consigner le résultat dans `docs/pilotage/journal.md` : date, résultat, anomalies.

**Critère de réussite** : les 8 vérifications sont « attendu » **et** les 3 cas d'échec se
comportent comme prévu. Sinon, on ne démarche pas encore.
