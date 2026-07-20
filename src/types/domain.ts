/**
 * Types métier du simulateur de crise.
 *
 * Ce fichier traduit le glossaire figé du PRD (ch. 10) en types TypeScript.
 * Le vocabulaire est STRICT : voir CLAUDE.md. Ne jamais renommer ces concepts.
 *
 * ⚠️ Ces types décrivent le modèle CONCEPTUEL (PRD ch. 6). Le schéma SQL
 * réel et ses policies RLS vivent dans `supabase/migrations/`. La barrière de
 * sécurité est côté serveur (RLS), jamais dans ces types ni dans l'affichage.
 */

// ---------------------------------------------------------------------------
// Modèle d'usage & hiérarchie des comptes (PRD ch. 1, 3, 6)
// ---------------------------------------------------------------------------

/** Deux modèles d'usage, distingués UNIQUEMENT par la présence du cabinet. */
export type ModeleUsage = "pilote" | "autonome";

/** Nature d'un compte racine — figée à sa création (PRD 5.8.1). */
export type NatureCompte = "cabinet" | "organisation_autonome";

/** Les cinq profils, du plus large au plus restreint (PRD 3.2). */
export type Profil =
  | "admin_plateforme"
  | "responsable_cabinet"
  | "responsable_organisation"
  | "responsable_filiale"
  | "facilitateur";

/** Niveau de permission, distinct de la portée (PRD 3.2). */
export type NiveauPermission = "consulter" | "creer" | "modifier";

/** Portée d'un profil : quelles données sont visibles (PRD 3.2). */
export type PorteeProfil =
  | "cabinet"
  | "organisation"
  | "filiale"
  | "mission"
  | "instance";

export type UUID = string;

/**
 * Compte racine = seule frontière d'isolation (PRD 6, 7.6).
 * Un cabinet OU une organisation autonome.
 */
export interface CompteRacine {
  id: UUID;
  nature: NatureCompte;
  nom: string;
  cree_le: string;
}

export interface Cabinet {
  id: UUID;
  compte_racine_id: UUID; // == id du compte racine (nature = cabinet)
  nom: string;
}

export interface Organisation {
  id: UUID;
  /** Présent uniquement en modèle piloté ; null en modèle autonome. */
  cabinet_id: UUID | null;
  /** En modèle autonome, l'organisation EST le compte racine. */
  compte_racine_id: UUID;
  nom: string;
}

/** Couche facultative — jamais utilisée pour modéliser un portefeuille de clients. */
export interface Filiale {
  id: UUID;
  organisation_id: UUID;
  nom: string;
}

/**
 * Couche à part entière de l'arbre + unité de rattachement des droits et du
 * contenu sur-mesure partagés entre facilitateurs (PRD 3.3, glossaire).
 */
export interface Mission {
  id: UUID;
  organisation_id: UUID;
  filiale_id: UUID | null; // rattachement direct à l'organisation si null
  nom: string;
}

// ---------------------------------------------------------------------------
// Contenu réutilisable & portée (PRD 5.1, 6)
// ---------------------------------------------------------------------------

/** Le clonage ne descend que vers le bas : plateforme → compte_racine → organisation. */
export type PorteeReutilisation = "plateforme" | "compte_racine" | "organisation";

export type StatutContenu = "brouillon" | "valide" | "archive";

/** Canaux du socle (toujours présents) — PRD 5.4.2. */
export type CanalSocle =
  | "mail"
  | "chat_equipe"
  | "messagerie_pro"
  | "journal_de_bord"
  | "decisions"
  | "reseau_social"
  | "site_actualite";

/** Canaux optionnels (activés selon le scénario) — PRD 5.4.3. */
export type CanalOptionnel = "tableau_de_bord" | "carte_situation" | "bulletin_autorite";

export type Canal = CanalSocle | CanalOptionnel;

/** Interruptions en mode actif — NE SONT PAS des canaux (PRD 5.4.5). */
export type Interruption = "appel" | "video" | "popup";

/** Mode de livraison d'un inject (PRD 5.4.6). */
export type ModeLivraison = "passif" | "actif";

/**
 * Fiche personnage : ce qu'un personnage EST, indépendamment de toute crise.
 * Permanente, réutilisable, porte une portée (PRD 5.5.1-2).
 */
export interface FichePersonnage {
  id: UUID;
  portee: PorteeReutilisation;
  compte_racine_id: UUID | null; // null pour la portée plateforme (éditeur)
  organisation_id: UUID | null; // renseigné pour la portée organisation
  prenom: string;
  nom: string;
  metier: string;
  fonction: string;
  rattachement: string; // employeur ou média
  expertise: string;
  ton: string;
  statut: StatutContenu;
}

/**
 * Briefing : ce qu'un personnage sait/ignore/cherche/s'interdit dans UN scénario.
 * Seul objet de contenu SANS portée propre — hérite de celle du scénario (PRD 5.5.3-4).
 */
