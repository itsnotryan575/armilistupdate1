// services/gptService.ts
import Constants from "expo-constants";
import { ArmiIntent } from "../types/armi-intents";

// Read config from Expo "extra" first (best for dev/prod), then fall back to env
const extra =
  (Constants as any)?.expoConfig?.extra ??
  (Constants as any)?.manifest?.extra ??
  {};

const SUPABASE_URL: string =
  extra.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_ANON_KEY: string =
  extra.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const GPT_FN_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/armi-gpt`
  : "";

// Debug so you can see exactly what the app is calling
console.log("GPT_FN_URL =", GPT_FN_URL);

// Always provide a baseline context so the model can resolve relative dates/times
function buildDefaultContext(userContext?: object) {
  const base = {
    now: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
  };
  // Shallow-merge caller context over the defaults
  return { ...base, ...(userContext ?? {}) };
}

export async function understandUserCommand(
  message: string,
  userContext?: object,
  tier: "default" | "lite" = "default"
): Promise<ArmiIntent> {
  if (!SUPABASE_URL) {
    throw new Error(
      "Supabase URL not configured. Set expo.extra.supabaseUrl (or EXPO_PUBLIC_SUPABASE_URL)."
    );
  }

  // Build headers. Cloud functions REQUIRE the anon key as Bearer.
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (SUPABASE_URL.startsWith("https://")) {
    if (!SUPABASE_ANON_KEY) {
      throw new Error(
        "Supabase anon key missing. Set expo.extra.supabaseAnonKey (or EXPO_PUBLIC_SUPABASE_ANON_KEY)."
      );
    }
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  // Auto-supply context (now/timezone) and allow caller to add more fields (e.g., knownProfiles)
  const context = buildDefaultContext(userContext);

  const res = await fetch(GPT_FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, context, tier }),
  });

  // Get raw text so errors include body for debugging
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`API request failed: ${res.status} ${text}`);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(`API request failed: ${res.status} ${text}`);
  }

  const result = data.result as ArmiIntent;
  if (!result || typeof result.intent !== "string" || !result.args) {
    throw new Error("Invalid response format from AI service");
  }
  return result;
}