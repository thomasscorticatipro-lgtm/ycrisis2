import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/**
 * Proxy (ex-« middleware », renommé en Next 16). Rafraîchit la session Supabase
 * avant le rendu des routes — espaces plateforme comme expérience participant.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
