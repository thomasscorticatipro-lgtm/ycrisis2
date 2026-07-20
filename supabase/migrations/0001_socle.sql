-- =============================================================================
-- Migration 0001 — Socle du modèle de données
-- Simulateur d'exercices de crise (PRD v0.3, ch. 6 et 7)
--
-- Principes appliqués :
--   * Frontière d'isolation = le COMPTE RACINE (cabinet ou organisation autonome).
--   * RLS activé sur CHAQUE table ; l'isolation est imposée côté serveur (PRD 7.8).
--   * Deux populations distinctes : utilisateurs plateforme (auth) vs participants
--     (identité éphémère, sans compte). Ce sont deux tables/cycles de vie séparés.
--   * Tout événement métier → table `events` (typé, horodaté, attribué).
--
-- ⚠️ Les policies ci-dessous sont un SQUELETTE volontairement restrictif
-- (deny-by-default). Les règles fines de portée imbriquée / substitution / cascade
-- (PRD ch. 3, 5.8) seront ajoutées via des fonctions SECURITY DEFINER dédiées.
-- Ne jamais relâcher une policy sans l'expliquer d'abord (cf. CLAUDE.md).
-- =============================================================================

create extension if not exists "pgcrypto";

-- --- Types énumérés (miroir de src/types/domain.ts) --------------------------
create type nature_compte as enum ('cabinet', 'organisation_autonome');
create type profil as enum (
  'admin_plateforme', 'responsable_cabinet', 'responsable_organisation',
  'responsable_filiale', 'facilitateur'
);
create type portee_reutilisation as enum ('plateforme', 'compte_racine', 'organisation');
create type statut_contenu as enum ('brouillon', 'valide', 'archive');
create type statut_instance as enum (
  'preparation', 'en_cours', 'pause', 'arret_urgence', 'close'
);
create type origine_participant as enum ('invite', 'auto_inscrit');
create type mode_horloge as enum ('automatique', 'manuel');
create type mode_livraison as enum ('passif', 'actif');

-- =============================================================================
-- 1. Hiérarchie des comptes (PRD 6)
-- =============================================================================

-- Compte racine = seule frontière d'isolation. Cabinet OU organisation autonome.
create table compte_racine (
  id          uuid primary key default gen_random_uuid(),
  nature      nature_compte not null,
  nom         text not null,
  cree_le     timestamptz not null default now()
);

-- Une organisation. En modèle autonome, elle EST le compte racine (cabinet_id null).
-- En modèle piloté, elle est cliente d'un cabinet.
create table organisation (
  id                uuid primary key default gen_random_uuid(),
  compte_racine_id  uuid not null references compte_racine(id) on delete cascade,
  -- Le cabinet est le compte racine parent en modèle piloté ; null en autonome.
  cabinet_id        uuid references compte_racine(id) on delete cascade,
  nom               text not null
);

-- Couche facultative. NE JAMAIS l'utiliser pour modéliser un portefeuille de clients.
create table filiale (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references organisation(id) on delete cascade,
  nom               text not null
);

-- Couche à part entière + unité de rattachement des droits et du contenu sur-mesure.
create table mission (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references organisation(id) on delete cascade,
  filiale_id        uuid references filiale(id) on delete set null,
  nom               text not null
);

-- =============================================================================
-- 2. Utilisateurs plateforme & attribution des profils (PRD 3, 5.8)
-- =============================================================================

-- Profil-utilisateur = relation plusieurs-à-plusieurs entre une personne (auth.users)
-- et un périmètre. Une personne peut tenir un profil sur plusieurs périmètres, et
-- un même périmètre peut être tenu par plusieurs personnes (PRD 3.2).
create table attribution_profil (
  id                uuid primary key default gen_random_uuid(),
  utilisateur_id    uuid not null references auth.users(id) on delete cascade,
  profil            profil not null,
  -- Portée : exactement une des cibles ci-dessous est renseignée (contrôlé applicativement).
  compte_racine_id  uuid references compte_racine(id) on delete cascade,
  organisation_id   uuid references organisation(id) on delete cascade,
  filiale_id        uuid references filiale(id) on delete cascade,
  mission_id        uuid references mission(id) on delete cascade,
  cree_le           timestamptz not null default now()
);

