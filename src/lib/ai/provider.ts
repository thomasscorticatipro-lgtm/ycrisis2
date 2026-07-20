/**
 * Couche d'abstraction du fournisseur de modèle IA (role-player).
 *
 * Exigence PRD 7.5 : « Le modèle doit rester interchangeable derrière une couche
 * d'abstraction, afin qu'un changement de fournisseur reste une décision et non
 * une réécriture. » Mistral est le fournisseur retenu (souveraineté), mais aucun
 * code applicatif ne doit dépendre directement de son SDK — seulement de cette interface.
 *
 * Cloisonnement du contexte (PRD 5.5.10) : un appel ne transporte QUE la fiche
 * personnage, le briefing du scénario joué et le fil de la conversation en cours.
 * Jamais le contenu d'une autre équipe, instance ou compte.
 */

export interface MessageConversation {
  role: "participant" | "persona";
  contenu: string;
}

/**
 * Contexte d'un appel role-player. Le prompt système n'est PAS stocké : il est
 * assemblé ici à partir de ces éléments au moment de l'appel (PRD 5.5.5).
 */
export interface ContexteRolePlay {
  fiche: {
    prenom: string;
    nom: string;
    metier: string;
    fonction: string;
    rattachement: string;
    ton: string;
  };
  briefing: {
    sait: string;
    ignore: string;
    cherche: string;
    interdits: string;
  };
  /** Fil de la conversation en cours avec CETTE équipe uniquement. */
  fil: MessageConversation[];
}

export interface ReponseRolePlay {
  contenu: string;
  /** Métadonnées à journaliser (PRD 5.5.12) : modèle, tokens, contexte assemblé. */
  meta: Record<string, unknown>;
}

export interface FournisseurIA {
  readonly nom: string;
  /**
   * Génère la prochaine réplique du persona. Doit être annulable côté appelant
   * (reprise en main facilitateur, arrêt d'urgence, clôture — PRD 5.5.11, 5.5.13).
   */
  repondre(ctx: ContexteRolePlay, signal?: AbortSignal): Promise<ReponseRolePlay>;
}
