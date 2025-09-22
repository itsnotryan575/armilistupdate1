// supabase/functions/armi-gpt/index.ts
// Run locally: supabase functions serve --env-file supabase/.env

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type ArmiIntent =
  | { intent: "add_profile"; args: { name: string; phone?: string; tags?: string[]; notes?: string; relationshipType?: string } }
  | { intent: "edit_profile"; args: { profileId?: string; profileName?: string; updates: Record<string, string> } }
  | { intent: "schedule_text"; args: { profileName?: string; profileId?: string; when: string; message: string } }
  | { intent: "schedule_reminder"; args: { profileName?: string; profileId?: string; when: string; reason?: string } }
  | { intent: "none"; args: { explanation: string } };

const SYSTEM_PROMPT = `
You are ARMi's Intent Parser.
- Output strictly in JSON matching the provided schema.
- Never include prose.
- REQUIRE ISO-8601 times (e.g., 2025-01-22T15:30:00Z). If time is unclear or cannot be confidently parsed, return intent "none" with an explanation asking for clarification.
- Do not invent phone numbers or IDs.
- Do not auto-create reminders unless the user asked to remind or implies a reminder clearly (e.g., "remind me", "follow up", "check in").
- Respect user language but normalize fields (name, tags, relationshipType).
- If you cannot confidently fill required fields, return intent "none" with a short explanation asking the client to confirm/clarify.
`;

const schema = {
  name: "ArmiIntent",
  schema: {
    type: "object",
    oneOf: [
      {
        type: "object",
        properties: {
          intent: { const: "add_profile" },
          args: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              phone: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              notes: { type: "string" },
              relationshipType: { type: "string" }
            }
          }
        },
        required: ["intent", "args"],
        additionalProperties: false
      },
      {
        type: "object",
        properties: {
          intent: { const: "edit_profile" },
          args: {
            type: "object",
            required: ["updates"],
            properties: {
              profileId: { type: "string" },
              profileName: { type: "string" },
              updates: { type: "object", additionalProperties: { type: "string" } }
            }
          }
        },
        required: ["intent", "args"],
        additionalProperties: false
      },
      {
        type: "object",
        properties: {
          intent: { const: "schedule_text" },
          args: {
            type: "object",
            required: ["when", "message"],
            properties: {
              profileName: { type: "string" },
              profileId: { type: "string" },
              when: { type: "string" },
              message: { type: "string" }
            }
          }
        },
        required: ["intent", "args"],
        additionalProperties: false
      },
      {
        type: "object",
        properties: {
          intent: { const: "schedule_reminder" },
          args: {
            type: "object",
            required: ["when"],
            properties: {
              profileName: { type: "string" },
              profileId: { type: "string" },
              when: { type: "string" },
              reason: { type: "string" }
            }
          }
        },
        required: ["intent", "args"],
        additionalProperties: false
      },
      {
        type: "object",
        properties: {
          intent: { const: "none" },
          args: {
            type: "object",
            required: ["explanation"],
            properties: { explanation: { type: "string" } }
          }
        },
        required: ["intent", "args"],
        additionalProperties: false
      }
    ]
  }
} as const;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const { message, context = {}, tier = "default" } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "Missing 'message' string" }), { status: 400 });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ ok: false, error: "OPENAI_API_KEY not set" }), { status: 500 });

    const model = tier === "lite" ? "gpt-4o-mini" : "gpt-4o";

    const body = {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({ message, context }) }
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: schema.name, schema: schema.schema, strict: true }
      },
      temperature: 0.2
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ ok: false, error: `OpenAI error: ${t}` }), { status: 500 });
    }

    const json = await r.json();
    
    // Log raw model output in development only
    const isDev = Deno.env.get("DENO_DEPLOYMENT_ID") === undefined;
    if (isDev) {
      console.log("Raw OpenAI response:", JSON.stringify(json, null, 2));
    }
    
    // Parse the response from chat completions API
    const parsed: ArmiIntent = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");

    // Basic shape check:
    if (!parsed || typeof parsed.intent !== "string" || !parsed.args) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid model output" }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, result: parsed }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), { status: 500 });
  }
});