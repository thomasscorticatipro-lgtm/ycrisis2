# Décisions d'architecture — validation du socle de données

Journal des décisions structurantes tranchées avec Thomas lors de la phase de validation
d'architecture (revue de la migration `0001_socle.sql`). Chaque décision porte un
**identifiant** (AD-XXX), une **date**, une **justification en une phrase**, puis l'enjeu,
l'option retenue et ses conséquences.

> **Statut : interview d'architecture TERMINÉE** (21/07/2026), complétée le 23/07/2026.
> **Aucune décision ci-dessous n'est encore appliquée au schéma** — la migration `0002`
> reste à écrire. Le schéma déployé est toujours celui de `0001_socle.sql`.

**Index.** AD-001 isolation · AD-001b étiquette · AD-002 événements/audit · AD-003 snapshot ·
AD-004 graphe d'étapes · AD-005 état par équipe · AD-006 purge · AD-007 ciblage ·
AD-008 contrainte de portée · AD-009 canaux · AD-010 PII · AD-011 auteur · AD-012 validation ·
AD-013 déclencheur · AD-014 horloge fictive · AD-015 mode d'horloge · AD-016 snapshot unique ·
AD-017 bruit de fond.

---

## AD-001 — Isolation multi-tenant : étiquette de cloisonnement sur chaque ligne

**Date.** 21/07/2026
**Pourquoi.** Un contrôle d'isolation par comparaison directe est plus sûr et plus rapide
qu'une remontée de chaîne parent, et supprime la principale source de fuite entre clients.

**Enjeu.** Pour cloisonner (un cabinet ne voit jamais un autre ; les organisations
clientes d'un même cabinet sont cloisonnées entre elles), la base doit connaître le
propriétaire de chaque ligne. Beaucoup de tables profondes ne le portaient pas.

**Décision.** Étiquette de cloisonnement **directe sur chaque table** (colonne dédiée),
plutôt que remontée de la chaîne parent à chaque contrôle.

**Conséquences.** Contrôle RLS = comparaison directe, simple, rapide, difficile à rater
(le plus sûr contre les fuites). L'étiquette doit être posée correctement à la création
et ne jamais diverger → dérivation par trigger `BEFORE INSERT`, colonne non modifiable.

---

## AD-001b — L'étiquette est `compte_racine_id`, jamais `cabinet_id`

**Date.** 21/07/2026
**Pourquoi.** En modèle autonome il n'existe aucun cabinet, donc une étiquette `cabinet_id`
laisserait les données de ces comptes sans propriétaire et non cloisonnables.

**Décision.** L'étiquette est le **`compte_racine_id`** (cabinet **ou** organisation
autonome), jamais `cabinet_id` seul — pour fonctionner dans les deux modèles (piloté et
autonome). Le cabinet est un cas particulier de compte racine. S'applique **partout**, y
compris `admin_audit_log` (AD-002).

---

## AD-002 — Modèle événementiel : `events` = exercice uniquement, + `admin_audit_log` séparé

**Date.** 21/07/2026
**Pourquoi.** Garder `events` homogène et purgeable avec l'instance, sans renoncer à une
traçabilité d'administration, impose deux journaux distincts plutôt qu'une table fourre-tout.

**Enjeu.** La table `events` (socle du débrief et de la traçabilité) pouvait accueillir
soit uniquement les événements internes à un exercice, soit aussi l'administration
hors exercice. Le lien vers l'instance était laissé optionnel.

**Décision.** `events` ne retient **que ce qui se passe à l'intérieur d'une instance**
(toujours rattaché à une instance → simple à cloisonner et à purger). L'audit
d'administration entre néanmoins au MVP sous forme d'une table **`admin_audit_log`
totalement séparée**.

**Spécifications de `admin_audit_log`.**
1. Même mécanique événementielle que `events` (type d'action, horodatage, acteur,
   payload JSONB) mais journal totalement indépendant, cycle de vie séparé.
2. **Actions tracées en v1** — liste consolidée :
   - création / modification / désactivation de comptes ;
   - invitations et changements de droits ;
   - création / modification / suppression d'organisations, filiales, missions, scénarios ;
   - lancement / arrêt d'instances ;
   - **validation de scénario** (AD-012) ;
   - **programmation, modification de date et exécution de purge** (AD-006) ;
   - **création / modification / suppression de bruit de fond** (AD-017).
3. Étiquette **`compte_racine_id`** obligatoire, dérivée par trigger `BEFORE INSERT`,
   non modifiable après insertion. RLS par comparaison directe, lecture réservée aux
   profils administrateurs, aucune jointure.
4. Table **append-only** : aucun `UPDATE` ni `DELETE` (revoke + policies).

> ⚠️ **Élargissement de périmètre MVP n°1** — voir `docs/mvp-scope.md`.

---

## AD-003 — Snapshot de scénario : hybride (injects en lignes + archive JSON)

**Date.** 21/07/2026
**Pourquoi.** Les injects figés doivent être interrogeables et reliables aux réceptions et
aux événements pour que le débrief tienne, sans pour autant figer toutes les tables.

**Enjeu.** Au lancement, le contenu joué est figé. Sous quelle forme le stocker ?
Le schéma actuel mettait tout dans un unique bloc JSON (peu interrogeable, aucun lien
inject ↔ réception ↔ événement).

**Décision.** **Hybride.** Les injects figés deviennent de vraies lignes interrogeables
(ils pilotent la diffusion et se relient directement aux réceptions et aux événements) ;
le reste du contenu figé (fiches, briefings, réglages du scénario) reste une **archive
JSON** pour la fidélité.

**Conséquences.** Débrief et rejeu solides et reliables sans multiplier toutes les
tables figées ; recopie un peu plus élaborée au lancement que le JSON seul. Bon
compromis v1.

---

## AD-004 — Graphe d'étapes : étapes explicites reliées (linéaires en v1)

**Date.** 21/07/2026
**Pourquoi.** Modéliser le graphe maintenant permet d'ouvrir la ramification v2 en
autorisant simplement plusieurs liens sortants, sans refonte ni migration lourde.

**Enjeu.** Le scénario est un « graphe » censé préparer la ramification v2, mais le
schéma l'avait aplati en simple numérotation (pas d'objet « étape », pas de liens).

**Décision.** Introduire un vrai objet **« étape » (nœud)** et des **liens entre étapes**.
Les injects sont rattachés à une étape. En v1, chaque étape a **un seul lien suivant**
(donc linéaire, conforme au périmètre). L'avancement pointe sur une étape précise.

**Conséquences.** Notion d'étape claire ; passage à la ramification v2 = autoriser
plusieurs liens sortants, **sans refonte ni migration lourde**. Conforme à l'intention
« préparer dès maintenant ». Coût : un peu plus de structure posée tout de suite.

---

