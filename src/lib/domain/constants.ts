/**
 * Constantes de domaine partagées (libellés FR + listes canoniques).
 * Source de vérité : le glossaire du PRD (ch. 10). Voir aussi src/types/domain.ts.
 */

import type { CanalSocle, CanalOptionnel, Profil } from "@/types/domain";

/** Canaux du socle, toujours présents (PRD 5.4.2). */
export const CANAUX_SOCLE: readonly CanalSocle[] = [
  "mail",
  "chat_equipe",
  "messagerie_pro",
  "journal_de_bord",
  "decisions",
  "reseau_social",
  "site_actualite",
] as const;

/** Canaux optionnels, activés selon le scénario (PRD 5.4.3). */
export const CANAUX_OPTIONNELS: readonly CanalOptionnel[] = [
  "tableau_de_bord",
  "carte_situation",
  "bulletin_autorite",
] as const;

/** Canaux sur lesquels le participant peut ÉCRIRE (PRD 5.4.9). */
export const CANAUX_ECRITURE: readonly CanalSocle[] = [
  "mail",
  "chat_equipe",
  "messagerie_pro",
  "journal_de_bord",
  "decisions",
  "reseau_social",
] as const;

/** Libellés d'affichage des canaux. */
export const LIBELLE_CANAL: Record<CanalSocle | CanalOptionnel, string> = {
  mail: "Mail",
  chat_equipe: "Chat d'équipe",
  messagerie_pro: "Messagerie pro",
  journal_de_bord: "Journal de bord",
  decisions: "Décisions",
  reseau_social: "Réseau social",
  site_actualite: "Site d'actualité",
  tableau_de_bord: "Tableau de bord",
  carte_situation: "Carte de situation",
  bulletin_autorite: "Bulletin d'autorité",
};

/** Profils du plus large (rang 0) au plus restreint. Sert à la cascade d'invitation (PRD 5.8.6). */
export const PROFILS_ORDONNES: readonly Profil[] = [
  "admin_plateforme",
  "responsable_cabinet",
  "responsable_organisation",
  "responsable_filiale",
  "facilitateur",
] as const;

export const LIBELLE_PROFIL: Record<Profil, string> = {
  admin_plateforme: "Administrateur de la plateforme",
  responsable_cabinet: "Responsable de cabinet",
  responsable_organisation: "Responsable d'organisation",
  responsable_filiale: "Responsable de filiale",
  facilitateur: "Facilitateur",
};

/** Rang hiérarchique d'un profil (0 = plus large). */
export function rangProfil(p: Profil): number {
  return PROFILS_ORDONNES.indexOf(p);
}

/**
 * Un profil ne peut inviter que vers un niveau égal ou inférieur au sien (PRD 5.8.6).
 * L'admin plateforme est hors de ce mécanisme pour la création de comptes racine.
 */
export function peutInviter(inviteur: Profil, invite: Profil): boolean {
  return rangProfil(invite) >= rangProfil(inviteur);
}

/** Mention de sûreté ajoutée automatiquement par le moteur (PRD 5.9.1). Non supprimable. */
export const MENTION_EXERCICE = "EXERCICE - EXERCICE";

/** Durée de validité d'un lien d'invitation (PRD 5.8.8). */
export const INVITATION_TTL_JOURS = 7;
