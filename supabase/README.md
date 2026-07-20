# Base de données (Supabase auto-hébergé)

Supabase est retenu en **auto-hébergement** (souveraineté, PRD 7.4) : Postgres +
Auth + Realtime + Edge Functions. La couche Realtime sert uniquement de
**notification** posée au-dessus de la boîte de réception persistante (`reception`) ;
elle n'est jamais le support de livraison des injects (PRD 5.4.15).

## Migrations

- `migrations/0001_socle.sql` — hiérarchie des comptes, contenu réutilisable,
  exécution (instance/équipes/participants), table `events`, RLS deny-by-default.

## Règle d'or RLS

Toute nouvelle table est créée avec RLS activé **et forcé**, sans policy permissive
par défaut : rien n'est lisible tant que la règle d'isolation n'a pas été écrite
et **expliquée** (cf. CLAUDE.md). La frontière d'isolation est le **compte racine**
(cabinet ou organisation autonome) ; les organisations clientes d'un même cabinet
sont en outre cloisonnées entre elles (PRD 7.6-7.7).

## À faire (migrations suivantes)

- Fonctions de portée (`SECURITY DEFINER`) : périmètre visible par l'utilisateur courant.
- Policies fines : portée imbriquée + héritage, substitution d'un profil supérieur,
  visibilité du contenu de portée plateforme, accès participant borné à son instance.
- Contrainte « une seule cible de portée renseignée » sur `attribution_profil` / `invitation`.
- Régimes de rétention et purge (PRD 7.9).