-- Invitation nominative en cascade (PRD 5.8.6-9). Lien à usage unique, borné, journalisé.
create table invitation (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  profil            profil not null,
  compte_racine_id  uuid references compte_racine(id) on delete cascade,
  organisation_id   uuid references organisation(id) on delete cascade,
  filiale_id        uuid references filiale(id) on delete cascade,
  mission_id        uuid references mission(id) on delete cascade,
  invite_par        uuid not null references auth.users(id) on delete cascade,
  jeton             text not null unique,
  expire_le         timestamptz not null,
  utilise_le        timestamptz,
  cree_le           timestamptz not null default now()
);

-- =============================================================================
-- 3. Contenu réutilisable & portée (PRD 5.1, 5.3, 5.5)
-- =============================================================================

-- Fiche personnage : permanente, réutilisable, porte une portée.
create table fiche_personnage (
  id                uuid primary key default gen_random_uuid(),
  portee            portee_reutilisation not null,
  compte_racine_id  uuid references compte_racine(id) on delete cascade, -- null si portée plateforme
  organisation_id   uuid references organisation(id) on delete cascade,  -- si portée organisation
  prenom            text not null,
  nom               text not null,
  metier            text,
  fonction          text,
  rattachement      text,
  expertise         text,
  ton               text,
  statut            statut_contenu not null default 'brouillon'
);

-- Scénario : plan réutilisable, modélisé en graphe (une seule suite par étape en v1).
create table scenario (
  id                        uuid primary key default gen_random_uuid(),
  portee                    portee_reutilisation not null,
  compte_racine_id          uuid references compte_racine(id) on delete cascade,
  organisation_id           uuid references organisation(id) on delete cascade,
  titre                     text not null,
  type                      text not null check (type in ('catalogue', 'sur_mesure')),
  statut                    statut_contenu not null default 'brouillon',
  canaux_optionnels_actifs  text[] not null default '{}',
  cree_le                   timestamptz not null default now()
);

-- Briefing : SANS portée propre, hérite du scénario. Couple (fiche, scénario).
create table briefing (
  id                    uuid primary key default gen_random_uuid(),
  fiche_personnage_id   uuid not null references fiche_personnage(id) on delete cascade,
  scenario_id           uuid not null references scenario(id) on delete cascade,
  sait                  text,
  ignore                text,
  cherche               text,
  interdits             text,
  unique (fiche_personnage_id, scenario_id)
);

-- Inject : source, canal, contenu, cible (équipes × rôles, abstraite), déclencheur, saut.
create table inject (
  id                uuid primary key default gen_random_uuid(),
  scenario_id       uuid not null references scenario(id) on delete cascade,
  source_fiche_id   uuid not null references fiche_personnage(id) on delete restrict,
  canal             text not null,
  mode_livraison    mode_livraison not null default 'passif',
  contenu           text not null,
  cible_equipes     text[],           -- null = instance entière
  cible_roles       text[],           -- null = tous les membres
  declencheur_type  text not null default 'temps_reel',
  offset_secondes   integer,
  saut_de_temps     text,
  ordre             integer not null default 0
);

