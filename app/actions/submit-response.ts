"use server";

import { headers } from "next/headers";
import { fullResponseSchema } from "@/lib/schema";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type SubmitResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const ipHits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (ipHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    ipHits.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipHits.set(ip, recent);
  return false;
}

function extractIp(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function submitResponse(input: unknown): Promise<SubmitResult> {
  const h = await headers();
  const ip = extractIp(h);
  const userAgent = h.get("user-agent") ?? null;

  if (rateLimited(ip)) {
    return {
      success: false,
      error:
        "Trop de soumissions depuis votre adresse. Réessayez dans une heure.",
    };
  }

  const parsed = fullResponseSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return {
      success: false,
      error: "Certains champs sont invalides. Vérifiez le formulaire.",
      fieldErrors,
    };
  }

  const d = parsed.data;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("qemwork_responses").insert({
      contact_name: d.contact_name,
      contact_role: d.contact_role,
      contact_email: d.contact_email,
      contact_phone: d.contact_phone || null,

      active_users: d.active_users,
      growth_goals: d.growth_goals,

      backend_setup: d.backend_setup,
      current_issues: d.current_issues,
      has_documentation: d.has_documentation,
      documentation_link: d.documentation_link || null,

      data_types: d.data_types,
      data_types_other: d.data_types_other || null,
      had_incidents: d.had_incidents,
      incidents_details: d.incidents_details || null,

      migration_intent: d.migration_intent,
      technical_needs: d.technical_needs,

      engagement_type: d.engagement_type,
      priorities: d.priorities,
      additional_notes: d.additional_notes || null,

      user_agent: userAgent,
    });

    if (error) {
      console.error("[submitResponse] Supabase error:", error);
      return {
        success: false,
        error: "Impossible d'enregistrer la réponse. Réessayez dans un instant.",
      };
    }

    return { success: true };
  } catch (e) {
    console.error("[submitResponse] Unexpected error:", e);
    return {
      success: false,
      error:
        "Une erreur inattendue est survenue. Contactez-nous si le problème persiste.",
    };
  }
}