## AD-005 — État par équipe : rythme commun dicté par l'horloge unique

**Date.** 21/07/2026
**Pourquoi.** Une progression commune est la seule cohérente avec la facilitation
centralisée et l'horloge fictive unique ; seul le contenu ciblé distingue les équipes.

**Enjeu.** Tension entre une horloge fictive unique (instance) et un compteur
d'avancement par équipe : les équipes peuvent-elles être à des étapes différentes ?

**Décision.** **Rythme commun.** Les injects se déclenchent au fil de l'horloge unique
(manuelle par défaut, ou moteur auto minimal — cf. AD-015), pour toute l'instance. Toutes
les équipes avancent ensemble ; ce qui diffère, c'est seulement le contenu **ciblé**.

**Conséquences.** L'« étape courante » devient une propriété de **l'instance** (globale),
pas de l'équipe. L'état par équipe ne conserve que ce qui lui est propre (décisions
rendues, marqueurs). Cohérent avec facilitation centralisée + horloge unique du PRD.

---

## AD-006 — Rétention et purge : règle unique, déclencheur manuel ou programmé à date

**Date.** 21/07/2026
**Pourquoi.** Une règle unique couvre le besoin v1 et garantit qu'aucune donnée n'est
détruite avant que la preuve de participation ait été produite et figée.

**Enjeu.** À la purge, les identités éphémères sont détruites, sauf le livrable de
débrief (preuve de participation) qui doit survivre. Or aucune table de débrief
n'existait, et tout était en suppression en cascade (le livrable serait détruit avec
l'instance).

**Décision.** **Règle unique** (pas de durées par catégorie de données). Déclencheur de
purge au choix du responsable : soit « purger maintenant », soit « purger à une date
choisie » (une date par instance).

**Séquence stricte.**
1. Fin d'exercice → génération du document de débrief, figé, stocké **hors de la cascade
   de suppression** (avec ce dont il a besoin, y compris les noms comme preuve de
   participation).
2. Envoi du débrief au responsable.
3. La purge ne peut **jamais** s'exécuter avant que le débrief soit généré et figé —
   même si la date choisie est antérieure, elle attend l'étape 1.
4. À l'exécution : suppression réelle de l'instance et des identités éphémères des
   participants.

