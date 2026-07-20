/**
 * Implémentation Mistral du FournisseurIA (PRD 7.5).
 * Mistral est déclaré comme sous-traitant ultérieur au sens de DORA (PRD 8.2.3).
 *
 * NOTE : squelette. L'appel HTTP réel est à brancher au cadrage technique.
 * Aucun code hors de ce fichier ne doit importer le SDK Mistral directement.
 */

import type { ContexteRolePlay, FournisseurIA, ReponseRolePlay } from "./provider";
import { assemblerPromptSysteme } from "./prompt";

export class MistralProvider implements FournisseurIA {
  readonly nom = "mistral";

  constructor(
    private readonly apiKey = process.env.MISTRAL_API_KEY ?? "",
    private readonly modele = process.env.MISTRAL_MODELE ?? "mistral-large-latest",
  ) {}

  async repondre(ctx: ContexteRolePlay, signal?: AbortSignal): Promise<ReponseRolePlay> {
    const promptSysteme = assemblerPromptSysteme(ctx);

    // TODO(cadrage-technique) : appel réel à l'API Mistral avec `signal`.
    // Le `signal` permet la reprise en main / l'arrêt d'urgence (PRD 5.5.11-13).
    // Forme de retour attendue :
    //   return { contenu: "…", meta: { modele: this.modele, prompt_systeme: promptSysteme, tokens: {…} } };
    void this.apiKey;
    void this.modele;
    void signal;
    void promptSysteme;

    throw new Error(
      "MistralProvider.repondre : non implémenté (squelette). " +
        "Brancher l'appel HTTP au cadrage technique.",
    );
  }
}
