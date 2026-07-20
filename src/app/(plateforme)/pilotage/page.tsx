import { EnTetePage } from "@/components/EnTetePage";

/**
 * 5.2 Pilotage en direct : tableau de bord par exception, boîte de réception
 * du facilitateur, deux horloges (réelle/fictive), MEL, arrêt d'urgence (5.9).
 */
export default function Pilotage() {
  return (
    <>
      <EnTetePage
        titre="Pilotage en direct"
        description="Supervision par exception des équipes en décrochage, déclenchement des injects (MEL), boîte de réception facilitateur, horloges réelle et fictive. La concurrence entre facilitateurs est idempotente à l'échelle de l'instance."
        refPrd="5.2"
      />
      <p className="text-sm text-neutral-500">
        À implémenter : MEL temps réel, seuils de décrochage, arrêt d&apos;urgence (double confirmation).
      </p>
    </>
  );
}