**Garde-fous.**
- « Purger maintenant » exige une confirmation forte (saisie du nom de l'instance).
- Toute programmation, modification de date et exécution de purge est tracée dans
  `admin_audit_log` (qui, quoi, quand).
- La date de purge est modifiable tant que la purge n'a pas été exécutée.

**Reporté.** Régimes de rétention fins par catégorie = plus tard si besoin client.

---

## AD-007 — Ciblage des injects : référentiel déclaré par le scénario + association au lancement

**Date.** 21/07/2026 — **Mode 4 ajouté le 23/07/2026**
**Pourquoi.** Un scénario rejoué N fois ne peut pas viser des équipes qui n'existent pas
encore : seul un référentiel abstrait, associé au lancement, rend la livraison fiable.

**Enjeu.** Un inject vise des équipes/rôles, mais les équipes réelles n'existent qu'au
lancement, alors que le scénario est écrit avant et rejouable. Le schéma stockait la
cible en texte libre → risque de livraison ratée par simple divergence de nom.

**Décision.** Le scénario déclare son **référentiel de destinataires** (équipes/rôles
attendus, ex. « Cellule Com », « Cellule de crise Paris », « Direction », « Journaliste »).
Les injects choisissent leurs cibles **uniquement dans cette liste**, jamais en texte libre.

**Quatre modes de ciblage (tous requis en v1).**
- **Toutes les cellules** : diffusion générale (cible spéciale explicite, pas une
  énumération manuelle → une équipe ajoutée plus tard est incluse automatiquement).
- **Une cellule précise** : inject réservé à une seule équipe (ex. Paris reçoit une info
  que Montpellier n'a pas).
- **Sélection multiple** : sous-ensemble choisi de cellules (cases à cocher dans le
  référentiel).
- **Sélection de participants** (un seul ou plusieurs) — voir le détail ci-dessous.

### Mode 4 — Ciblage de participants, à deux niveaux *(ajouté le 23/07/2026)*

Le ciblage individuel est possible, mais il vit **à deux niveaux distincts** pour ne pas
casser la réutilisabilité des scénarios.

**A. Au niveau du SCÉNARIO (réutilisable).** Le référentiel déclare, en plus des équipes et
des rôles, des **« places individuelles »** (ex. « Directeur de crise », « Porte-parole »).
Un inject cible **une place, ou plusieurs places**. **Aucun nom propre n'est jamais stocké**
→ le scénario reste rejouable à l'identique. Conforme au glossaire.

**B. Au niveau de l'INSTANCE (un exercice précis).** Dès que la liste des participants est
importée — **en préparation en amont** (PRD 4.2.7) ou **en direct** — le facilitateur peut
cibler **un ou plusieurs participants réels, nommément**. Ces injects appartiennent à
**l'instance**, pas au scénario réutilisable.

**Expérience utilisateur (identique dans les deux cas).** Une fois l'association faite,
l'interface présente l'entrée sous la forme **« Michel Galabru — Directeur de crise »**, que
la cible stockée soit la *place* (contenu de scénario) ou le *participant réel* (contenu
d'instance). Le facilitateur qui ne connaît pas encore les personnes sélectionne simplement
**« Directeur de crise »**.

**Garde-fou.** Un scénario réutilisable **ne stocke jamais un participant réel** — sinon il
cesse d'être rejouable. Le ciblage nominatif vit **au niveau de l'instance**.

**Glossaire.** La règle « cible toujours exprimée par un nom d'équipe ou de rôle, **jamais
par un nom propre** » vaut pour le **contenu réutilisable (scénario)**. Au niveau de
**l'instance**, le ciblage nominatif est **autorisé**. *(Annotation portée au glossaire le
23/07/2026.)*

**Résolution.**
1. Au lancement : étape d'**association** entre chaque destinataire du référentiel et les
   équipes/participants réels du jour.
2. **Vérification de complétude avant démarrage** : la plateforme signale tout
   destinataire du référentiel non associé. **Pas de blocage** — le facilitateur choisit,
   pour chaque destinataire manquant, entre *ignorer* ses injects ou les *rediriger* vers
   une autre équipe associée. Ce choix est **tracé dans les événements de l'instance**.
3. Injects improvisés en cours d'exercice : le facilitateur cible via le référentiel **ou**
   directement une équipe/un participant réel de l'instance.
4. La résolution des cibles à l'envoi passe **toujours par l'association** (référentiel →
   équipes réelles), **jamais** par comparaison de noms en texte.

---

## AD-008 — Contrainte « une seule portée » garantie par la base

**Date.** 21/07/2026
**Pourquoi.** Une donnée au propriétaire ambigu est un trou de cloisonnement : l'invariant
doit tenir même en cas de bug applicatif ou d'écriture directe en base.

**Enjeu.** Les objets à portée (attribution de profil, invitation, fiche, scénario…)
désignent une cible parmi plusieurs colonnes possibles. La règle « exactement la bonne
cible renseignée » n'était garantie que côté application (« contrôlé applicativement »).

**Décision.** La règle est **garantie par la base** (contrainte de validation stricte) :
toute ligne dont la cible ne correspond pas exactement à sa portée est **refusée**. Coût
quasi nul, défense en profondeur, cohérent avec AD-001.

---

## AD-009 — Canaux : liste contrôlée par la plateforme

**Date.** 21/07/2026
**Pourquoi.** Chaque canal porte un comportement propre (le canal « décisions » est un
quiz) : un libellé libre ne peut pas porter ce comportement de façon fiable.

**Enjeu.** Le canal (l'onglet participant) était en texte libre alors que le glossaire fige
la liste. Texte libre → onglets fantômes et comportements non fiables.

**Décision.** Les canaux sont une **liste fixe définie par la plateforme** (socle du
glossaire : mail, chat d'équipe, messagerie pro, journal de bord, décisions, réseau social,
site d'actualité ; optionnels : tableau de bord, carte de situation, bulletin d'autorité),
**activables par scénario**. L'onglet participant correspond toujours à un canal connu, au
comportement maîtrisé. Ajouter un canal = décision produit.

---

## AD-010 — Données personnelles du participant : email vivant, purgé à la fin

**Date.** 21/07/2026
**Pourquoi.** L'adresse email réelle est fonctionnellement nécessaire pour délivrer et
renvoyer le lien d'accès, mais n'a aucune raison de survivre à l'exercice.

**Enjeu.** Le participant a une identité éphémère (nom, email réel). L'email sert à
envoyer son lien personnel. Jusqu'où le conserver, au regard du RGPD ?

**Décision.** L'**adresse email réelle** est **conservée le temps de l'exercice**
(envoi/renvoi du lien, correction d'adresse, accès de secours pour les retardataires), puis
**réellement détruite à la purge** avec le reste de l'identité (cf. AD-006). Le **débrief
survivant ne conserve que le nom** (preuve de participation), pas l'email.

> ⚠️ Ne pas confondre l'**adresse email réelle** (canal technique d'accès, hors fiction)
> avec le **canal « mail » simulé** (onglet de jeu, contenu fictif). Voir le glossaire.

---

## AD-011 — Auteur d'un événement : identité qualifiée et vérifiée

**Date.** 21/07/2026
**Pourquoi.** Un débrief « qui a fait quoi » n'a de valeur que si l'auteur est toujours
résolvable et garanti existant par la base.

**Enjeu.** L'auteur d'un événement peut être un utilisateur plateforme OU un participant.
Le schéma ne stockait qu'un identifiant nu, sans type ni garantie d'existence.

**Décision.** **Auteur qualifié.** Deux liens distincts et vérifiés par la base
(`auteur_utilisateur_id` → `auth.users`, `auteur_participant_id` → `participant`),
**exactement un des deux renseigné** (même style garanti-par-la-base qu'AD-008).

**Précisions.** `admin_audit_log` : auteur = utilisateur plateforme uniquement. Dans le
**débrief survivant**, l'auteur est capturé **par son nom** (les participants étant
réellement supprimés à la purge, cf. AD-006/AD-010).

---

## AD-012 — Validation du contenu : barrière au lancement des instances réelles

**Date.** 21/07/2026
**Pourquoi.** Un exercice réel lancé sur un scénario incomplet se découvre en direct devant
les participants — la barrière doit donc être en amont, sans gêner les répétitions.

**Enjeu.** Le statut brouillon/validé/archivé n'empêchait pas de lancer un exercice sur un
scénario incomplet.

**Décision.** **Validation obligatoire pour jouer**, avec nuances :
- La barrière ne s'applique qu'aux **instances réelles** : un scénario doit être **validé**
  pour lancer un exercice réel. La validation suppose une complétude minimale (≥ 1 inject,
  briefings des personnages sources présents, référentiel de cibles cohérent).
- Les **instances de test / répétition** (`est_test`) peuvent se lancer sur un **brouillon**,
  avec **avertissement** listant ce qui manque.
- **Toute modification d'un scénario validé le repasse automatiquement en brouillon**
  (invalidation) → il devra être revalidé avant un nouvel exercice réel.
- La **validation est une action tracée** dans `admin_audit_log` (cf. AD-002).

---

## AD-013 — Déclencheur d'inject : liste contrôlée, adossée à l'horloge fictive

**Date.** 21/07/2026
**Pourquoi.** Le déclencheur pilote la MEL : un libellé libre rend le déclenchement
imprévisible et invérifiable avant l'exercice.

**Décision.** **Liste fermée de déclencheurs.** Deux en v1 :
- **« temps écoulé »** : l'inject a une position sur l'horloge **fictive** de l'instance ;
  il se déclenche quand la timeline fictive atteint cette position.
- **« action du facilitateur »** : l'inject attend un déclenchement manuel.

La place pour **« décision du joueur »** est prévue dans le modèle mais **désactivée (v2)**.

**Précision majeure.** Le déclencheur « temps écoulé » se réfère **toujours à l'horloge
fictive** de l'instance, **jamais au temps réel**.

> 🔗 **Amendé par AD-015** : l'horloge fictive n'est pas *uniquement* manuelle en v1 — un
> moteur auto minimal peut l'avancer. La définition de « temps écoulé » (fictif, jamais
> réel) reste **inchangée**.

---

## AD-014 — Horloge fictive : repères structurés et ordonnés

**Date.** 21/07/2026
**Pourquoi.** Un temps fictif en texte libre ne se trie ni ne se compare, ce qui rend la
chronologie du débrief non fiable.

**Décision.** La position fictive est un **repère comparable et triable** (instant fictif
normalisé), **doublé d'un libellé lisible** pour l'affichage au participant. Chaque « saut »
de l'horloge fait passer au repère suivant. S'applique à l'horloge courante de l'instance,
au moment fictif des réceptions et à l'horodatage fictif des événements.

---

## AD-015 — Mode d'horloge en v1 : manuel par défaut + auto minimal débrayable

**Date.** 21/07/2026
**Pourquoi.** Un moteur auto qui se contente d'avancer l'horloge fictive à cadence fixe
offre le confort du mode automatique sans réintroduire le temps réel comme déclencheur.

**Enjeu.** « Horloge pilotée manuellement en v1 » (AD-013) semblait exclure le mode
automatique du schéma et du PRD 4.2.3.

**Décision.** **Auto + manuel dès la v1**, en version délibérément minimale du mode auto :
1. Mode par défaut = **MANUEL**. L'auto s'active **par instance**, par le facilitateur, et se
   désactive d'un clic à tout moment (**bascule instantanée, sans perte d'état**).
2. Le moteur auto fait **une seule chose** : avancer l'horloge **fictive** au fil du temps
   réel, selon un **rapport fixé au lancement** (ex. 1h fictive = 15 min réelles). Pas de
   changement de vitesse en cours en v1 : pour accélérer/ralentir, on repasse en manuel.
3. Les injects « temps écoulé » restent déclenchés par l'horloge **fictive** dans les deux
   modes — le moteur ne fait que **remplacer la main du facilitateur** ; la définition de
   « temps écoulé » (AD-013) ne change pas.
4. **Pause** = suspension du moteur ; **clôture** d'instance = arrêt définitif du moteur et
   annulation des déclencheurs en attente.
5. Toute **bascule manuel/auto est tracée** dans les événements de l'instance.

**Portée.** Vitesse variable et scénarios full-auto = **post-v1**.

> ⚠️ **Élargissement de périmètre MVP n°2** — voir `docs/mvp-scope.md`.

---

## AD-016 — Snapshot : une seule version figée par instance, immuable

**Date.** 21/07/2026
**Pourquoi.** Plusieurs photos figées rendraient indécidable « quelle version a réellement
été jouée », ce qui ruine la valeur de preuve du débrief.

**Décision.** La base garantit **exactement une version figée par instance**, **non
modifiable** après création. Référence unique et incontestable pour le rejeu, le débrief et
la preuve de participation. Conforme à « l'instance fige son contenu au lancement ».

---

## AD-017 — Bruit de fond : portée plateforme ou compte racine, création ouverte dès la v1

**Date.** 21/07/2026
**Pourquoi.** Les clients ont besoin d'un bruit de fond crédible à leur contexte dès la v1,
ce que le cloisonnement standard par compte racine permet sans risque de fuite.

**Enjeu.** Le PRD 4.2.6 limitait le bruit de fond à un contenu générique et neutre, en
portée plateforme, publié par l'éditeur seul ; le bruit sur-mesure était repoussé en v2.

**Décision.**
1. Le bruit de fond porte une **portée** : **plateforme** (créé par l'éditeur, visible et
   utilisable par tous — même mécanique que le catalogue de scénarios) **ou** **compte
   racine** (privé : visible uniquement par ce compte racine et sa descendance —
   organisation, filiales, missions, instances — **jamais** par un autre compte racine).
   Cloisonnement par l'étiquette propriétaire standard, garanti par la base (AD-008).
   → Seules ces **deux** portées sont valides pour le bruit de fond (pas « organisation »).
2. **Droits de création (v1).**
   - **Éditeur (Scort)** : crée en portée plateforme **et** en portée compte racine (pour un
     client donné).
   - **Compte racine / organisation** : crée **uniquement à sa propre portée** — jamais
     plateforme, jamais la portée d'un autre compte racine. Impossibilité **garantie par la
     base**, pas seulement par l'interface.
3. **Qui a le droit de créer, dès la v1 :**
   - **Responsable d'organisation ou supérieur** : création à la portée de leur compte racine.
   - **Facilitateurs** (y compris externes à accès ponctuel) : création autorisée, à la
     portée du compte racine de l'organisation/mission sur laquelle porte leur accès — le
     rattachement est **dérivé du contexte d'accès, jamais choisi librement**. Un
     facilitateur actif sur plusieurs organisations crée dans le contexte de celle où il
     travaille ; son bruit reste visible uniquement dans ce compte racine et sa descendance.
   - **Participants** : jamais.
4. Création, modification et suppression de bruit de fond sont **tracées dans
   `admin_audit_log`** (contenu partagé au sein du compte racine : savoir qui l'a modifié).
5. Un bruit de fond utilisé par une instance en cours suit la **règle snapshot** (AD-003,
   AD-016) : l'instance joue sa version figée ; les modifications ultérieures n'affectent que
   les exercices futurs.

> ⚠️ **Élargissement de périmètre MVP n°3** — voir `docs/mvp-scope.md`.

---

## Élargissements de périmètre MVP assumés

Trois décisions étendent sciemment le périmètre v1 du PRD, validées explicitement par
Thomas le **21/07/2026**. Détail et justification : **`docs/mvp-scope.md`**.

| N° | Élargissement | Décision |
|----|---------------|----------|
| **n°1** | Audit d'administration (`admin_audit_log`) entre au MVP | AD-002 |
| **n°2** | Horloge automatique minimale dès la v1 | AD-015 |
| **n°3** | Bruit de fond à portée compte racine + création par les facilitateurs | AD-017 |

---

# Confrontation au PRD v0.3 complet — 23/07/2026

Le PRD complet (ch. 1 à 10) n'avait **pas** été déposé au dépôt au moment de l'interview
d'architecture : celle-ci s'est tenue sur les seuls ch. 4 et 10, plus les commentaires de la
migration `0001`. Chaque AD est ici confrontée au document intégral.

**Légende.** ✅ confirme · ❌ contredit · ⚪ muet (le PRD ne traite pas le sujet ; le ch. 6 est
« volontairement non technique », donc muet par construction sur les choix d'implémentation).

| AD | Verdict | Référence exacte |
|----|---------|------------------|
| **AD-001** Étiquette de cloisonnement | ✅ principe / ⚪ technique | 7.6 (frontière = compte racine), 7.8 (imposée côté serveur, « le front reflète la règle, il ne la porte pas »), ch. 6 § *La hiérarchie des comptes*. Le choix colonne-vs-jointure est muet. |
| **AD-001b** `compte_racine_id` | ✅ | 7.6, ch. 6 § « Le cabinet et l'organisation autonome constituent donc les deux formes possibles du compte racine », glossaire *Compte racine*. |
| **AD-002** `events` + `admin_audit_log` | ✅ **exigé, pas un élargissement** / ❌ périmètre trop étroit | **7.10** : « Un journal d'audit doit être tenu […] chaque connexion, chaque **consultation sensible**, chaque modification ». Aussi 5.8.9, 8.2.6. AD-002 **omet connexions et consultations sensibles**. |
| **AD-003** Snapshot hybride | ✅ principe / ⚪ forme | 5.1.16, ch. 6 § *Le figement de l'instance*, 5.5.6. La forme (lignes + JSON) est muette. |
| **AD-004** Étapes explicites | ✅ **littéralement** | 4.2.1 et ch. 6 § *La distinction scénario contre instance* : « modélisé comme un graphe dès la version 1, même si chaque **étape ne pointe encore que vers une seule étape suivante** ». |
| **AD-005** Rythme commun | ❌ **CONTREDIT** | ch. 6 § *L'état d'avancement par équipe* : « **Chaque équipe possède son propre état d'avancement dans le scénario, indépendant d'une simple horloge globale partagée.** C'est cette donnée qui permettra plus tard à deux équipes de suivre des chemins différents ». Aussi 4.3 *fil conducteur*. |
| **AD-006** Règle de purge unique | ❌ **CONTREDIT** | **7.9 « Trois régimes de rétention »** (contenu réutilisable sans limite / livrable conservé / données brutes purgées, « les instances test bénéficient d'un délai plus court »), **7.10** (journal d'audit : régime propre **plus long**), 5.1.17, 8.1.5 (compteurs de facturation non purgés), 9.5. |
| **AD-007** Référentiel + 4 modes | ✅ partiel / ❌ partiel / ⚪ partiel | ✅ ciblage abstrait : 5.1.8, ch. 6 § *La cible de diffusion*. ⚪ le « référentiel déclaré » n'existe pas au PRD. ❌ 5.1.7 obtient la personne unique par **équipe × rôle** (pas de « place ») ; **5.1.11** impose un « avertissement **bloquant** […] que le facilitateur peut lever », là où AD-007 écrit « pas de blocage ». |
| **AD-008** Contrainte de portée en base | ⚪ (esprit ✅) | Muet (non technique) ; esprit soutenu par 7.8. |
| **AD-009** Canaux en liste fermée | ✅ | 5.4.2 (socle), 5.4.3 (optionnels), 5.4.4 « Ajouter un canal par type de crise est explicitement proscrit », glossaire *Canal*. |
| **AD-010** Email purgé | ✅ | 5.6.1, 5.6.4-5, 7.9.3, **8.2.4** (minimisation RGPD : « rien d'autre que le nom, l'email professionnel, l'équipe et le rôle »). |
| **AD-011** Auteur qualifié | ✅ principe / ⚪ forme | ch. 6 § *Deux populations, deux modèles d'identité* : « **deux tables**, deux mécanismes d'authentification et deux cycles de vie distincts ». Aussi 5.7.1, 5.2.8, 7.10. |
| **AD-012** Validation pour jouer | ✅ pour le bruit de fond / ⚪ pour le scénario | **5.3.6** : statut brouillon/validé et « ne pouvoir être utilisé dans un **exercice réel** qu'une fois validé » — mais ce texte ne vise **que le bruit de fond**. Rien d'équivalent pour le scénario. L'invalidation à la modification est muette. |
| **AD-013** Déclencheur = horloge fictive | ❌ **CONTREDIT FRONTALEMENT** | **5.2.6** : « **Le MEL reste cadencé en temps réel** […] **Le temps fictif ne commande jamais l'envoi** ». **5.2.5** : « **il n'existe donc pas d'horloge fictive à piloter séparément** ». ch. 6 § *objets fondateurs* : déclencheur = « le **temps réel écoulé** ». Glossaire : « Horloge réelle […] **Cadence le MEL** ». |
| **AD-014** Temps fictif normalisé | ⚪ forme / ✅ besoin | Muet sur la forme. Besoin confirmé par 5.4.18 (« la **date fictive courante de l'instance** »), 5.7.1 (horodatage des deux temps), 5.2.4. |
| **AD-015** Manuel + auto minimal | ✅ **les 2 modes sont exigés en v1** / ❌ le moteur | ✅ 4.2.3 et **5.2.1** (« automatiquement selon un **minuteur** »), 5.2.2 → **ce n'est donc pas un élargissement**. ❌ le moteur d'AD-015 avance l'*horloge fictive*, or 5.2.6 et ch. 6 disent que le minuteur cadence le **MEL en temps réel**. |
| **AD-016** Snapshot unique immuable | ✅ | 5.1.16 (« **une** version immuable »), glossaire *Version figée* (« **La** copie immuable »), ch. 6 § figement. |
| **AD-017** Bruit de fond ouvert | ❌ **CONTREDIT (assumé)** | **5.3.2** : « En version 1, **seul l'administrateur de la plateforme publie du bruit de fond** ; aucun compte client ne produit ses propres templates ». 5.3.3 (la réponse du PRD : passer par un inject ordinaire), 4.2.6, 4.3.3, 9.11. ⚠️ De plus 5.1 et ch. 6 donnent au template **les 3 portées**, là où AD-017 n'en retient que 2. |

## Correction des citations non vérifiées

Citations d'autorité émises pendant l'interview **sans avoir lu le passage**, rectifiées :

| Où | Ce qui était affirmé | Réalité vérifiée |
|----|----------------------|------------------|
| AD-005 | « horloge unique du PRD » | Le PRD décrit **deux** horloges (5.2.3) et un avancement **par équipe** (ch. 6). L'« horloge unique » n'existe nulle part au PRD → **décision d'interview sans appui PRD**. |
| AD-013 | « temps écoulé = horloge fictive » présenté comme acquis | **Contredit** par 5.2.5, 5.2.6, ch. 6 et le glossaire → **décision d'interview contredisant le PRD**. |
| `mvp-scope` n°1 | « aucun des 9 blocs ne couvre la traçabilité des actions d'administration » | Exact pour le ch. 4.1, mais **7.10 exige explicitement un journal d'audit** → ce n'est **pas** un élargissement. |
| `mvp-scope` n°2 | « 4.2.3 annonçait une horloge au choix **sans en préciser le moteur** » | Faux : **5.2.1** précise « minuteur » et **5.2.6** précise que le MEL est cadencé en temps réel → ce n'est **pas** un élargissement. |

---

# Arbitrages des contradictions PRD — 23/07/2026

Les 5 contradictions relevées lors de la confrontation ont été arbitrées avec Thomas, plus
2 points connexes. **Ces arbitrages priment sur le texte des AD concernées ci-dessus.**

## ARB-1 — Le déclencheur reste l'horloge fictive *(AD-013 et AD-015 maintenues)*

**Décision.** L'horloge fictive est bien un objet persisté sur l'instance, que le facilitateur
ou le moteur auto fait avancer, et c'est elle qui déclenche les injects « temps écoulé ».

**Conséquence : le PRD est amendé**, non l'AD. Passages à annoter : **5.2.5** (« il n'existe
pas d'horloge fictive à piloter séparément »), **5.2.6** (« le MEL reste cadencé en temps
réel », « le temps fictif ne commande jamais l'envoi »), **ch. 6 § objets fondateurs**
(déclencheur = « le temps réel écoulé »), **glossaire PRD** *Déclencheur* et *Horloge réelle*
(« Cadence le MEL »).

## ARB-2 — La position d'avancement est portée par l'ÉQUIPE *(AD-005 amendée)*

**Décision.** Retour au PRD ch. 6 : **chaque équipe porte sa propre position d'avancement**.
En v1 elles avancent toutes au même rythme (le pilotage à rythme commun d'AD-005 est
conservé), donc **toutes les valeurs sont identiques** ; la divergence v2 s'ouvre alors **sans
aucune migration**.

**Annule** la conséquence d'AD-005 qui déplaçait l'étape courante sur l'instance.

## ARB-3 — Les catégories de rétention du PRD sont écrites explicitement *(AD-006 amendée)*

**Décision.** On inscrit les catégories de **7.9** et **7.10** :

| Catégorie | Sort |
|---|---|
| Contenu réutilisable (scénarios, injects, fiches, briefings, bruit de fond) | **conservé sans limite** |
| Livrable de débrief | **conservé** (durée à fixer) |
| Journal d'audit | **conservé plus longtemps** que les données brutes |
| Compteurs de facturation (agrégats) | **survivent** à la purge |
| Données brutes d'instance (messages, réponses, sessions, identités éphémères) | **purgées** — délai **plus court** pour les instances test |

**Conservé d'AD-006** : le déclencheur (purger maintenant / à une date choisie), la séquence
stricte (jamais avant que le débrief soit généré et figé) et les garde-fous.
**Les durées précises restent ouvertes** (PRD 9.5) : on modélise les catégories sans les figer.

## ARB-4 — Contrôle avant lancement bloquant, mais la file ne se bloque jamais *(AD-007 amendée)*

**Décision, en deux temps.**
1. **Avant le lancement** : le contrôle de complétude est un **avertissement bloquant**
   (PRD 5.1.11). Le facilitateur traite chaque destinataire orphelin (ignorer / rediriger) puis
   **lève explicitement** l'avertissement. Le lancement est empêché jusque-là.
2. **Pendant l'exercice** *(précision nouvelle de Thomas)* : un inject dont la cible reste non
   résolue est **mis en attente et signalé** au facilitateur, mais **ne bloque JAMAIS la file** —
   les injects suivants partent normalement. Le facilitateur décide alors de définir la cible
   (l'inject part) ou de l'abandonner.

**Annule** la mention « pas de blocage » d'AD-007.

## ARB-5 — Ciblage = intersection de trois dimensions facultatives *(AD-007 amendée)*

**Décision.** La **« place individuelle » est abandonnée** (elle faisait doublon avec le
croisement équipe × rôle déjà prévu en 5.1.7). La cible est l'**intersection de trois
dimensions, chacune facultative** :

| Dimension | Absente = |
|---|---|
| Périmètre d'équipes | instance entière |
| Filtre de rôles | tous les membres |
| Personnes nommées | aucune restriction nominative |

**Le rôle n'est jamais obligatoire** — certains exercices sont des serious games où les
participants n'en portent pas (conforme à 5.6.1 « rôle **éventuel** » et 5.7.1 « lorsqu'il en
porte un »). On peut donc cibler `équipe × nom` sans rôle.

**Règle d'or maintenue** : la dimension **personnes nommées** ne peut être renseignée qu'au
niveau de l'**instance** (préparation en amont ou en direct) — **jamais** dans le scénario
réutilisable, qui ne compose que équipes × rôles. C'est la condition de la rejouabilité.

Exemples : `Équipe` · `Équipe × rôle` · `Équipe × rôle × nom` · `Équipe × nom` (serious game) ·
`Rôle seul` (les 300 pilotes) · `rien` (instance entière).

## ARB-6 — Périmètre du journal d'audit élargi *(AD-002 amendée)*

**Décision.** Le journal trace, en plus des actions d'administration déjà listées :
- **toutes les connexions** ;
- **tout accès de l'administrateur de la plateforme (l'éditeur) à des données client**.

Les lectures ordinaires ne sont pas instrumentées. Cela donne à « consultation sensible »
(PRD 7.10) une **définition opérationnelle** et couvre le risque désigné par **8.2.6** (le
premier point qu'un questionnaire de sécurité bancaire relève).

## ARB-7 — Le bruit de fond porte les 3 portées *(AD-017 amendée)*

**Décision.** Le bruit de fond suit **exactement la même règle de portée que le scénario et la
fiche personnage** : **plateforme, compte racine ou organisation** (conforme à 5.1 et ch. 6).
Cela permet à un cabinet de créer du bruit sur-mesure pour un client **sans que ses autres
clients le voient**.

**Précision de Thomas** : le bruit de fond de **portée plateforme, créé par l'administrateur
(l'éditeur)**, est **visible de tous les utilisateurs de la plateforme** — c'est le sens même
de cette portée.

**Annule** la restriction à 2 portées d'AD-017. Le reste d'AD-017 (création ouverte aux
responsables d'organisation et aux facilitateurs, à la portée dérivée de leur contexte
d'accès) est **maintenu** et demeure le seul véritable élargissement de périmètre.

---

## Conséquence sur les élargissements de périmètre MVP

La confrontation au PRD complet a montré que **deux des trois élargissements n'en étaient pas** :

| N° | Statut réel |
|----|-------------|
| ~~n°1 Audit d'administration~~ | **Exigé par le PRD 7.10** — ce n'est pas un élargissement. Périmètre élargi par ARB-6. |
| ~~n°2 Horloge automatique~~ | **Exigée par le PRD 4.2.3 et 5.2.1** — ce n'est pas un élargissement. |
| **n°1 (unique) — Création de bruit de fond par les clients** | **Seul véritable élargissement** : le PRD 5.3.2 réserve la création à l'éditeur en v1. Les 3 portées, elles, sont conformes (5.1, ch. 6). |

---

# Angles morts instruits — 23/07/2026

Éléments du PRD complet qu'aucune question de l'interview n'avait couverts.

## AD-018 — Idempotence du pilotage à plusieurs facilitateurs

**Date.** 23/07/2026
**Pourquoi.** Plusieurs facilitateurs pilotent la même instance ; sans garantie d'unicité, deux
clics simultanés produiraient un double envoi devant les participants.

**Décision.** Conforme au PRD **5.2.8** : **un inject ne peut être déclenché qu'une seule fois**,
quel que soit le nombre de facilitateurs qui actionnent le même bouton simultanément.

**Portée.** Le **déclenchement**, la **pause**, la **reprise** et l'**arrêt d'urgence** sont des
actions **idempotentes à l'échelle de l'instance**. La garantie est imposée **par la base** (et
non par l'interface), dans le même esprit qu'AD-008.

**Corollaire (PRD 5.2.8).** Chaque facilitateur voit en temps réel l'état du MEL et
**l'identité de l'auteur de la dernière action de pilotage**.

## AD-019 — Le niveau de permission est saisi à chaque attribution de profil

**Date.** 23/07/2026
**Pourquoi.** Thomas veut pouvoir accorder des exceptions négociées (un client autorisé à
écrire sur ses propres contenus), ce qu'une règle purement calculée interdirait.

**Décision.** Le droit (**lecture seule** / **écriture**) est un **champ explicite porté par
l'attribution de profil**, choisi au moment de l'attribution — et non déduit automatiquement
de la présence d'un cabinet au-dessus de l'organisation.

**Garde-fou proposé.** Le champ est **pré-rempli selon la règle du PRD 3.2.3** (lecture seule
si un cabinet sert l'organisation, écriture en modèle autonome), de sorte qu'accorder
l'écriture à un client soit toujours un **geste délibéré** et non un oubli.

> ⚠️ **Amende le PRD 3.2.3**, qui faisait de la lecture seule côté client une règle
> (« la modification du contenu restant au cabinet ») et non un paramètre. La protection
> devient une convention de saisie assistée par un défaut.

**Non modifié.** La **substitution** d'un profil supérieur (PRD 3.3) reste acquise : elle
descend dans l'arbre et **ne franchit jamais** la frontière cabinet / client. L'accès d'un
**facilitateur externe** reste attachable à une portée (organisation, mission ou instance)
**sans appartenance** à l'organisation concernée (PRD 3.3).

## AD-020 — Le réseau social est un fil partagé à l'échelle de l'instance

**Date.** 23/07/2026
**Pourquoi.** Dupliquer chaque publication dans 1500 boîtes de réception produirait plusieurs
millions de lignes par exercice, pour un contenu par nature public.

**Décision.** Une publication sur le réseau social simulé est écrite **une seule fois**, dans un
**fil partagé au niveau de l'instance**, lu par tous les participants toutes équipes confondues
(PRD 5.4.10). Elle **ne transite pas** par la boîte de réception par destinataire.

**Conséquence.** Le réseau social est le **seul canal** à ne pas suivre le modèle de livraison
par destinataire (AD/PRD 5.4.15). Son état « lu / non lu » et son rattrapage après déconnexion
reposent sur un **repère de lecture par participant** sur le fil, et non sur des lignes de
réception. Le volume reste **constant** quel que soit le nombre de participants.

## AD-021 — Annuaire typé + champ libre de contact sortant

**Date.** 23/07/2026
**Pourquoi.** Lister un persona externe à l'avance annonce la suite du scénario ; un champ
libre laisse le participant aller vers l'extérieur sans que la plateforme lui souffle qui existe.

**Décision, en trois parties.**

1. **Annuaire préparé au niveau du scénario.** Les personas mobilisés y sont listés en amont,
   chacun **typé** : partie prenante **interne** ou **externe**. Figé au lancement (AD-003).
2. **Vue du participant, calculée à l'affichage** (aucune liste stockée par participant) :
   - personas **internes** → visibles **dès le démarrage** ;
   - personas **externes** → visibles **seulement après qu'ils lui ont écrit** (information déjà
     portée par ses réceptions).
   **Aucun persona externe n'est jamais listé d'avance**, sans exception.
3. **Champ libre de contact sortant.** Le participant dispose d'un **champ de saisie libre** où
   il inscrit **qui il veut contacter** (« la préfecture », « notre assureur »). Le message part
   dans la **boîte de réception du facilitateur** (PRD 5.2.11), qui décide s'il répond et avec
   quel persona.

**Conséquence de modélisation.** Un message sortant de participant doit pouvoir porter une
**destination en texte libre**, et pas seulement un lien vers un persona existant.

> ⚠️ **Amende le PRD 5.4.12**, qui prévoyait de marquer certains personas « joignables dès le
> lancement » (le support informatique, l'astreinte, **l'autorité de tutelle**). Ce marquage
> disparaît : le typage interne/externe suffit, et l'autorité de tutelle, **externe**, n'est
> plus joignable d'emblée depuis l'annuaire — le participant la contacte par le champ libre.

## AD-022 — Le type d'un scénario se déduit de sa portée

**Date.** 23/07/2026
**Pourquoi.** Deux champs indépendants pour une seule décision autorisaient la combinaison
« sur-mesure + portée plateforme », c'est-à-dire la publication du contenu d'un client à tous
les autres.

**Décision.** Le champ **`type` est supprimé**. La **portée est la seule décision saisie** ; le
libellé métier s'en déduit à l'affichage :

| Portée | Libellé affiché |
|---|---|
| plateforme | catalogue |
| compte racine | catalogue |
| organisation | sur-mesure |

**Conséquence.** La combinaison incohérente devient **littéralement impossible à écrire**. Le
vocabulaire métier est intégralement conservé à l'écran. Conforme au PRD **5.1.14** : « le type
de scénario et sa portée sont deux expressions de la même décision, et non deux champs
indépendants ».

**Précision de vocabulaire.** « Catalogue » signifie au PRD **« écrit sur une organisation
fictive »**, et non « réutilisable ». Un scénario écrit pour une organisation réelle reste donc
**sur-mesure**, tout en étant **rejouable autant de fois que voulu** à l'intérieur de sa portée.
Les deux notions ne s'opposent pas.

## AD-023 — La portée « organisation » descend vers les filiales

**Date.** 23/07/2026
**Pourquoi.** Une organisation doit pouvoir écrire un exercice une seule fois au niveau du
groupe et le faire rejouer par chacune de ses filiales, sans le cloner ni maintenir des copies.

**Décision.** Un actif de contenu de **portée organisation** (scénario, fiche personnage, bruit
de fond) est utilisable par **l'organisation ET par toutes ses filiales**, sur toutes leurs
missions. La portée suit la **portée imbriquée** du ch. 3 : un niveau couvre les niveaux
inférieurs.

**Limites inchangées.** Une filiale ne voit jamais le contenu d'une **autre filiale**. Aucune
autre organisation ne voit ce contenu, y compris au sein du portefeuille d'un même cabinet
(PRD 5.1.1, 7.7).

> ⚠️ **Comble un silence du PRD** : 5.1.1 disait le contenu de portée organisation « cloisonné
> à elle » sans préciser le sort des filiales ; 3.2.3 ne traitait que la visibilité des
> exercices par le responsable, pas la réutilisation du contenu.

**Cas d'usage couvert.** Organisation **autonome** → un catalogue privé se pose en portée
**compte racine** ; organisation **cliente d'un cabinet** → en portée **organisation**. Dans les
deux cas, toutes les filiales peuvent rejouer l'exercice.

## AD-024 — Configuration de l'exercice : deux axes, choisie à l'instance

**Date.** 23/07/2026
**Pourquoi.** La forme d'un exercice ne commande pas que l'affichage : elle commande aussi le
ciblage, la livraison et le débrief — c'est donc un réglage **stocké en base**, pas du pur
frontend.

**Décision.** Un exercice porte une **configuration explicite** à **deux axes indépendants** :

| Axe | Valeurs |
|---|---|
| **Structure d'équipes** | liste à plat · une cellule · plusieurs cellules |
| **Rôles** | avec rôles · sans rôles |

- La configuration est **choisie au niveau de l'INSTANCE**, à la préparation ; **stockée en
  base**, **figée dans le snapshot** au lancement (AD-003).
- Les écrans (import, éditeur d'inject, débrief) **lisent** ce réglage pour afficher la bonne
  interface. Le front **reflète** la config, il ne la porte pas (principe PRD 5.8.4).
- **Conséquence assumée** : un scénario qui cible par rôle ou par équipe nommée, joué dans une
  instance de structure différente (ex. à plat, sans rôles), produit des **cibles non
  résolues**, traitées par **ARB-4** (avertissement bloquant au lancement, jamais bloquant en
  cours d'exercice).
- Le **scénario conserve son référentiel** (intention d'auteur, AD-007/ARB-5) ; l'instance le
  **réalise ou l'aplatit** via l'étape d'association au lancement.

**Rappel** : le caractère facultatif du rôle était déjà acté (ARB-5). AD-024 ajoute que
« sans rôles / sans équipes » est un **réglage explicite d'exercice**, et non seulement une
colonne laissée vide. Conforme au PRD (rôle « éventuel » 5.6.1, exercice à cellule unique
ch. 6) — **pas un élargissement de périmètre**.

## AD-025 — Exercice « liste à plat » = une cellule unique implicite masquée

**Date.** 23/07/2026
**Pourquoi.** Préserver un modèle unique de livraison, de ciblage et de débrief en évitant tout
cas particulier « participant sans équipe ».

**Décision.** Un exercice sans équipes est, **en base**, une instance à **une équipe par défaut**
contenant tous les participants ; l'**interface masque** la notion d'équipe. Le lien
participant → équipe **reste obligatoire**. Aucun cas « sans équipe » à gérer dans le ciblage,
la réception ou le débrief. Passer plus tard d'un jeu à plat à un exercice à cellules ne casse
rien.

**Note.** Une variante « cellule décisionnelle + cellule opérationnelle » n'est qu'un exercice
**à plusieurs cellules nommées** — aucun mécanisme spécial.

## AD-026 — Comportement de ciblage à l'écran (spec d'interface au-dessus d'ARB-5)

**Date.** 23/07/2026
**Pourquoi.** Rendre le ciblage fluide quel que soit ce qu'on sait des participants, **sans
changer le modèle de données** (les trois dimensions d'ARB-5 suffisent).

**Décision (interface, sans impact sur le schéma).**
1. **Rôle et personne sont liés** : sélectionner un **rôle** fait apparaître la ou les
   **personnes** qui le portent ; sélectionner une **personne** montre son **rôle** (s'il en a).
2. **Rôle porté par plusieurs personnes** (ex. 300 RSSI dans 300 cellules) : une case
   **« Envoyer à l'ensemble »** + choix du rôle dans une liste → **tous les porteurs** du rôle
   reçoivent l'inject.
3. **Mode jeu (sans rôles)** : le ciblage se fait directement par **prénom + nom**.

**Formulation à la préparation** *(spec d'écran)* : au démarrage d'un exercice, un choix de
**structure** — « liste de personnes » / « une cellule » / « plusieurs cellules » — et un choix
**rôles oui/non**, qui commandent l'affichage de l'import, de l'éditeur d'inject et du débrief.

## AD-027 — Temps fictif : saut de temps sur l'inject, en position absolue depuis le début

**Date.** 23/07/2026
**Pourquoi.** Garder l'écriture simple (une palette de sauts) tout en donnant à chaque inject
une date fictive **stable et directement comparable**, indépendante de l'ordre d'écriture.

**Décision.**
- Le temps fictif d'un inject est exprimé par un **saut de temps porté par l'inject**
  (PRD 5.2.5), **optionnel** : la plupart des injects n'en portent pas → ils se passent au
  **même moment fictif** que le fil (PRD 5.2.4).
- **Position absolue depuis le début de l'exercice** (J+0 = départ), et non cumulative :
  chaque inject porte sa distance au départ.
- **Palette simple** : heures **et** jours (`+Xh`, `+Xj`), en choix rapides.
- **Dérivation (AD-014)** : la position absolue **est** le repère normalisé triable ; le
  libellé affiché au participant (« Nous sommes à J+2 ») en est déduit, tout comme le saut
  annoncé (différence avec la position de l'inject précédent).
- **Distinction maintenue** (ARB-1) : ceci décrit **la date que l'inject annonce**, pas le
  moment réel où il part. Le déclenchement reste régi par AD-013 (horloge fictive / action du
  facilitateur).

**Règle de cohérence proposée.** La position fictive **ne peut pas reculer** le long du
déroulé (monotonie non décroissante) ; deux injects **peuvent** partager le même moment
fictif. Un réglage qui ferait revenir le temps fictif en arrière est refusé. *(À confirmer par
Thomas : suppose qu'aucun « flashback » n'est voulu en v1.)*

**Point de vigilance (AD-015).** Un saut à l'échelle du **jour** est un **bond instantané
annoncé**, piloté naturellement **à la main** ; le moteur automatique à cadence fixe sert les
cinétiques **continues intra-journée**. Les deux outils coexistent sans se gêner.

Conforme au PRD 5.2.4-5 ; confirme ARB-1 ; raffine AD-014. **Pas un élargissement de périmètre.**

## AD-028 — Portée de réutilisation : ajout du niveau « filiale » (4 niveaux)

**Date.** 23/07/2026
**Pourquoi.** Une filiale a besoin de réutiliser un contenu sur ses propres sites/missions
tout en le gardant privé des filiales sœurs — impossible avec les trois portées.

**Décision.** La portée de réutilisation passe de **3 à 4 valeurs** :
`plateforme · compte racine · organisation · filiale`.
- **Portée filiale** = contenu visible et réutilisable par **la filiale et ses missions /
  instances**, **invisible des filiales sœurs**. Le responsable d'organisation au-dessus le
  voit (portée imbriquée, PRD 3.2.3) ; les filiales sœurs non.
- **Étiquette** : `compte_racine_id` (AD-001) + cible `filiale_id` (contrainte « une seule
  cible », AD-008, à étendre au niveau filiale).
- **Clonage** : descend toujours vers le bas (plateforme → compte racine → organisation →
  filiale) ; l'inverse reste impossible (PRD 5.1.2).
- S'applique aux **trois actifs** de contenu (scénario, fiche personnage, bruit de fond).

> ⚠️ **Amende le PRD 5.1.1** (3 → 4 portées). **Élargissement de périmètre MVP assumé.** Le
> niveau « mission » (5ᵉ) a été écarté pour l'instant. Le PRD 3.3 (« le contenu appartient à la
> mission ») concerne les **droits/propriété** du contenu, distincts de la **portée de
> réutilisation** traitée ici.
