# Simulateur de crise — Contexte projet

Plateforme de simulation d'exercices de crise (inspirée de Conducttr). Base d'exigences : `docs/prd/`. Auteur : Thomas Scorticati (Scort Conseil).

## Vocabulaire (STRICT — ne jamais dévier)

- **instance** = une session d'exercice de crise, JAMAIS un serveur/conteneur/déploiement
- **scénario** = le plan réutilisable ; **instance** = son exécution réelle
- **fiche personnage** = permanente ; **briefing** = spécifique à un scénario
- **portée de réutilisation** = plateforme | compte racine | organisation (le clonage ne descend que vers le bas)
- [→ glossaire complet : `docs/prd/10-glossaire.md`]

## Hiérarchie de référence

`cabinet → organisation → filiale → mission → instance → équipes → participants`

- Le **cabinet** est la marque du modèle *piloté* (absent du modèle *autonome*), pas une couche facultative.
- La **filiale** est la seule couche facultative. Une organisation cliente ≠ une filiale.
- Le **compte racine** (cabinet ou organisation autonome) est la seule frontière d'isolation.
- Le PRD (`docs/prd/`) fait foi. `docs/archive/` = historique, ne jamais s'y référer.

## Stack & conventions

- **Next.js 16 (App Router) + TypeScript + Tailwind 4 + Supabase** (RLS, Realtime, Edge Functions)
- ⚠️ Next.js 16 a des changements cassants vs. versions antérieures — voir `@AGENTS.md` et lire `node_modules/next/dist/docs/` avant d'écrire du code.
- Tout événement métier passe par la table `events` (typé, horodaté, attribué ; retient temps réel ET fictif)
- Livraison des injects = **boîte de réception persistante par destinataire** ; le Realtime n'est qu'une notification posée au-dessus, jamais le support de livraison
- L'**instance fige** son contenu (scénario, séquence, injects, fiches, briefings) à son lancement
- Toute nouvelle table DOIT avoir ses policies **RLS** avant tout code applicatif
- Isolation imposée **côté serveur** (RLS), jamais par l'affichage

## Règles de travail

- Ne jamais modifier les policies RLS ou les migrations sans les expliquer d'abord
- Périmètre = `docs/prd/04-perimetre-v1.md` ; toute fonctionnalité hors MVP → refuser et le signaler
- En cas d'ambiguïté sur le métier : poser la question, ne pas inventer

@AGENTS.md
