// @ts-ignore Deno resolves URL imports, but the local TypeScript server does not.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (name: string) => string | undefined;
  };
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const expected = Deno.env.get("MEDSTUDY_SHARED_SECRET");
  if (!expected || req.headers.get("x-medstudy-secret") !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const course = String(body.course || "");
    const title = String(body.quiz_title || "").trim();
    const score = Number(body.score), total = Number(body.total_marks);
    const externalId = String(body.external_source_id || "").trim();
    const allowed = ["Biochemistry","Histology","Physiology","Embryology","Gross Anatomy"];
    if (!email || !allowed.includes(course) || !title || !externalId ||
        !Number.isFinite(score) || !Number.isFinite(total) || total <= 0 || score < 0 || score > total) {
      return Response.json({ error: "Invalid score payload" }, { status: 400 });
    }
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);
    // Resolve the verified Google Forms respondent email to an existing MedStudy account.
    let userId: string | null = null;
    let page = 1;
    while (!userId && page <= 20) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      const match = data.users.find((u: { email?: string | null; id: string }) => (u.email || "").toLowerCase() === email);
      if (match) userId = match.id;
      if (data.users.length < 1000) break;
      page++;
    }
    if (!userId) return Response.json({ error: "No MedStudy account matches the respondent email" }, { status: 404 });
    const { error } = await admin.from("quiz_attempts").insert({
      user_id: userId, course, quiz_title: title, score, total_marks: total,
      is_verified: true, source: "google_forms", external_source_id: externalId
    });
    if (error) {
      if (error.code === "23505") return Response.json({ ok: true, duplicate: true });
      throw error;
    }
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: 500 });
  }
});