export interface Briefing {
  id: UUID;
  fiche_personnage_id: UUID;
  scenario_id: UUID;
  sait: string;
  ignore: string;
  cherche: string;
  interdits: string;
}

/**
 * Cible de diffusion = intersection de deux dimensions multi-valuées (PRD 5.1.7, 6).
 * Toujours abstraite (noms d'équipes / de rôles), jamais un nom propre.
 */
export interface CibleDiffusion {
  /** Instance entière si `equipes` est null, sinon liste d'équipes nommées. */
  equipes: string[] | null;
  /** Tous les membres si `roles` est null, sinon liste de rôles. */
  roles: string[] | null;
}

export type TypeDeclencheur = "temps_reel" | "action_facilitateur" | "decision_joueur";

export interface Declencheur {
  type: TypeDeclencheur;
  /** Secondes écoulées depuis le lancement, pour le type temps_reel. */
  offset_secondes?: number;
}

/**
 * Inject : unité de contenu injectée. Objet central (PRD 6).
 */
export interface Inject {
  id: UUID;
  scenario_id: UUID;
  source_fiche_id: UUID; // qui parle
  canal: Canal;
  mode_livraison: ModeLivraison;
  contenu: string;
  cible: CibleDiffusion;
  declencheur: Declencheur;
  /** Nouvelle date fictive installée au déclenchement, le cas échéant (PRD 5.2.5). */
  saut_de_temps?: string;
}

/**
 * Scénario : le plan écrit réutilisable. Modélisé en graphe dès v1 (une seule
 * suite par étape en v1 ; branchement réel en v2). PRD 6.
 */
export interface Scenario {
  id: UUID;
  portee: PorteeReutilisation;
  compte_racine_id: UUID | null;
  organisation_id: UUID | null;
  titre: string;
  /** Type et portée sont deux expressions de la même décision (PRD 5.1.14). */
  type: "catalogue" | "sur_mesure";
  statut: StatutContenu;
  canaux_optionnels_actifs: CanalOptionnel[];
}

/** Template de bruit de fond — porte une portée, pas de cible (PRD 5.3.4-5). */
export interface TemplateBruitDeFond {
  id: UUID;
  portee: PorteeReutilisation; // en v1, toujours "plateforme"
  canal: Canal;
  source_fiche_id: UUID;
  contenu: string;
  statut: StatutContenu;
}

// ---------------------------------------------------------------------------
// Exécution : instance, équipes, participants (PRD 3.1, 6)
// ---------------------------------------------------------------------------

export type StatutInstance =
  | "preparation"
  | "en_cours"
  | "pause"
  | "arret_urgence"
  | "close";

/**
 * Instance : exécution réelle d'un scénario. Fige son contenu à son lancement
 * (PRD 5.1.16). JAMAIS un serveur.
 */
export interface Instance {
  id: UUID;
  mission_id: UUID;
  scenario_id: UUID; // référence l'actif ; la version figée est stockée à part
  titre: string;
  est_test: boolean; // mode répétition (PRD 5.1.17)
  statut: StatutInstance;
  mode_horloge: "automatique" | "manuel";
  date_fictive_courante: string | null;
  lance_le: string | null;
  close_le: string | null;
}

/** Cellule de jeu — ne porte AUCUN droit d'accès (PRD 6, glossaire). */
export interface Equipe {
  id: UUID;
  instance_id: UUID;
  nom: string;
}

/** Origine de l'inscription d'un participant (PRD 5.6.8). */
export type OrigineParticipant = "invite" | "auto_inscrit";

/**
 * Participant : identité ÉPHÉMÈRE, sans compte ni mot de passe, rattachée à UNE
 * instance, portée par un lien personnel unique. Table/auth/cycle de vie
 * distincts des utilisateurs plateforme (PRD 3.1, 6).
 */
export interface Participant {
  id: UUID;
  equipe_id: UUID;
  instance_id: UUID;
  nom: string;
  email: string;
  /** Rôle unique par participant : cible d'inject ET axe de débrief (PRD 5.6.2). */
  role: string | null;
  origine: OrigineParticipant;
  present: boolean;
}

// ---------------------------------------------------------------------------
// Événements — la table `events` (PRD 5.7, 7.10)
// ---------------------------------------------------------------------------

/** Tout événement métier est typé, horodaté et attribué. */
export type TypeEvenement =
  | "inject_emis"
  | "message_participant"
  | "message_facilitateur"
  | "message_ia"
  | "decision"
  | "saut_de_temps"
  | "connexion"
  | "pause"
  | "reprise"
  | "arret_urgence"
  | "cloture"
  | "invitation_emise"
  | "acces_donnees_client";

export interface Evenement {
  id: UUID;
  instance_id: UUID | null;
  type: TypeEvenement;
  equipe_id: UUID | null;
  role: string | null;
  auteur_id: UUID | null;
  /** Horodatage réel : pilotage, débrief, audit. */
  horodatage_reel: string;
  /** Horodatage fictif : relecture du scénario. */
  horodatage_fictif: string | null;
  charge: Record<string, unknown>;
}
