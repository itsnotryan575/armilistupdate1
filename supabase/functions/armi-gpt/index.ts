// supabase/functions/armi-gpt/index.ts
// Run locally: supabase functions serve --env-file supabase/.env

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type ArmiIntent =
  | { intent: "add_profile"; args: { name: string; phone?: string; tags?: string[]; notes?: string; relationshipType?: string } }
  | { intent: "edit_profile"; args: { profileId?: string; profileName?: string; updates: Record<string, string> } }
  | { intent: "schedule_text"; args: { profileName?: string; profileId?: string; when: string; message: string } }
  | { intent: "schedule_reminder"; args: { profileName?: string; profileId?: string; when: string; reason?: string } }
  | { intent: "none"; args: { explanation: string } };

// --- CORS helpers ---
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// --- System prompt (short, strict rules) ---
const SYSTEM_PROMPT = `
You are ARMi's Intent Parser. Output STRICT JSON only (no prose).
Return exactly one object: { "intent": string, "args": object }.

ALLOWED INTENTS & REQUIRED FIELDS
- "add_profile": args { name } + optional { phone, tags[], notes, relationshipType, listType }
- "edit_profile": args { updates } AND one of { profileId, profileName }
- "set_profile_list": args { listType } AND one of { profileId, profileName }
- "schedule_text": args { when, message } AND one of { profileId, profileName }
- "schedule_reminder": args { when } AND one of { profileId, profileName }
- "none": args { explanation }

LISTS
- listType ∈ {"Roster","Network","People"}.
- Infer listType when obvious:
    "family","spouse","kids","close friend" → "Roster"
    "coworker","boss","investor","client","mentor" → "Network"
    "acquaintance","party friend","club","meetup","influencer" → "People"
- If unclear, omit listType (client UI will ask). Do NOT guess randomly.

TIME
- All times MUST be ISO-8601 (e.g., "2025-01-22T15:30:00Z").
- Use context.now + context.timezone (IANA) to resolve relative times.
- If time or required fields are unclear, return intent "none" with a short "explanation".

SANITY
- Do not invent phone numbers or IDs.
- Normalize tags to lowercase; include only relevant fields.

EXAMPLES
User: {"message":"Add Kayleigh, 555-2012, friend from work","context":{}}
Return: {"intent":"add_profile","args":{"name":"Kayleigh","phone":"555-2012","tags":["friend"],"relationshipType":"friend","listType":"Network"}}

User: {"message":"remind me next friday at 3 to check in w/ Kay","context":{"now":"2025-01-22T18:00:00Z","timezone":"America/Chicago"}}
Return: {"intent":"schedule_reminder","args":{"profileName":"Kay","when":"2025-09-26T20:00:00Z","reason":"check in"}}

User: {"message":"text Lisa friday 8am: Good luck today!","context":{"now":"2025-01-22T18:00:00Z","timezone":"America/Chicago","knownProfiles":[{"id":"p1","name":"Lisa Nguyen"}]}}
Return: {"intent":"schedule_text","args":{"profileName":"Lisa","when":"2025-09-26T13:00:00Z","message":"Good luck today!"}}

User: {"message":"change Michael's number to 303-555-7788","context":{}}
Return: {"intent":"edit_profile","args":{"profileName":"Michael","updates":{"phone":"303-555-7788"}}}

User: {"message":"Move Lisa to my People list","context":{}}
Return: {"intent":"set_profile_list","args":{"profileName":"Lisa","listType":"People"}}

User: {"message":"Create a contact for my cousin Michael—he moved to Denver","context":{}}
Return: {"intent":"add_profile","args":{"name":"Michael","relationshipType":"family","notes":"moved to Denver","listType":"Roster"}}

User: {"message":"Add James (unknown)","context":{}}
Return: {"intent":"add_profile","args":{"name":"James"}}

User: {"message":"schedule a text: yo","context":{}}
Return: {"intent":"none","args":{"explanation":"Missing when and target (profileId or profileName) for schedule_text"}}
`;

// --- Server-side validator to enforce per-intent requirements ---
function validateIntent(parsed: any): { ok: boolean; err?: string } {
  if (!parsed || typeof parsed !== "object") return { ok: false, err: "Invalid JSON" };
  const { intent, args } = parsed;
  if (!intent || typeof intent !== "string" || !args || typeof args !== "object") {
    return { ok: false, err: "Missing intent/args" };
  }
  switch (intent) {
    case "add_profile":
      if (!args.name) return { ok: false, err: "add_profile requires name" };
      if (args.listType && !["Roster","Network","People"].includes(args.listType)) return { ok: false, err: "invalid listType" };
      break;
    case "edit_profile":
      if (!args.updates) return { ok: false, err: "edit_profile requires updates" };
      if (!args.profileId && !args.profileName) return { ok: false, err: "edit_profile requires profileId or profileName" };
      break;
    case "set_profile_list":
      if (!args.profileId && !args.profileName) return { ok: false, err: "set_profile_list requires profileId or profileName" };
      if (!args.listType || !["Roster","Network","People"].includes(args.listType)) return { ok: false, err: "invalid listType" };
      break;
    case "schedule_text":
      if (!args.when || !args.message) return { ok: false, err: "schedule_text requires when & message" };
      if (!args.profileId && !args.profileName) return { ok: false, err: "schedule_text requires profileId or profileName" };
      break;
    case "schedule_reminder":
      if (!args.when) return { ok: false, err: "schedule_reminder requires when" };
      if (!args.profileId && !args.profileName) return { ok: false, err: "schedule_reminder requires profileId or profileName" };
      break;
    case "none":
      if (!args.explanation) return { ok: false, err: "none requires explanation" };
      break;
    default:
      return { ok: false, err: "Unknown intent" };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const { message, context = {}, tier = "default" } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "Missing 'message' string" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: "OPENAI_API_KEY not set" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Keep your current models; switch to gpt-5/gpt-5-mini later if you prefer.
    const model = tier === "lite" ? "gpt-4o-mini" : "gpt-4o";

    const body = {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({ message, context }) },
      ],
      // Strict JSON output without schemas (no more oneOf errors)
      response_format: { type: "json_object" },
      temperature: 0.2,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ ok: false, error: `OpenAI error: ${t}` }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const json = await r.json();

// Dev-only logging
const isDev = Deno.env.get("DENO_DEPLOYMENT_ID") === undefined;
if (isDev) {
  console.log("Raw OpenAI response:", JSON.stringify(json, null, 2));
}

// Safer parsing — json_object should give pure JSON, but guard anyway
const content = json?.choices?.[0]?.message?.content ?? "";
if (isDev) console.log("LLM content:", content);

let parsed: ArmiIntent | null = null;
try {
  parsed = JSON.parse(content);
} catch {
  return new Response(
    JSON.stringify({ ok: true, result: { intent: "none", args: { explanation: "Model did not return valid JSON" } } }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
}

    // Validate and, if incomplete, downgrade to intent "none" with explanation (friendly for client)
    const v = validateIntent(parsed as any);
    if (!v.ok) {
      return new Response(
        JSON.stringify({ ok: true, result: { intent: "none", args: { explanation: v.err } } }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: true, result: parsed }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});