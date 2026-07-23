# Périmètre MVP — état effectif

Ce document est le **périmètre v1 réellement en vigueur**. Il se lit **par-dessus**
`docs/prd/04-perimetre-v1.md`, qui reste la référence de base : ce fichier n'enregistre que
les **écarts assumés**, décidés après la rédaction du PRD.

**Règle inchangée** : tout ce qui ne figure ni dans le PRD 4.1/4.2, ni dans les
élargissements ci-dessous, ne doit **pas** être développé en v1 — même si cela paraît utile.

---

## Élargissements validés — décision Thomas 21/07

Trois capacités entrent au MVP au-delà du périmètre initial du PRD. Chacune a été
**signalée comme hors périmètre** pendant l'interview d'architecture, puis **validée
explicitement** en connaissance de cause.

### n°1 — Audit d'administration (`admin_audit_log`)

**Décision Thomas 21/07** · AD-002

| | |
|---|---|
| **Ce que prévoyait le PRD** | Le ch. 4.1 liste 9 blocs fonctionnels ; aucun ne couvre la traçabilité des actions d'administration. La table `events` était pensée pour le seul débrief. |
| **Ce qui entre au MVP** | Un **journal d'audit d'administration séparé et append-only**, distinct de `events`. Trace : comptes (création/modification/désactivation), invitations, changements de droits, organisations/filiales/missions/scénarios, lancement/arrêt d'instances, validation de scénario, purges, bruit de fond. |
| **Pourquoi** | La traçabilité des actions d'administration est très coûteuse à rétro-installer, et nécessaire à l'audit sécurité/RGPD dès les premiers clients. |
| **Impact** | Une table supplémentaire, ses policies RLS et son trigger d'étiquetage. Aucun impact sur le déroulé d'un exercice. |

### n°2 — Horloge automatique minimale

**Décision Thomas 21/07** · AD-015

| | |
|---|---|
| **Ce que prévoyait le PRD** | 4.2.3 annonçait une horloge « au choix (auto/manuelle) » sans en préciser le moteur ; l'arbitrage d'architecture avait d'abord conclu au **tout-manuel** en v1. |
| **Ce qui entre au MVP** | Le mode **manuel reste le défaut**. S'y ajoute un **moteur automatique volontairement minimal** : il avance l'horloge **fictive** au fil du temps réel selon un **rapport fixé au lancement** (ex. 1h fictive = 15 min réelles), activable/désactivable d'un clic par instance, sans perte d'état. |
| **Pourquoi** | Le confort du mode automatique sans réintroduire le temps réel comme déclencheur : le moteur remplace la main du facilitateur, il ne change pas la définition de « temps écoulé » (toujours fictif). |
| **Impact** | Réglage de cadence sur l'instance + traçage des bascules. **Vitesse variable et scénarios full-auto restent post-v1.** |

### n°3 — Bruit de fond à portée compte racine, création ouverte aux facilitateurs

**Décision Thomas 21/07** · AD-017

| | |
|---|---|
| **Ce que prévoyait le PRD** | 4.2.6 : bruit de fond **générique et neutre uniquement**, portée plateforme, **éditeur seul**. 4.3.3 repoussait le bruit thématique en v2. |
| **Ce qui entre au MVP** | Le bruit de fond porte une **portée** : **plateforme** (éditeur, visible par tous) **ou** **compte racine** (privé, cloisonné). Création ouverte dès la v1 aux **responsables d'organisation et au-dessus**, ainsi qu'aux **facilitateurs** — ces derniers uniquement à la portée dérivée de leur contexte d'accès, jamais choisie librement. Les participants ne créent jamais de bruit de fond. |
| **Pourquoi** | Les clients ont besoin d'un bruit de fond crédible à leur contexte dès la v1 ; le cloisonnement standard par compte racine le permet sans risque de fuite. |
| **Impact** | Portée + étiquette de cloisonnement sur le bruit de fond, contrainte en base interdisant de créer hors de sa propre portée, traçage des créations/modifications. |

---

## Ce qui reste explicitement hors v1

Inchangé par rapport au PRD 4.3, à l'exception du bruit de fond (élargissement n°3) :

1. Branchement réel du scénario (les décisions modifient la suite).
2. Bibliothèque de relances pré-écrites / assistance IA au facilitateur.
3. ~~Bruit de fond thématique par type de crise~~ → **partiellement ouvert** par l'élargissement n°3 (portée compte racine). Le bruit **thématique par type de crise** en tant que fonctionnalité outillée reste hors v1.
4. Étiquettes de ciblage.
5. Profil d'observateur / évaluateur.
6. Paiement en ligne.
7. Isolation physique par base dédiée.
8. Changement de nature d'un compte en libre-service.

**Également reportés** par les décisions d'architecture :
- Régimes de rétention fins par catégorie de données (AD-006) — une règle unique en v1.
- Ramification du graphe d'étapes (AD-004) — modélisée, mais un seul lien sortant en v1.
- Déclencheur « décision du joueur » (AD-013) — prévu dans le modèle, désactivé.
- Vitesse d'horloge variable et scénarios full-auto (AD-015).
