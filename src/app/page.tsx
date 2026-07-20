import Link from "next/link";

/**
 * Page d'accueil publique. L'accès à la plateforme se fait sur devis (PRD 8.1) :
 * pas d'inscription libre-service.
 */
export default function Accueil() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        Scort Conseil
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Plateforme de simulation d&apos;exercices de crise
      </h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        Entraînez vos équipes à la gestion de crise à travers des scénarios
        interactifs multicanaux. Moteur générique, contenu variable.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/tableau-de-bord"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          Accès plateforme
        </Link>
        <a
          href="mailto:contact@scortconseil.com"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Demander un devis
        </a>
      </div>
      <p className="mt-8 text-xs text-neutral-400">
        L&apos;accès est ouvert uniquement après contact et devis.
      </p>
    </main>
  );
}
