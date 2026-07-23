# Simulateur de crise — Contexte projet

Plateforme de simulation d'exercices de crise (inspirée de Conducttr). Base d'exigences : `docs/prd/`. Auteur : Thomas Scorticati (Scort Conseil).

## Vocabulaire (STRICT — ne jamais dévier)

- **instance** = une session d'exercice de crise, JAMAIS un serveur/conteneur/déploiement
- **scénario** = le plan réutilisable ; **instance** = son exécution réelle
- **fiche personnage** = permanente ; **briefing** = spécifique à un scénario
- **portée de réutilisation** = plateforme | compte racine | organisation (le clonage ne descend que vers le bas)
- **compte racine** = cabinet **OU** organisation autonome ; seule frontière d'isolation, matérialisée par l'étiquette `compte_racine_id` sur **chaque ligne**. Ne jamais écrire « cabinet » pour dire « compte racine » (en autonome, pas de cabinet). [AD-001/001b]
- **snapshot** = la **version figée** prise au lancement : **une seule par instance**, immuable, de forme **hybride** (injects figés en lignes + archive JSON pour le reste). [AD-003/016]
- **étape** = **nœud du graphe** du scénario, relié au suivant ; les injects s'y rattachent. Un seul lien sortant en v1. L'**étape courante appartient à l'instance**, jamais à l'équipe. [AD-004/005]
- **MEL** = file d'attente des injects à venir, ordonnée sur l'**horloge fictive** (jamais le temps réel). [AD-013]
- ⚠️ **adresse email réelle** (coordonnée hors fiction, sert à délivrer le lien d'accès, purgée à la fin) ≠ **canal « mail » simulé** (onglet de jeu, courriels fictifs). Ne jamais confondre. [AD-010]
- **bruit de fond** = Pattern of Life, à **deux portées** : plateforme (éditeur) ou compte racine (privé). Créable par responsable d'organisation et au-dessus, et par les facilitateurs à la portée dérivée de leur contexte d'accès ; jamais par un participant. [AD-017]
- [→ glossaire complet : `docs/prd/10-glossaire.md`]

## Hiérarchie de référence

`cabinet → organisation → filiale → mission → instance → équipes → participants`

- Le **cabinet** est la marque du modèle *piloté* (absent du modèle *autonome*), pas une couche facultative.
- La **filiale** est la seule couche facultative. Une organisation cliente ≠ une filiale.
- Le **compte racine** (cabinet ou organisation autonome) est la seule frontière d'isolation.
- Le PRD (`docs/prd/`) fait foi, **amendé par `docs/decisions/architecture-decisions.md`** (AD-XXX) : en cas de contradiction, la décision AD la plus récente l'emporte. `docs/archive/` = historique, ne jamais s'y référer.

## Stack & conventions

- **Next.js 16 (App Router) + TypeScript + Tailwind 4 + Supabase** (RLS, Realtime, Edge Functions)
- ⚠️ Next.js 16 a des changements cassants vs. versions antérieures — voir `@AGENTS.md` et lire `node_modules/next/dist/docs/` avant d'écrire du code.
- Tout événement **survenu dans un exercice** passe par la table `events` (typé, horodaté, attribué ; retient temps réel ET fictif). Les actions **d'administration** vont dans un journal **séparé et append-only**, jamais dans `events`. [AD-002]
- Livraison des injects = **boîte de réception persistante par destinataire** ; le Realtime n'est qu'une notification posée au-dessus, jamais le support de livraison
- L'**instance fige** son contenu (scénario, séquence, injects, fiches, briefings) à son lancement
- Toute nouvelle table DOIT avoir ses policies **RLS** avant tout code applicatif
- Isolation imposée **côté serveur** (RLS), jamais par l'affichage

## Règles de travail

- Ne jamais modifier les policies RLS ou les migrations sans les expliquer d'abord
- Périmètre = `docs/prd/04-perimetre-v1.md` **+ `docs/mvp-scope.md`** (élargissements assumés) ; toute fonctionnalité hors de ces deux documents → refuser et le signaler
- En cas d'ambiguïté sur le métier : poser la question, ne pas inventer

@AGENTS.md
