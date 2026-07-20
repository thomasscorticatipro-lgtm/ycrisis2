import { BandeauExercice } from "@/components/BandeauExercice";
import { CANAUX_SOCLE, LIBELLE_CANAL } from "@/lib/domain/constants";

/**
 * 5.4 Expérience du participant. Accès par LIEN personnel unique (PRD 5.6.4) :
 * ni compte, ni mot de passe. L'identité est éphémère et rattachée à une seule instance.
 *
 * Le bandeau d'exercice est PERMANENT (PRD 5.9.3), sur desktop comme mobile.
 *
 * Next 16 : `params` est asynchrone dans les pages.
 */
export default async function Participer({
  params,
}: {
  params: Promise<{ lien: string }>;
}) {
  const { lien } = await params;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <BandeauExercice />
      <div className="mx-auto w-full max-w-4xl flex-1 p-6">
        <p className="mb-4 text-xs text-neutral-400">
          Session participant · lien {lien.slice(0, 8)}…
        </p>
        <h1 className="mb-6 text-xl font-semibold">Vos canaux</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CANAUX_SOCLE.map((canal) => (
            <div
              key={canal}
              className="rounded-lg border border-neutral-200 p-4 text-center text-sm dark:border-neutral-800"
            >
              {LIBELLE_CANAL[canal]}
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          À implémenter : boîte de réception persistante par destinataire, rattrapage
          des injects manqués, compteurs par canal, horloge fictive.
        </p>
      </div>
    </div>
  );
}
