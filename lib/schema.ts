import { z } from "zod";

export const ACTIVE_USERS_OPTIONS = [
  "Moins de 100",
  "100 à 1 000",
  "1 000 à 10 000",
  "Plus de 10 000",
  "Je ne sais pas",
] as const;

export const BACKEND_SETUP_OPTIONS = [
  "Firebase uniquement",
  "Backend custom uniquement",
  "Hybride (Firebase + custom)",
  "Je ne sais pas",
] as const;

export const HAS_DOC_OPTIONS = ["Oui, complète", "Oui, partielle", "Non"] as const;

export const DATA_TYPE_OPTIONS = [
  "Identité / profil",
  "Paiements / transactions",
  "Géolocalisation",
  "Messages / communications",
  "Documents / fichiers",
  "Données techniques (logs)",
  "Autre",
] as const;

export const INCIDENT_OPTIONS = ["Oui", "Non", "Je ne sais pas"] as const;

export const MIGRATION_INTENT_OPTIONS = [
  "Conserver Firebase",
  "Migrer entièrement",
  "Solution hybride",
  "À discuter avec vous",
] as const;

export const TECHNICAL_NEEDS_OPTIONS = [
  "API REST",
  "WebSockets / temps réel",
  "Microservices",
  "Dashboard admin",
  "Authentification avancée",
  "Webhooks / intégrations tierces",
] as const;

export const ENGAGEMENT_OPTIONS = [
  "Développement uniquement",
  "Maintenance continue",
  "Support DevOps / Cloud",
  "Conseil / audit",
  "Formation de votre équipe",
] as const;

const REQ = "Ce champ est obligatoire.";
const MIN20 = "Merci de détailler en au moins 20 caractères.";

export const stepReportSchema = z.object({
  report_feedback: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const stepRecapSchema = z.object({
  recap_feedback: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const step1Schema = z.object({
  contact_name: z.string().trim().min(1, REQ),
  contact_role: z.string().trim().min(1, REQ),
  contact_email: z
    .string()
    .trim()
    .min(1, REQ)
    .email("Adresse email invalide."),
  contact_phone: z
    .string()
    .trim()
    .max(40, "Numéro trop long.")
    .optional()
    .or(z.literal("")),
});

export const step2Schema = z.object({
  active_users: z.enum(ACTIVE_USERS_OPTIONS, { message: REQ }),
  growth_goals: z.string().trim().min(20, MIN20),
});

export const step3Schema = z
  .object({
    backend_setup: z.enum(BACKEND_SETUP_OPTIONS, { message: REQ }),
    current_issues: z.string().trim().min(20, MIN20),
    has_documentation: z.enum(HAS_DOC_OPTIONS, { message: REQ }),
    documentation_link: z.string().trim().optional().or(z.literal("")),
    documentation_file_path: z.string().trim().optional().or(z.literal("")),
    documentation_file_name: z.string().trim().optional().or(z.literal("")),
  });

export const step4Schema = z
  .object({
    data_types: z
      .array(z.enum(DATA_TYPE_OPTIONS))
      .min(1, "Sélectionnez au moins une option."),
    data_types_other: z.string().trim().optional().or(z.literal("")),
    had_incidents: z.enum(INCIDENT_OPTIONS, { message: REQ }),
    incidents_details: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (d) => !d.data_types.includes("Autre") || (d.data_types_other ?? "").length > 0,
    {
      path: ["data_types_other"],
      message: "Précisez le type de données.",
    },
  )
  .refine(
    (d) => d.had_incidents !== "Oui" || (d.incidents_details ?? "").length >= 10,
    {
      path: ["incidents_details"],
      message: "Décrivez brièvement l'incident (10 caractères min).",
    },
  );

export const step5Schema = z.object({
  migration_intent: z.enum(MIGRATION_INTENT_OPTIONS, { message: REQ }),
  technical_needs: z
    .array(z.enum(TECHNICAL_NEEDS_OPTIONS))
    .min(1, "Sélectionnez au moins une option."),
});

export const step6Schema = z.object({
  engagement_type: z
    .array(z.enum(ENGAGEMENT_OPTIONS))
    .min(1, "Sélectionnez au moins une option."),
  additional_notes: z.string().trim().optional().or(z.literal("")),
});

export const fullResponseSchema = z
  .object({
    report_feedback: z.string().trim().max(2000).optional().or(z.literal("")),

    contact_name: z.string().trim().min(1, REQ),
    contact_role: z.string().trim().min(1, REQ),
    contact_email: z.string().trim().email("Adresse email invalide."),
    contact_phone: z.string().trim().max(40).optional().or(z.literal("")),

    active_users: z.enum(ACTIVE_USERS_OPTIONS),
    growth_goals: z.string().trim().min(20, MIN20),

    backend_setup: z.enum(BACKEND_SETUP_OPTIONS),
    current_issues: z.string().trim().min(20, MIN20),
    has_documentation: z.enum(HAS_DOC_OPTIONS),
    documentation_link: z.string().trim().optional().or(z.literal("")),
    documentation_file_path: z.string().trim().optional().or(z.literal("")),
    documentation_file_name: z.string().trim().optional().or(z.literal("")),

    data_types: z.array(z.enum(DATA_TYPE_OPTIONS)).min(1),
    data_types_other: z.string().trim().optional().or(z.literal("")),
    had_incidents: z.enum(INCIDENT_OPTIONS),
    incidents_details: z.string().trim().optional().or(z.literal("")),

    migration_intent: z.enum(MIGRATION_INTENT_OPTIONS),
    technical_needs: z.array(z.enum(TECHNICAL_NEEDS_OPTIONS)).min(1),

    engagement_type: z.array(z.enum(ENGAGEMENT_OPTIONS)).min(1),
    additional_notes: z.string().trim().optional().or(z.literal("")),

    recap_feedback: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine(
    (d) => !d.data_types.includes("Autre") || (d.data_types_other ?? "").length > 0,
    { path: ["data_types_other"], message: "Précisez le type de données." },
  )
  .refine(
    (d) => d.had_incidents !== "Oui" || (d.incidents_details ?? "").length >= 10,
    {
      path: ["incidents_details"],
      message: "Décrivez brièvement l'incident (10 caractères min).",
    },
  );

export type FullResponse = z.infer<typeof fullResponseSchema>;
export const STEP_KEYS: (keyof FullResponse)[][] = [
  ["report_feedback"],
  ["contact_name", "contact_role", "contact_email", "contact_phone"],
  ["active_users", "growth_goals"],
  [
    "backend_setup",
    "current_issues",
    "has_documentation",
    "documentation_link",
    "documentation_file_path",
    "documentation_file_name",
  ],
  ["data_types", "data_types_other", "had_incidents", "incidents_details"],
  ["migration_intent", "technical_needs"],
  ["engagement_type", "additional_notes"],
  ["recap_feedback"],
];
