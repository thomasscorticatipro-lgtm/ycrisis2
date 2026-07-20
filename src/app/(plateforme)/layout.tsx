import Link from "next/link";

/**
 * Layout des espaces réservés aux UTILISATEURS de la plateforme (authentifiés).
 * Distinct de l'expérience participant (/participer), qui n'a ni compte ni cette navigation.
 *
 * ⚠️ La navigation ci-dessous est un confort d'affichage. Ce qu'un utilisateur
 * peut réellement voir/modifier est imposé côté serveur par les policies RLS
 * (PRD 5.8.4, 7.8). L'affichage n'est jamais la sécurité.
 */

const ESPACES = [
  { href: "/tableau-de-bord", libelle: "Tableau de bord" },
  { href: "/atelier", libelle: "Atelier de scénario" },
  { href: "/pilotage", libelle: "Pilotage en direct" },
  { href: "/debrief", libelle: "Débrief" },
  { href: "/comptes", libelle: "Comptes & profils" },
  { href: "/back-office", libelle: "Back-office" },
];

export default function LayoutPlateforme({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="w-60 shrink-0 border-r border-neutral-200 p-4 dark:border-neutral-800">
        <Link href="/" className="mb-6 block text-sm font-semibold">
          Simulateur de crise
        </Link>
        <nav className="flex flex-col gap-1">
          {ESPACES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="rounded px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {e.libelle}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
