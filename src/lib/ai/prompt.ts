/**
 * Assemblage du prompt système du role-player IA (PRD 5.5.5).
 * Objet NON stocké : reconstruit à chaque appel à partir de la fiche + briefing.
 */

import type { ContexteRolePlay } from "./provider";

export function assemblerPromptSysteme(ctx: ContexteRolePlay): string {
  const { fiche, briefing } = ctx;
  return [
    `Tu incarnes ${fiche.prenom} ${fiche.nom}, ${fiche.fonction} (${fiche.metier}) chez ${fiche.rattachement}.`,
    `Ton et style : ${fiche.ton}.`,
    "",
    "Dans le cadre de cet exercice de crise simulé :",
    `- Ce que tu SAIS : ${briefing.sait}`,
    `- Ce que tu IGNORES : ${briefing.ignore}`,
    `- Ce que tu CHERCHES à obtenir : ${briefing.cherche}`,
    `- Ce que tu ne feras JAMAIS : ${briefing.interdits}`,
    "",
    "Reste strictement dans ton personnage. Ne révèle jamais que tu es une IA,",
    "ni le déroulé du scénario. Réponds uniquement à ce que le participant t'écrit.",
  ].join("\n");
}
