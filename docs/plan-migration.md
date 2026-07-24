# Plan de migration corrective — du socle `0001` aux décisions AD-001→034

**ÉTAPE 2 du processus de consolidation. Document de planification — aucune migration n'est
écrite ni exécutée ici.** L'écriture des fichiers SQL et leur exécution relèvent de l'ÉTAPE 3,
qui ne démarre qu'après **validation écrite de ce plan**.

## 0. Cadre

- **État déployé** : `supabase/migrations/0001_socle.sql` — **18 tables, 8 enums**, RLS activée
  et forcée partout **sans aucune policy permissive** (deny-by-default).
- **Données** : base de **dev, vide** (aucun exercice joué). Les points marqués 🟥 ci-dessous
  sont **structurellement destructifs** (drop/rename de colonne, changement de type) mais
  **n'emportent aucune donnée réelle aujourd'hui**. ⚠️ À **re-vérifier avec `service_role`**
  avant toute exécution en ÉTAPE 3 (le count via `anon` est masqué par la RLS).
- **Règles** : migrations versionnées et idempotentes autant que possible ; **RLS avant tout
  code** ; on n'exécute rien sans feu vert ; jamais de modification manuelle dans Studio.
- **Autorité** : le journal `docs/decisions/architecture-decisions.md` fait foi ; les **ARB**
  priment sur les AD amendées.

## 1. Séquence proposée (ordre imposé par les dépendances)

Le plan est découpé en **8 migrations** (`0002`→`0009`). L'ordre suit les dépendances :
les types d'abord, l'isolation ensuite (socle de toute la RLS), puis le contenu, l'exécution,
la livraison, les journaux, et enfin les policies fines.

| # | Migration | Objet | Dépend de |
|---|-----------|-------|-----------|
| **0002** | Types & énumérations | Nouveaux enums + extension des existants | — |
| **0003** | Isolation universelle | `compte_racine_id` partout + triggers + immuabilité | 0002 |
| **0004** | Contenu & portée | Portées (filiale, bruit de fond), contraintes, canaux, validation, drop `type` | 0002, 0003 |
| **0005** | Graphe & injects | Étapes, refonte inject (déclencheur, temps fictif, cibles, média), avancement | 0002, 0004 |
| **0006** | Exécution & snapshot | Config d'exercice, horloge, snapshot hybride + unicité, association, arrêt d'urgence | 0003, 0005 |
| **0007** | Livraison & interactions | Réception (expéditeur qualifié), réseau social, annuaire, events (auteur qualifié) | 0005, 0006 |
| **0008** | Journaux & rétention | `admin_audit_log`, livrable de débrief détaché, purge, droit d'attribution | 0003, 0006 |
| **0009** | RLS fines | Fonctions de portée `SECURITY DEFINER` + policies | tout |

---

## 2. Détail par migration

### 0002 — Types & énumérations

**Intention.** Poser tous les types contrôlés avant de les référencer.

- **Créer** les enums : `canal` (mail, chat_equipe, messagerie_pro, journal_bord, decisions,
  reseau_social, actualite, tableau_bord, carte_situation, bulletin_autorite) [AD-009] ·
  `type_declencheur` (temps_ecoule, action_facilitateur, decision_joueur — la dernière prévue
  mais non utilisée en v1) [AD-013] · `structure_equipes` (liste_plate, une_cellule,
  plusieurs_cellules) [AD-024] · `droit_permission` (lecture, ecriture) [AD-019] ·
  `format_media` (texte, video, audio) [AD-032] · `type_partie_prenante` (interne, externe)
  [AD-021] · `etat_conversation_ia` (ia, humain) [AD-033 — sous réserve, cf. §4].
- **Étendre** `portee_reutilisation` : ajouter la valeur **`filiale`** [AD-028]. 🟥 *ajout de
  valeur d'enum = sans risque ; ordre des valeurs sans importance.*

### 0003 — Isolation universelle (`compte_racine_id` partout)

**Intention.** Chaque ligne porte directement son propriétaire, dérivé automatiquement et
non modifiable — socle de la RLS par comparaison directe [AD-001/001b].

- **Ajouter `compte_racine_id uuid NOT NULL`** (FK → `compte_racine`) aux tables qui ne le
  portent pas encore : `filiale`, `mission`, `instance`, `equipe`, `participant`, `reception`,
  `avancement_equipe`, `events`, `version_figee`, `briefing`, `inject`,
  `template_bruit_de_fond`. *(`organisation` l'a déjà ; `fiche_personnage`, `scenario`,
  `attribution_profil`, `invitation` le portent en cible de portée — traités en 0004.)*
