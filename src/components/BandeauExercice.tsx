import { MENTION_EXERCICE } from "@/lib/domain/constants";

/**
 * Bandeau de sûreté permanent affiché au participant (PRD 5.9.3).
 * Toujours visible, indépendamment du canal et du contenu. Couvre notamment les
 * contenus sans texte de fin (appel, popup, vidéo, carte, tableau de bord).
 */
export function BandeauExercice() {
  return (
    <div
      role="alert"
      className="sticky top-0 z-50 bg-amber-500 py-1.5 text-center text-xs font-semibold uppercase tracking-widest text-black"
    >
      {MENTION_EXERCICE}
    </div>
  );
}
