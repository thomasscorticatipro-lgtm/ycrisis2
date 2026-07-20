/**
 * Client Supabase côté serveur (Server Components, Route Handlers, Server Actions).
 *
 * Gère les cookies de session. La barrière d'isolation entre comptes racine est
 * imposée par les policies RLS (PRD 7.6-7.8) : ce client ne fait que présenter
 * la session ; le refus vient du serveur Postgres, identiquement à un appel API direct.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component : ignoré, le middleware rafraîchit la session.
          }
        },
      },
    },
  );
}
