// @ts-ignore Deno resolves relative TypeScript imports.
import {
  createServiceClient,
  corsHeaders,
  jsonResponse,
  readJsonBody,
  requireAdmin
} from "../_shared/http.ts";

declare const Deno: {
  serve: (handler: (request: Request) => Promise<Response> | Response) => void;
};

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PAGE = 10_000;

type ListedAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const client = createServiceClient();
    const authorization = await requireAdmin(request, client);
    if (authorization.error) return authorization.error;

    const body = await readJsonBody(request);
    if (!body) return jsonResponse({ error: "Invalid request body." }, 400);

    const action = body.action;
    if (action === "list") {
      const page = Number(body.page ?? 1);
      const perPage = Number(body.perPage ?? 50);
      if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE ||
          !Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
        return jsonResponse({ error: "Invalid pagination values." }, 400);
      }

      const { data, error } = await client.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const usersPage = data.users as ListedAuthUser[];
      const userIds = usersPage.map((user) => user.id);
      const profileResult = userIds.length
        ? await client.from("profiles").select("id,display_name,class_name").in("id", userIds)
        : { data: [], error: null };
      if (profileResult.error) throw profileResult.error;
      const profiles = new Map<string, { display_name: string | null; class_name: string | null }>();
      for (const profile of profileResult.data || []) profiles.set(profile.id, profile);
      const users = usersPage.map((user) => {
        const profile = profiles.get(user.id);
        return {
          id: user.id,
          email: user.email || "",
          display_name: String(profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.display_name || ""),
          class_name: profile?.class_name || null,
          email_confirmed_at: user.email_confirmed_at || null,
          last_sign_in_at: user.last_sign_in_at || null,
          banned_until: user.banned_until || null
        };
      });
      return jsonResponse({ users });
    }

    if (action === "invite") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
      if (!EMAIL_PATTERN.test(email) || email.length > 254 || displayName.length > 80) {
        return jsonResponse({ error: "Enter a valid email address and a display name of 80 characters or fewer." }, 400);
      }

      const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
        data: {
          ...(displayName ? { full_name: displayName } : {}),
          requires_password_setup: true
        }
      });
      if (error) throw error;
      return jsonResponse({ userId: data.user?.id || null });
    }

    if (action !== "ban" && action !== "unban" && action !== "delete") {
      return jsonResponse({ error: "Unsupported user-management action." }, 400);
    }

    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!USER_ID_PATTERN.test(userId)) {
      return jsonResponse({ error: "A valid user ID is required." }, 400);
    }

    const [adminResult, profileResult] = await Promise.all([
      client.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle(),
      client.from("profiles").select("role").eq("id", userId).maybeSingle()
    ]);
    if (adminResult.error) throw adminResult.error;
    if (profileResult.error) throw profileResult.error;
    if (adminResult.data || profileResult.data?.role === "admin") {
      return jsonResponse({ error: "Administrator accounts are protected from these actions." }, 403);
    }
    if (!profileResult.data) {
      return jsonResponse({ error: "User account was not found." }, 404);
    }

    if (action === "ban") {
      const { error } = await client.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
      if (error) throw error;
      return jsonResponse({ success: true });
    }
    if (action === "unban") {
      const { error } = await client.auth.admin.updateUserById(userId, { ban_duration: "none" });
      if (error) throw error;
      return jsonResponse({ success: true });
    }

    const { error } = await client.auth.admin.deleteUser(userId);
    if (error) throw error;
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Admin user-management request failed.", error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "The request could not be completed."
    }, 500);
  }
});
