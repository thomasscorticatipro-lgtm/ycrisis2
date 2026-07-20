import { EnTetePage } from "@/components/EnTetePage";

/**
 * 5.1 Atelier de création de scénario : éditeur d'inject, constructeur de
 * séquence, sélecteur de bruit de fond. Ouvert aux facilitateurs, aux profils
 * supérieurs de leur arbre (substitution), et à l'admin plateforme.
 */
export default function Atelier() {
  return (
    <>
      <EnTetePage
        titre="Atelier de scénario"
        description="Création et édition de scénarios : injects, séquence, bruit de fond. Chaque actif porte une portée de réutilisation (plateforme / compte racine / organisation) ; le clonage ne descend que vers le bas."
        refPrd="5.1"
      />
      <ul className="grid gap-3 sm:grid-cols-3">
        {[
          ["Éditeur d'inject", "Contenu, canal, source, cible de diffusion, déclencheur."],
          ["Constructeur de séquence", "Ordonner les injects ; marquer les futurs points de décision (v2)."],
          ["Sélecteur de bruit de fond", "Piocher dans la bibliothèque de portée plateforme et fixer la cible."],
        ].map(([t, d]) => (
          <li
            key={t}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <h2 className="text-sm font-medium">{t}</h2>
            <p className="mt-1 text-xs text-neutral-500">{d}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