- **Triggers `BEFORE INSERT`** dérivant `compte_racine_id` du parent (ex. `instance` ←
  `mission` ← `organisation.compte_racine_id` ; `equipe` ← `instance` ; `participant` ←
  `equipe`…). Un helper par chaîne.
- **Immuabilité** : trigger `BEFORE UPDATE` rejetant toute modification de `compte_racine_id`.
- 🟥 *Ajout d'une colonne `NOT NULL` sans défaut : destructif sur table non vide → exige un
  backfill. Tables vides aujourd'hui, donc sans effet.*

### 0004 — Contenu & portée

**Intention.** Rendre la portée cohérente et garantie en base, contrôler les canaux, brancher
la validation.

- **Contrainte « une seule portée »** [AD-008] : `CHECK` sur `attribution_profil`,
  `invitation`, `fiche_personnage`, `scenario`, `template_bruit_de_fond` garantissant
  qu'exactement la bonne cible (`compte_racine_id` / `organisation_id` / `filiale_id` /
  `mission_id`) est renseignée selon la portée.
- **Portée « filiale »** [AD-028] : ajouter `filiale_id` (cible) sur `fiche_personnage`,
  `scenario`, `template_bruit_de_fond` ; intégrer à la contrainte ci-dessus.
- **Bruit de fond aux 3 portées** [AD-017/ARB-7] : ajouter `organisation_id` (et `filiale_id`)
  à `template_bruit_de_fond` ; retirer le défaut `plateforme` imposé, garder la portée
  explicite ; RLS de création par contexte en 0009.
- **Canaux contrôlés** [AD-009] : `inject.canal`, `reception.canal`,
  `template_bruit_de_fond.canal` : **`text` → `canal` (enum)**. 🟥 *changement de type.*
  `scenario.canaux_optionnels_actifs` : `text[]` → `canal[]`. 🟥
- **Drop `scenario.type`** [AD-022] : supprimer la colonne `type` et son `CHECK` ; le libellé
  catalogue/sur-mesure se déduit de la portée. 🟥 *drop de colonne.*
- **Validation du contenu** [AD-012] : trigger qui, à la modification d'un `scenario` `valide`,
  le repasse en `brouillon` ; la barrière « scénario validé pour lancer une instance réelle »
  est posée en 0006 (dépend de l'instance). Contenu de portée plateforme **archivable et non
  supprimable** [5.1.4] → ⏳ *à confirmer, cf. §4*.

### 0005 — Graphe & injects

**Intention.** Introduire les étapes, refondre l'inject (déclencheur, temps fictif, cibles,
format), et l'avancement par équipe.

- **Étapes** [AD-004] : nouvelle table `etape` (`scenario_id`, `titre`, `etape_suivante_id`
  self-FK **nullable, un seul lien sortant en v1**). `inject.etape_id` (FK) ; l'ordre des
  injects se lit dans l'étape.
- **Avancement par équipe** [AD-005/ARB-2] : `avancement_equipe.etape_courante` (int) →
  `etape_courante_id` (FK → `etape`). 🟥 *changement de sémantique/colonne.* Reste **porté par
  l'équipe** (pas déplacé sur l'instance).
- **Déclencheur** [AD-013] : `inject.declencheur_type` : `text` → `type_declencheur` (enum). 🟥
- **Temps fictif** [AD-014/AD-027] : remplacer `inject.offset_secondes` + `saut_de_temps`
  (text) par une **position fictive absolue triable** (ex. `position_fictive_minutes int` ou
  `interval`) **facultative** + `saut_libelle text`. 🟥 *drop/remplacement de colonnes.*
  Contrainte de **monotonie non décroissante** le long du déroulé.
- **Format média** [AD-032] : `inject.format_media` (enum, défaut `texte`) pour le canal
  actualité.
- **Référentiel de cibles** [AD-007/ARB-5] : nouvelle table `referentiel_destinataire`
  (`scenario_id`, `genre` equipe|role, `nom` déclaré). Refonte du ciblage de l'inject :
  **supprimer** `cible_equipes text[]` et `cible_roles text[]` 🟥 ; les remplacer par des liens
  vers le référentiel + les 3 dimensions facultatives (périmètre d'équipes, filtre de rôles,
  et la cible spéciale « toutes les cellules »). Les **personnes nommées** ne vivent qu'au
  niveau instance (0006), jamais ici.

### 0006 — Exécution & snapshot

**Intention.** Configurer l'exercice, l'horloge, figer proprement, associer les cibles.

- **Config d'exercice** [AD-024/025] : `instance.structure_equipes` (enum) + `utilise_roles`
  (bool). Figées dans le snapshot. L'exercice « liste à plat » = **une équipe implicite**
  (`equipe_id` reste `NOT NULL`).
