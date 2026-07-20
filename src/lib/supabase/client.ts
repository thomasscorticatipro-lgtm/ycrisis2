/**
 * Client Supabase côté navigateur (composants clients).
 *
 * ⚠️ Rappel d'architecture : la sécurité repose sur les policies RLS côté
 * serveur, jamais sur ce client. Ce client n'utilise que la clé anonyme
 * publique ; toute donnée qu'il peut lire est déjà filtrée par RLS.
 * Cible : Supabase AUTO-HÉBERGÉ (souveraineté) — voir CLAUDE.md / PRD 7.4.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
