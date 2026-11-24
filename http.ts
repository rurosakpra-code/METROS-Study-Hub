// @ts-ignore Deno resolves URL imports, but the local TypeScript server does not.
import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: {
    get: (name: string) => string | undefined;
  };
};

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Supabase server configuration is missing.");

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export type AuthorizationResult =
  | { user: User; error?: never }
  | { user: null; error: Response };

export async function requireSignedInUser(
  request: Request,
  client: SupabaseClient
): Promise<AuthorizationResult> {
  const authorization = request.headers.get("authorization") || "";
  const token = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
  if (!token) {
    return { user: null, error: jsonResponse({ error: "Authentication required." }, 401) };
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: jsonResponse({ error: "Invalid or expired session." }, 401) };
  }
  return { user: data.user };
}

export async function requireAdmin(
  request: Request,
  client: SupabaseClient
): Promise<AuthorizationResult> {
  const authorization = await requireSignedInUser(request, client);
  if (authorization.error) return authorization;

  const { data, error } = await client
    .from("admin_users")
    .select("user_id")
    .eq("user_id", authorization.user.id)
    .maybeSingle();
  if (error) {
    return {
      user: null,
      error: jsonResponse({ error: "Could not verify administrator access." }, 500)
    };
  }
  if (!data) {
    return { user: null, error: jsonResponse({ error: "Administrator access required." }, 403) };
  }
  return authorization;
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 20_000) return null;

  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}