- **Horloge** [AD-013/014/015] : `instance.date_fictive_courante` (text) → **repère structuré**
  (position + `libelle`) 🟥 ; `mode_horloge` conservé ; ajouter `rapport_auto` (cadence du
  moteur automatique, ex. minutes réelles par heure fictive) [AD-015].
- **Snapshot hybride + unicité** [AD-003/016] : `version_figee` garde `contenu jsonb` (archive)
  ; **`UNIQUE(instance_id)`** + immuabilité (triggers refusant UPDATE/DELETE). Nouvelle table
  **`inject_fige`** (copie figée des injects joués, liée à `instance`/`version_figee`,
  interrogeable et référencée par `reception`/`events`).
- **Association des destinataires** [AD-007] : nouvelle table `association_destinataire`
  (`instance_id`, `referentiel_id` → `equipe_id` **ou** liste de `participant_id`), produite au
  lancement ; support du contrôle de complétude **bloquant** (ARB-4).
- **Arrêt d'urgence** [AD-034] : le statut `arret_urgence` existe déjà dans `statut_instance`.
  Ajouter sur `instance` : `arret_message`, `arret_auteur_id`, `arret_le`,
  `mel_position_au_gel`. L'arrêt est aussi un **événement de premier ordre** (0007).

### 0007 — Livraison & interactions

**Intention.** Réceptions avec expéditeur qualifié, réseau social à part, annuaire typé,
events fiables.

- **Expéditeur qualifié dans `reception`** [AD-030] : ajouter `expediteur_fiche_id` (→
  `inject_fige`/fiche figée) **ou** `expediteur_participant_id` (→ `participant`), `CHECK`
  exactement un. Permet le flux **participant → participant / équipe**. `reception.canal`
  déjà en enum (0004).
- **Réseau social = fil partagé** [AD-020] : nouvelle table `publication_reseau_social`
  (`instance_id`, `auteur_participant_id`, `contenu`, horodatages réel + fictif) + table de
  **repère de lecture par participant** (non-lus). **Ne passe pas** par `reception`.
- **Annuaire typé** [AD-021] : marquer chaque persona d'un scénario `type_partie_prenante`
  (interne/externe) — porté par le lien persona↔scénario (candidat : `briefing` ou une table
  `scenario_persona`). Message sortant à **destination libre** (champ texte) vers la boîte du
  facilitateur.
- **Auteur qualifié dans `events`** [AD-011] : remplacer `auteur_id uuid` par
  `auteur_utilisateur_id` (→ `auth.users`) **et** `auteur_participant_id` (→ `participant`),
  `CHECK` exactement un. 🟥 *drop/remplacement de colonne.*
