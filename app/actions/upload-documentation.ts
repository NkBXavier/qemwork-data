"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = /\.(pdf|zip|docx?|xlsx?|txt|md)$/i;
const BUCKET = "qemwork-docs";

type UploadResult =
  | { success: true; path: string; name: string }
  | { success: false; error: string };

const RATE_LIMIT = 10;
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

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function uploadDocumentation(
  formData: FormData,
): Promise<UploadResult> {
  const h = await headers();
  const ip = extractIp(h);

  if (rateLimited(ip)) {
    return {
      success: false,
      error: "Trop de téléversements. Réessayez dans une heure.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Aucun fichier reçu." };
  }
  if (file.size === 0) {
    return { success: false, error: "Le fichier est vide." };
  }
  if (file.size > MAX_BYTES) {
    return { success: false, error: "Fichier trop volumineux (max 10 Mo)." };
  }
  if (!ALLOWED_EXT.test(file.name)) {
    return {
      success: false,
      error: "Format non autorisé (PDF, DOC, DOCX, XLS, XLSX, TXT, MD, ZIP).",
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const safeName = sanitize(file.name);
    const key = `${Date.now()}-${randomBytes(8).toString("hex")}-${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      console.error("[uploadDocumentation] Storage error:", error);
      return {
        success: false,
        error: "Échec du téléversement. Réessayez dans un instant.",
      };
    }

    return { success: true, path: key, name: file.name };
  } catch (e) {
    console.error("[uploadDocumentation] Unexpected error:", e);
    return {
      success: false,
      error: "Une erreur inattendue est survenue.",
    };
  }
}
