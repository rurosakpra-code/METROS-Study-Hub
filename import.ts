// @ts-ignore Deno resolves URL imports, but the local TypeScript server does not.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AnswerSummaryItem = {
  question: string;
  answer: string;
  points_awarded: number | null;
  points_possible: number | null;
  correct_answers: string[];
  feedback: string;
};

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
    const rawAnswerSummary = body.answer_summary === undefined ? [] : body.answer_summary;
    const allowed = ["Biochemistry","Histology","Physiology","Embryology","Gross Anatomy"];
    if (!email || !allowed.includes(course) || !title || !externalId ||
        !Number.isFinite(score) || !Number.isFinite(total) || total <= 0 || score < 0 || score > total ||
        !Array.isArray(rawAnswerSummary) || rawAnswerSummary.length > 100) {
      return Response.json({ error: "Invalid score payload" }, { status: 400 });
    }
    const answerSummary: AnswerSummaryItem[] = [];
    for (const item of rawAnswerSummary) {
      if (!item || typeof item !== "object" || Array.isArray(item) ||
          typeof item.question !== "string" || typeof item.answer !== "string" ||
          typeof item.feedback !== "string" ||
          (item.correct_answers !== undefined &&
            (!Array.isArray(item.correct_answers) || item.correct_answers.length > 20 ||
              !item.correct_answers.every((answer: unknown) => typeof answer === "string"))) ||
          (item.points_awarded !== null && (typeof item.points_awarded !== "number" || !Number.isFinite(item.points_awarded))) ||
          (item.points_possible !== null && (typeof item.points_possible !== "number" || !Number.isFinite(item.points_possible)))) {
        return Response.json({ error: "Invalid answer summary" }, { status: 400 });
      }
      answerSummary.push({
        question: item.question.slice(0, 500),
        answer: item.answer.slice(0, 2000),
        points_awarded: item.points_awarded,
        points_possible: item.points_possible,
        correct_answers: (item.correct_answers || []).map((answer: string) => answer.slice(0, 1000)),
        feedback: item.feedback.slice(0, 2000)
      });
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
    const { data, error } = await admin.rpc("import_google_form_quiz_attempt", {
      p_user_id: userId,
      p_course: course,
      p_quiz_title: title,
      p_score: score,
      p_total_marks: total,
      p_external_source_id: externalId,
      p_answer_summary: answerSummary
    });
    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: 500 });
  }
});
