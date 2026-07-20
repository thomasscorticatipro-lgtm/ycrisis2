import { EnTetePage } from "@/components/EnTetePage";

/**
 * Back-office réservé à l'administrateur de la plateforme (PRD 8.1.3).
 * Création manuelle des comptes racine, renseignement de leur nature, publication
 * du contenu de portée plateforme, suspension d'accès, compteurs de facturation.
 * Accès nominatif, journalisé, encadré (PRD 8.2.6).
 */
export default function BackOffice() {
  return (
    <>
      <EnTetePage
        titre="Back-office"
        description="Espace administrateur de la plateforme : création des comptes racine (cabinet / organisation autonome), publication du catalogue de portée plateforme, suspension d'accès, tableau de facturation au volume."
        refPrd="8.1"
      />
      <p className="text-sm text-neutral-500">
        Accès restreint à l&apos;administrateur de la plateforme. Chaque accès à des données client est journalisé.
      </p>
    </>
  );
}
