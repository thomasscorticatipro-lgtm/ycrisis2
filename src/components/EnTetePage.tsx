/** En-tête de page réutilisable pour les espaces plateforme. */
export function EnTetePage({
  titre,
  description,
  refPrd,
}: {
  titre: string;
  description: string;
  refPrd?: string;
}) {
  return (
    <header className="mb-8 border-b border-neutral-200 pb-4 dark:border-neutral-800">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{titre}</h1>
        {refPrd && (
          <span className="shrink-0 text-xs text-neutral-400">PRD {refPrd}</span>
        )}
      </div>
      <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">
        {description}
      </p>
    </header>
  );
}
