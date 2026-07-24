# Périmètre MVP — état effectif

Ce document est le **périmètre v1 réellement en vigueur**. Il se lit **par-dessus**
`docs/prd/04-perimetre-v1.md` et le PRD complet, qui restent la référence de base : ce fichier
n'enregistre que les **écarts assumés**.

**Règle inchangée** : tout ce qui ne figure ni dans le PRD, ni dans les élargissements
ci-dessous, ne doit **pas** être développé en v1 — même si cela paraît utile.

> 🔄 **Révisé le 23/07/2026** après lecture du PRD v0.3 **complet** (les ch. 1-3 et 5-9
> n'avaient pas été déposés au moment de l'interview d'architecture). Cette lecture a montré
> que **deux des trois « élargissements » n'en étaient pas** : le PRD les exigeait déjà.

---

## Les élargissements assumés

### Création de bruit de fond par les clients

**Décision Thomas 21/07** · AD-017, précisé par ARB-7 (23/07)

| | |
|---|---|
| **Ce que prévoit le PRD** | **5.3.2** : « En version 1, **seul l'administrateur de la plateforme publie du bruit de fond** en bibliothèque ; aucun compte client ne produit ses propres templates. » **5.3.3** propose une alternative : le facilitateur qui veut un bruit qui lui est propre l'écrit comme un inject ordinaire. **4.3.3** repousse le bruit thématique en v2. |
| **Ce qui entre au MVP** | Les clients **peuvent créer leur propre bruit de fond** : responsables d'organisation et au-dessus, et **facilitateurs** — ces derniers uniquement à la portée **dérivée de leur contexte d'accès**, jamais choisie librement. Les participants ne créent jamais de bruit de fond. |
| **Pourquoi** | Les clients ont besoin d'un bruit de fond crédible à leur contexte dès la v1 ; le cloisonnement standard le permet sans risque de fuite. |
| **Ce qui n'est PAS un élargissement** | Les **trois portées** du bruit de fond (plateforme, compte racine, organisation) sont **conformes** au PRD 5.1 et ch. 6, qui rangent le template de bruit de fond parmi les trois actifs portant la portée à trois valeurs. Le bruit de portée plateforme publié par l'éditeur reste **visible de tous**. |
| **Impact** | Portée + étiquette de cloisonnement sur le bruit de fond, contrainte en base interdisant de créer hors de sa propre portée, traçage des créations/modifications. |

### Portée de réutilisation « filiale » (4ᵉ niveau)

**Décision Thomas 23/07** · AD-028

| | |
|---|---|
| **Ce que prévoit le PRD** | 5.1.1 définit **trois** portées : plateforme, compte racine, organisation. Le PRD 3.3 rattache le contenu sur-mesure à la **mission** (droits/propriété), mais n'ouvre pas de portée de réutilisation plus fine que l'organisation. |
| **Ce qui entre au MVP** | Une **quatrième portée « filiale »** : un contenu peut être privé à une filiale et à ses missions, **invisible des filiales sœurs**, tout en restant visible du responsable d'organisation au-dessus. |
| **Pourquoi** | Une organisation à plusieurs filiales veut du contenu réutilisable au sein d'une filiale sans le partager avec les autres. |
| **Impact** | Une valeur d'énumération de plus, une cible `filiale_id` sur les actifs de contenu, et l'héritage correspondant dans les policies RLS. Le clonage vers le bas s'étend naturellement. |

---

## Reclassés — exigés par le PRD, donc pas des élargissements

### ~~Audit d'administration~~ → exigé par le PRD 7.10

L'interview avait cru l'ajouter au périmètre. En réalité **7.10 l'exige explicitement** :
« Un journal d'audit doit être tenu […] chaque connexion, chaque consultation sensible, chaque
modification est un événement horodaté et attribué », avec « un régime de rétention propre,
**plus long** que celui des données brutes d'instance ». Voir aussi 5.8.9 et 8.2.6.

**Ce qui a réellement été décidé** (AD-002, élargi par ARB-6) : la **forme** — un journal
`admin_audit_log` **séparé** de `events` et **append-only** — et le **périmètre opérationnel** :
actions d'administration + **toutes les connexions** + **tout accès de l'éditeur à des données
client**. Les lectures ordinaires ne sont pas instrumentées.

### ~~Horloge automatique~~ → exigée par le PRD 4.2.3 et 5.2.1

L'interview avait cru l'ajouter. En réalité **4.2.3** (« horloge au choix, automatique par
minuteur ou manuelle ») et **5.2.1** exigent déjà les deux modes en v1.

**Ce qui a réellement été décidé** (AD-015 + ARB-1) : ce que fait le moteur automatique. Il
avance l'**horloge fictive** à un rapport fixé au lancement — là où le PRD faisait cadencer le
MEL par le **temps réel**. C'est un **amendement du PRD**, pas un élargissement de périmètre.

---

## Ce qui reste explicitement hors v1

Inchangé par rapport au PRD 4.3, sauf mention :

1. Branchement réel du scénario (les décisions modifient la suite).
2. Bibliothèque de relances pré-écrites / assistance IA au facilitateur.
3. Bruit de fond **thématique par type de crise** en tant que fonctionnalité outillée. *(La
   création de bruit par les clients, elle, est ouverte — voir l'élargissement ci-dessus.)*
4. Étiquettes de ciblage.
5. Profil d'observateur / évaluateur.
6. Paiement en ligne.
7. Isolation physique par base dédiée.
8. Changement de nature d'un compte en libre-service.

**Également reportés** par les décisions d'architecture :
- Ramification du graphe d'étapes (AD-004) — modélisée, mais un seul lien sortant en v1.
- Déclencheur « décision du joueur » (AD-013) — prévu dans le modèle, désactivé.
- Vitesse d'horloge variable et scénarios full-auto (AD-015).
- **Durées** précises de rétention (ARB-3) — les **catégories** sont modélisées, les durées
  restent un point ouvert du PRD (9.5).
