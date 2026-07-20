import { EnTetePage } from "@/components/EnTetePage";

/**
 * 5.8 Administration des comptes et attribution des profils.
 * L'affichage diffère selon la nature du compte (cabinet / organisation autonome),
 * mais ce n'est qu'un confort : la sécurité est côté serveur (RLS).
 * Attribution par invitation nominative en cascade (5.8.6-9).
 */
export default function Comptes() {
  return (
    <>
      <EnTetePage
        titre="Comptes & profils"
        description="Attribution des profils par invitation nominative en cascade : un profil n'invite que vers un niveau égal ou inférieur, dans son propre périmètre. Lien à usage unique, borné à une semaine, renvoyable, journalisé."
        refPrd="5.8"
      />
      <p className="text-sm text-neutral-500">
        À implémenter : écran d&apos;invitation (email, profil, périmètre), suivi des invitations, journal.
      </p>
    </>
  );
}