-- Template de bruit de fond : porte une portée, pas de cible (fixée à l'association).
create table template_bruit_de_fond (
  id                uuid primary key default gen_random_uuid(),
  portee            portee_reutilisation not null default 'plateforme',
  canal             text not null,
  source_fiche_id   uuid not null references fiche_personnage(id) on delete restrict,
  contenu           text not null,
  statut            statut_contenu not null default 'brouillon'
);

-- =============================================================================
-- 4. Exécution : instance, équipes, participants (PRD 3.1, 6)
-- =============================================================================

create table instance (
  id                    uuid primary key default gen_random_uuid(),
  mission_id            uuid not null references mission(id) on delete cascade,
  scenario_id           uuid not null references scenario(id) on delete restrict,
  titre                 text not null,
  est_test              boolean not null default false,
  statut                statut_instance not null default 'preparation',
  mode_horloge          mode_horloge not null default 'automatique',
  date_fictive_courante text,
  lance_le              timestamptz,
  close_le              timestamptz,
  cree_le               timestamptz not null default now()
);

-- Version figée du contenu joué, prise au lancement (PRD 5.1.16). Immuable.
create table version_figee (
  id            uuid primary key default gen_random_uuid(),
  instance_id   uuid not null references instance(id) on delete cascade,
  contenu       jsonb not null, -- snapshot : scénario, séquence, injects, fiches, briefings
  fige_le       timestamptz not null default now()
);

create table equipe (
  id            uuid primary key default gen_random_uuid(),
  instance_id   uuid not null references instance(id) on delete cascade,
  nom           text not null
);

-- Participant : identité ÉPHÉMÈRE, sans compte. Porté par un lien personnel unique.
create table participant (
  id            uuid primary key default gen_random_uuid(),
  instance_id   uuid not null references instance(id) on delete cascade,
  equipe_id     uuid not null references equipe(id) on delete cascade,
  nom           text not null,
  email         text not null,
  role          text,
  origine       origine_participant not null default 'invite',
  present       boolean not null default false,
  jeton_lien    text not null unique,
  cree_le       timestamptz not null default now()
);

-- Boîte de réception PERSISTANTE par destinataire (PRD 5.4.15, 6).
-- Le Realtime n'est qu'une notification posée au-dessus, jamais le support de livraison.
create table reception (
  id                uuid primary key default gen_random_uuid(),
  instance_id       uuid not null references instance(id) on delete cascade,
  participant_id    uuid not null references participant(id) on delete cascade,
  canal             text not null,
  contenu           text not null,
  emis_le_reel      timestamptz not null default now(),
  emis_le_fictif    text,
  consulte_le       timestamptz  -- null tant que non consulté (compteurs par canal)
);

-- État d'avancement PAR équipe (pas une simple horloge globale) — PRD 6.
create table avancement_equipe (
  equipe_id       uuid primary key references equipe(id) on delete cascade,
  etape_courante  integer not null default 0,
  maj_le          timestamptz not null default now()
);

-- =============================================================================
-- 5. Événements — table `events` (PRD 5.7, 7.10). Base du débrief et de l'audit.
-- =============================================================================
create table events (
  id                uuid primary key default gen_random_uuid(),
  instance_id       uuid references instance(id) on delete cascade,
  type              text not null,
  equipe_id         uuid references equipe(id) on delete set null,
  role              text,
  auteur_id         uuid,             -- utilisateur plateforme OU participant, selon le type
  horodatage_reel   timestamptz not null default now(),
  horodatage_fictif text,
  charge            jsonb not null default '{}'
);

create index events_instance_idx on events (instance_id, horodatage_reel);
create index reception_participant_idx on reception (participant_id, consulte_le);

-- =============================================================================
-- 6. RLS — deny-by-default sur toutes les tables (PRD 7.6-7.8)
-- =============================================================================
-- Activer RLS SANS créer de policy permissive revient à tout refuser aux clients
-- (hors service_role, qui contourne RLS et n'est utilisé que côté serveur de confiance).
-- Les policies fines seront ajoutées dans les migrations suivantes, adossées à des
-- fonctions de portée. C'est la garantie que rien n'est lisible tant que la règle
-- d'isolation n'a pas été écrite et expliquée.

do $$
declare t text;
begin
  foreach t in array array[
    'compte_racine','organisation','filiale','mission','attribution_profil',
    'invitation','fiche_personnage','scenario','briefing','inject',
    'template_bruit_de_fond','instance','version_figee','equipe','participant',
    'reception','avancement_equipe','events'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('alter table %I force row level security;', t);
  end loop;
end $$;
