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
