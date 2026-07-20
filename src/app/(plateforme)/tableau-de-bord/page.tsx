import { EnTetePage } from "@/components/EnTetePage";

export default function TableauDeBord() {
  return (
    <>
      <EnTetePage
        titre="Tableau de bord"
        description="Vue d'ensemble des missions et instances de votre périmètre. Le contenu affiché dépend de votre profil et est filtré côté serveur (RLS)."
      />
      <p className="text-sm text-neutral-500">
        À implémenter : liste des missions, instances récentes, accès rapide au pilotage.
      </p>
    </>
  );
}
