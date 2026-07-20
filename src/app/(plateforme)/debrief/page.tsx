import { EnTetePage } from "@/components/EnTetePage";

/**
 * 5.7 Débrief et export : vues agrégées par décision, par équipe et par rôle ;
 * délais de réaction ; export d'un livrable autoportant et figé (seul artefact
 * survivant à la purge des données d'instance — PRD 7.9).
 */
export default function Debrief() {
  return (
    <>
      <EnTetePage
        titre="Débrief"
        description="After-Action Review : décisions et interactions horodatées (temps réel + fictif), agrégées par décision, équipe et rôle. Export d'un livrable autoportant, preuve de participation (DORA)."
        refPrd="5.7"
      />
      <p className="text-sm text-neutral-500">
        À implémenter : vues agrégées, délais de réaction, export documentaire + tabulaire.
      </p>
    </>
  );
}