- **`events.instance_id NOT NULL`** [AD-002] : resserrer (events = intérieur d'un exercice). 🟥
  *contrainte durcie.*

### 0008 — Journaux & rétention

**Intention.** Audit d'administration séparé, débrief qui survit, purge programmable.

- **`admin_audit_log`** [AD-002/ARB-6] : nouvelle table append-only (`compte_racine_id` dérivé
  par trigger et immuable, `type_action`, `acteur_utilisateur_id`, `horodatage`, `charge
  jsonb`). **REVOKE** UPDATE/DELETE + policies refusant toute mutation. Trace : administration,
  **connexions**, **accès de l'éditeur aux données client**, validations, purges, bruit de
  fond.
- **Livrable de débrief détaché** [AD-006] : nouvelle table `livrable_debrief`
  (`instance_id` **sans `ON DELETE CASCADE`**, ou `compte_racine_id` seul + copie autoportante
  avec noms) → **survit à la purge de l'instance**. Contient le document figé.
- **Purge programmable** [AD-006/ARB-3] : sur `instance`, `purge_programmee_le`,
  `purge_executee_le`, `debrief_genere_le` ; garde-fou « jamais avant débrief figé ». Les
  **catégories de rétention** sont matérialisées par : contenu réutilisable (sans limite),
  livrable (conservé), audit (plus long), **compteurs de facturation** (survivent — ⏳ table à
  concevoir, cf. §4), données brutes d'instance (purgées, délai plus court si `est_test`). Les
  **durées** restent ouvertes (PRD 9.5).
- **Droit d'attribution** [AD-019] : `attribution_profil.droit` (`droit_permission`),
  pré-rempli selon la règle 3.2.3.

### 0009 — RLS fines

**Intention.** Écrire les policies, adossées à des fonctions de portée — le cœur sécurité.
Aucune policy permissive n'existe aujourd'hui : rien n'est lisible tant que 0009 n'est pas
posé.

- **Fonctions `SECURITY DEFINER`** calculant le périmètre visible de l'utilisateur courant :
  comptes racine accessibles, organisations, filiales, missions, instances ; **portée
  imbriquée + héritage** [3.2, AD-023] ; **substitution** d'un profil supérieur dans son arbre
  [3.3] ; **facilitateur externe** rattaché à une portée sans appartenance [3.3].
- **Policies par table** : lecture/écriture selon le périmètre et le **droit** (AD-019) ;
  contenu de portée plateforme visible de tous ; **cloisonnement inter-organisations d'un même
  cabinet** [7.7] ; **portée filiale** invisible des filiales sœurs [AD-028] ; **accès
  participant borné à sa seule instance** via son jeton ; `admin_audit_log` en **lecture
  réservée aux administrateurs** ; réseau social lisible par toute l'instance [AD-020].
- **Création de bruit de fond** par contexte d'accès [AD-017] : responsables d'organisation et
  au-dessus, facilitateurs à leur portée dérivée ; jamais un participant.
- ⏳ **Règles d'invitation en cascade** [5.8.6-9] : à trancher (cf. §4) avant d'écrire les
  policies de `invitation`.

---

## 3. Destructions & renommages explicites 🟥

Tout est **sans perte aujourd'hui** (base vide), mais **structurellement destructif** — à
exécuter sur une base neuve, ou avec backfill si des données existent en ÉTAPE 3.

| Élément | Nature | Migration | Décision |
|---|---|---|---|
| `scenario.type` (+ CHECK) | **DROP colonne** | 0004 | AD-022 |
| `inject.cible_equipes`, `inject.cible_roles` (text[]) | **DROP colonnes** | 0005 | AD-007 |
| `inject.offset_secondes`, `inject.saut_de_temps` | **DROP/remplacement** | 0005 | AD-014/027 |
| `inject.canal`, `reception.canal`, `template.canal` : text→enum | **Changement de type** | 0004 | AD-009 |
| `scenario.canaux_optionnels_actifs` : text[]→canal[] | **Changement de type** | 0004 | AD-009 |
| `inject.declencheur_type` : text→enum | **Changement de type** | 0005 | AD-013 |
| `avancement_equipe.etape_courante` : int→FK `etape` | **Remplacement colonne** | 0005 | AD-005/ARB-2 |
| `instance.date_fictive_courante` : text→repère structuré | **Remplacement colonne** | 0006 | AD-014 |
| `events.auteur_id` (uuid) → 2 colonnes qualifiées | **DROP/remplacement** | 0007 | AD-011 |
| `events.instance_id` : nullable→NOT NULL | **Contrainte durcie** | 0007 | AD-002 |
| `compte_racine_id NOT NULL` sur 13 tables | **Ajout NOT NULL** (backfill si données) | 0003 | AD-001 |
| `reception` : réseau social n'y transite plus | **Changement de flux** (pas de DDL destructif) | 0007 | AD-020 |

---

## 4. Décisions manquantes qui BLOQUENT une partie du plan ⏳

Ces angles morts doivent être **tranchés avant d'écrire les migrations concernées**. Ils ne
bloquent pas tout le plan, seulement les morceaux indiqués.

1. **Objet « conversation IA »** — AD-033 n'a fixé que la stratégie fournisseur. Il manque la
   modélisation de la *conversation* (fil par persona × équipe/participant), de l'**état de
   délégation** (IA/humain, exception message par message), de la **reprise en main** et de la
   **journalisation du contexte** (5.5.12). → **bloque une partie de 0007.**
2. **Invitation en cascade** [5.8.6-9] — la table `invitation` existe, mais les règles (qui
   invite qui, borne, renvoi) ne sont pas actées. → **bloque les policies de `invitation` en
   0009.**
3. **Compteurs de facturation** [8.1.5] — doivent survivre à la purge ; table d'agrégats à
   concevoir. → **bloque un morceau de 0008.**
4. **Contenu plateforme archivable / non supprimable** [5.1.4] — contrainte sur le statut et
   l'interdiction de suppression une fois référencé. → **précision à 0004.**
5. **Durées de rétention** [ARB-3, PRD 9.5] — volontairement ouvertes ; la purge sera
   **paramétrable**, les délais fixés plus tard. *(N'empêche pas 0008, mais à noter.)*

---

## 5. Vérifications prévues (aperçu ÉTAPE 3, pour mémoire)

Après validation écrite de ce plan : exécution **en local d'abord**, puis
- **Advisors Supabase** (sécurité + performance) au vert ;
- **RLS activée et forcée** sur 100 % des tables, aucune table lisible sans policy ;
- **test d'isolation deux comptes racines** (A ne voit rien de B, y compris l'existence) ;
- vérification du **cloisonnement inter-filiales** et **inter-organisations d'un même cabinet** ;
- puis déploiement. Chaque migration versionnée, **jamais de modification manuelle dans Studio**.

---

*Fin du plan. En attente de validation écrite avant l'ÉTAPE 3.*
