import { ArmiIntent } from "../types/armi-intents";

const BASE = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const GPT_FN_URL = `${BASE}/functions/v1/armi-gpt`;

export async function understandUserCommand(message: string, context?: object, tier: "default" | "lite" = "default"): Promise<ArmiIntent> {
  try {
    const res = await fetch(GPT_FN_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ message, context, tier })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API request failed: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.error || "GPT processing failed");
    }
    
    // Validate that we have a proper ArmiIntent
    const result = data.result as ArmiIntent;
    if (!result || typeof result.intent !== "string" || !result.args) {
      throw new Error("Invalid response format from AI service");
    }
    
    return result;
  } catch (error) {
    console.error("Error calling GPT service:", error);
    throw error;
  }
}