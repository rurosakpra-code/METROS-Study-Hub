// @ts-ignore: Deno resolves this remote Supabase ESM module at runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) {
    return Response.json({ error: "The Supabase function environment is not configured." }, { status: 500, headers: cors });
  }

  const authorization = req.headers.get("Authorization") || "";
  const isServiceCall = authorization === `Bearer ${service}`;
  if (!isServiceCall) {
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) return Response.json({ error: "Please sign in again." }, { status: 401, headers: cors });
  }

  const adminClient = createClient(url, service);
  let removed = 0;
  for (;;) {
    const { data: expired, error: selectError } = await adminClient
      .from("group_chat_messages")
      .select("id,audio_path")
      .not("audio_path", "is", null)
      .lte("expires_at", new Date().toISOString())
      .limit(100);
    if (selectError) {
      return Response.json({ error: `Could not find expired voice notes: ${selectError.message}` }, { status: 500, headers: cors });
    }
    if (!expired?.length) break;

    const paths = [...new Set(expired.map((row) => row.audio_path).filter((path): path is string => typeof path === "string"))];
    if (paths.length) {
      const { error: storageError } = await adminClient.storage.from("group-chat-audio").remove(paths);
      if (storageError) {
        return Response.json({ error: `Could not remove expired voice-note files: ${storageError.message}` }, { status: 500, headers: cors });
      }
    }
    const ids = expired.map((row) => row.id);
    const { error: deleteError } = await adminClient.from("group_chat_messages").delete().in("id", ids);
    if (deleteError) {
      return Response.json({ error: `Voice-note files were removed, but their expired messages could not be deleted: ${deleteError.message}` }, { status: 500, headers: cors });
    }
    removed += expired.length;
  }

  return Response.json({ ok: true, expiredVoiceNotesRemoved: removed }, { headers: cors });
});
