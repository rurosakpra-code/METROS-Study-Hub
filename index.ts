// @ts-ignore Deno resolves this URL import at runtime; standard TypeScript does not.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const denoRuntime = (globalThis as typeof globalThis & {
  Deno: {
    env: { get(name: string): string | undefined };
    serve(handler: (req: Request) => Response | Promise<Response>): void;
  };
}).Deno;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const userIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type JsonObject = Record<string, unknown>;

type UserListAccount = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  banned_until?: string | null;
};

type ProfileRecord = {
  id: string;
  display_name?: string | null;
  full_name?: string | null;
  class_name?: string | null;
};

type AdminMembershipRecord = {
  user_id: string;
};

function jsonResponse(body: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function isRecord(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function positiveInteger(value: unknown, fallback: number, maximum: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  if (!Number.isSafeInteger(parsed)) return fallback;
  return Math.max(1, Math.min(maximum, parsed));
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function handleRequest({ req }: { req: Request; }): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authorization = req.headers.get("Authorization") || "";
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) return jsonResponse({ error: "Please sign in again." }, 401);

  const supabaseUrl = denoRuntime.env.get("SUPABASE_URL");
  const anonKey = denoRuntime.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = denoRuntime.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Admin user management is missing required Supabase environment variables.");
    return jsonResponse({ error: "Server configuration is incomplete." }, 500);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(tokenMatch[1]);
  if (authError || !authData.user) {
    return jsonResponse({ error: "Please sign in again." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: membership, error: membershipError } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("Could not verify administrator membership.", membershipError);
    return jsonResponse({ error: "Could not verify administrator access." }, 500);
  }
  if (!membership) return jsonResponse({ error: "Administrator access required." }, 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }
  if (!isRecord(body)) return jsonResponse({ error: "Invalid request body." }, 400);

  const action = getString(body.action);

  if (action === "list") {
    const page = positiveInteger(body.page, 1, 10000);
    const perPage = positiveInteger(body.perPage, 50, 100);
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("Could not list user accounts.", error);
      return jsonResponse({ error: "Could not load user accounts." }, 500);
    }

    const ids = data.users.map((account: { id: string }) => account.id);
    if (ids.length === 0) return jsonResponse({ users: [], page, perPage });

    const [profileResult, adminResult] = await Promise.all([
      adminClient.from("profiles")
        .select("id,display_name,full_name,class_name")
        .in("id", ids),
      adminClient.from("admin_users")
        .select("user_id")
        .in("user_id", ids)
    ]);

    if (profileResult.error || adminResult.error) {
      console.error("Could not load user profile or administrator details.", {
        profileError: profileResult.error,
        adminError: adminResult.error
      });
      return jsonResponse({ error: "Could not load user account details." }, 500);
    }

    const profileRows = (profileResult.data ?? []) as ProfileRecord[];
    const adminRows = (adminResult.data ?? []) as AdminMembershipRecord[];
    const profileById = new Map<string, ProfileRecord>(
      profileRows.map((profile) => [profile.id, profile] as const)
    );
    const adminIds = new Set(adminRows.map((row) => row.user_id));
    const users = data.users.map((account: UserListAccount) => {
      const profile = profileById.get(account.id);
      return {
        id: account.id,
        email: account.email || "",
        created_at: account.created_at,
        last_sign_in_at: account.last_sign_in_at,
        email_confirmed_at: account.email_confirmed_at,
        banned_until: account.banned_until,
        display_name: profile?.display_name || profile?.full_name || "",
        class_name: profile?.class_name || "",
        is_admin: adminIds.has(account.id)
      };
    });

    return jsonResponse({ users, page, perPage });
  }

  if (action === "invite") {
    const email = getString(body.email).toLowerCase();
    const displayName = getString(body.displayName);
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "Enter a valid email address." }, 400);
    }
    if (displayName.length > 80) {
      return jsonResponse({ error: "Display name must be 80 characters or fewer." }, 400);
    }

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: displayName || email.split("@")[0],
        requires_password_setup: true
      }
    });
    if (error) return jsonResponse({ error: error.message }, 400);

    return jsonResponse({ ok: true, user_id: data.user?.id || null, email });
  }

  if (action === "ban" || action === "unban" || action === "delete") {
    const targetId = getString(body.userId);
    if (!userIdPattern.test(targetId)) {
      return jsonResponse({ error: "Select a valid user." }, 400);
    }
    if (targetId === authData.user.id) {
      return jsonResponse({ error: "You cannot change or delete your own administrator account here." }, 400);
    }

    const { data: targetAdmin, error: targetAdminError } = await adminClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", targetId)
      .maybeSingle();
    if (targetAdminError) {
      console.error("Could not verify the target account's administrator status.", targetAdminError);
      return jsonResponse({ error: "Could not verify the selected account." }, 500);
    }
    if (targetAdmin) {
      return jsonResponse({ error: "Administrator accounts cannot be banned or deleted here." }, 400);
    }

    if (action === "delete") {
      const { error } = await adminClient.auth.admin.deleteUser(targetId);
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ ok: true });
    }

    const { data, error } = await adminClient.auth.admin.updateUserById(targetId, {
      ban_duration: action === "ban" ? "876000h" : "none"
    });
    if (error) return jsonResponse({ error: error.message }, 400);

    return jsonResponse({ ok: true, banned_until: data.user?.banned_until || null });
  }

  return jsonResponse({ error: "Unsupported user-management action." }, 400);
}

denoRuntime.serve(async (req: Request): Promise<Response> => {
  try {
    return await handleRequest({ req });
  } catch (error) {
    console.error("Admin user-management request failed unexpectedly.", error);
    return jsonResponse({ error: "The user-management request could not be completed." }, 500);
  }
});
