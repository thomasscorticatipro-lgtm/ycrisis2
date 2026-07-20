/**
 * Point d'entrée unique du role-player IA. Le reste de l'application n'importe
 * QUE ce module — jamais un fournisseur concret — pour préserver l'interchangeabilité (PRD 7.5).
 */

import type { FournisseurIA } from "./provider";
import { MistralProvider } from "./mistral";

let instance: FournisseurIA | null = null;

/** Fournisseur IA actif. Mistral par défaut (souveraineté). */
export function fournisseurIA(): FournisseurIA {
  if (!instance) {
    instance = new MistralProvider();
  }
  return instance;
}

export type { FournisseurIA, ContexteRolePlay, ReponseRolePlay } from "./provider";
