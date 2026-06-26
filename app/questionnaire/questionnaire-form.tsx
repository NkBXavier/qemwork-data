"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Path } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { ZodTypeAny } from "zod";

import { submitResponse } from "@/app/actions/submit-response";
import { uploadDocumentation } from "@/app/actions/upload-documentation";
import {
  ACTIVE_USERS_OPTIONS,
  BACKEND_SETUP_OPTIONS,
  DATA_TYPE_OPTIONS,
  ENGAGEMENT_OPTIONS,
  HAS_DOC_OPTIONS,
  INCIDENT_OPTIONS,
  MIGRATION_INTENT_OPTIONS,
  STEP_KEYS,
  TECHNICAL_NEEDS_OPTIONS,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  stepRecapSchema,
  stepReportSchema,
} from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type FormValues = {
  report_feedback: string;

  contact_name: string;
  contact_role: string;
  contact_email: string;
  contact_phone: string;

  active_users: string;
  growth_goals: string;

  backend_setup: string;
  current_issues: string;
  has_documentation: string;
  documentation_link: string;
  documentation_file_path: string;
  documentation_file_name: string;

  data_types: string[];
  data_types_other: string;
  had_incidents: string;
  incidents_details: string;

  migration_intent: string;
  technical_needs: string[];

  engagement_type: string[];
  additional_notes: string;

  recap_feedback: string;
};

const STORAGE_KEY = "qemwork-qualification-v2";

const STEP_SCHEMAS: ZodTypeAny[] = [
  step1Schema,
  stepReportSchema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  stepRecapSchema,
];

const STEP_TITLES = [
  "Identification",
  "Rapport d'analyse",
  "Activité & croissance",
  "Architecture actuelle",
  "Données & sécurité",
  "Direction technique",
  "Engagement",
  "Récapitulatif",
];

const PHASE_OF_STEP = [1, 1, 2, 2, 2, 2, 2, 3] as const;
const PHASE_TITLES = {
  1: "Identification & analyse",
  2: "Vos besoins",
  3: "Validation",
} as const;

function defaultValues(): FormValues {
  return {
    report_feedback: "",

    contact_name: "",
    contact_role: "",
    contact_email: "",
    contact_phone: "",

    active_users: "",
    growth_goals: "",

    backend_setup: "",
    current_issues: "",
    has_documentation: "",
    documentation_link: "",
    documentation_file_path: "",
    documentation_file_name: "",

    data_types: [],
    data_types_other: "",
    had_incidents: "",
    incidents_details: "",

    migration_intent: "",
    technical_needs: [],

    engagement_type: [],
    additional_notes: "",

    recap_feedback: "",
  };
}

export default function QuestionnaireForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPending, startTransition] = useTransition();
  const restoredRef = useRef(false);

  const form = useForm<FormValues>({
    defaultValues: defaultValues(),
    mode: "onTouched",
    shouldUnregister: false,
  });

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<FormValues> & { _step?: number };
      const merged = { ...defaultValues(), ...saved };
      delete (merged as { _step?: number })._step;
      form.reset(merged);
      if (typeof saved._step === "number") {
        setStep(Math.min(Math.max(saved._step, 0), STEP_TITLES.length - 1));
      }
    } catch {
      // ignore corrupted state
    }
  }, [form]);

  useEffect(() => {
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...values, _step: step }),
        );
      } catch {
        // localStorage full or unavailable, ignore
      }
    });
    return () => sub.unsubscribe();
  }, [form, step]);

  async function validateStep(index: number): Promise<boolean> {
    const schema = STEP_SCHEMAS[index]!;
    const keys = STEP_KEYS[index]!;
    const values = form.getValues();
    const slice: Record<string, unknown> = {};
    for (const k of keys) slice[k] = (values as Record<string, unknown>)[k];

    const result = schema.safeParse(slice);
    keys.forEach((k) => form.clearErrors(k as Path<FormValues>));

    if (result.success) return true;

    for (const issue of result.error.issues) {
      const path = issue.path.join(".") as Path<FormValues>;
      form.setError(path, { type: "manual", message: issue.message });
    }
    return false;
  }

  async function goNext() {
    const ok = await validateStep(step);
    if (!ok) {
      toast.error("Merci de corriger les champs en rouge avant de continuer.");
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  }

  function goPrev() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit() {
    const ok = await validateStep(step);
    if (!ok) {
      toast.error("Certains champs sont invalides.");
      return;
    }
    const values = form.getValues();
    startTransition(async () => {
      const res = await submitResponse(values);
      if (res.success) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        toast.success("Réponses envoyées. Merci !");
        router.push("/merci");
      } else {
        toast.error(res.error);
        if (res.fieldErrors) {
          for (const [path, messages] of Object.entries(res.fieldErrors)) {
            form.setError(path as Path<FormValues>, {
              type: "server",
              message: messages[0],
            });
          }
        }
      }
    });
  }

  const progress = ((step + 1) / STEP_TITLES.length) * 100;
  const isLast = step === STEP_TITLES.length - 1;
  const phase = PHASE_OF_STEP[step]!;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-start justify-between gap-1.5 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="text-[13px] font-bold uppercase tracking-wider text-zinc-700 sm:text-xs">
            Phase {phase} sur 3 · {PHASE_TITLES[phase]}
          </span>
          <span className="text-sm font-bold text-primary sm:text-[15px]">
            {STEP_TITLES[step]}
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-7"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-[1.6rem] font-bold leading-tight tracking-tight text-zinc-950 sm:text-3xl">
                {STEP_TITLES[step]}
              </h2>
              <p className="text-[15px] text-zinc-700 sm:text-base">
                Tous les champs marqués
                <span className="font-bold text-primary"> *</span> sont obligatoires.
              </p>
            </div>

            {step === 0 && <Step1 form={form} />}
            {step === 1 && <StepReport form={form} />}
            {step === 2 && <Step2 form={form} />}
            {step === 3 && <Step3 form={form} />}
            {step === 4 && <Step4 form={form} />}
            {step === 5 && <Step5 form={form} />}
            {step === 6 && <Step6 form={form} />}
            {step === 7 && <StepRecap form={form} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <Separator />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={goPrev}
          disabled={step === 0 || isPending}
          className="h-12 px-4 text-base font-semibold sm:w-auto"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Précédent
        </Button>

        {isLast ? (
          <Button
            type="button"
            size="lg"
            onClick={onSubmit}
            disabled={isPending}
            className="h-12 px-6 text-base font-semibold sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Envoyer mes réponses
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={goNext}
            className="h-12 px-6 text-base font-semibold sm:w-auto"
          >
            Suivant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Field helpers
// ============================================================

function FieldShell({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <Label className="text-[15px] font-bold leading-snug text-zinc-950 sm:text-base">
        {label}
        {required ? <span className="ml-0.5 font-bold text-primary">*</span> : null}
      </Label>
      {hint ? (
        <p className="text-[14px] leading-relaxed text-zinc-700 sm:text-[15px]">{hint}</p>
      ) : null}
      {children}
      {error ? (
        <p className="text-[14px] font-semibold text-red-700 sm:text-sm">{error}</p>
      ) : null}
    </div>
  );
}

type StepProps = { form: ReturnType<typeof useForm<FormValues>> };

// ============================================================
// Step 1 — Identification
// ============================================================

function Step1({ form }: StepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] text-zinc-700 sm:text-base">
        Quelques informations pour que nous sachions à qui revenir.
      </p>

      <FieldShell
        label="Votre nom complet"
        required
        error={errors.contact_name?.message}
      >
        <Input
          autoComplete="name"
          {...register("contact_name")}
          placeholder="Jeanne Dupont"
        />
      </FieldShell>

      <FieldShell
        label="Votre rôle chez Qemwork"
        required
        error={errors.contact_role?.message}
      >
        <Input
          {...register("contact_role")}
          placeholder="CTO, fondatrice, responsable produit…"
        />
      </FieldShell>

      <FieldShell
        label="Email professionnel"
        required
        error={errors.contact_email?.message}
      >
        <Input
          type="email"
          autoComplete="email"
          {...register("contact_email")}
          placeholder="jeanne@qemwork.com"
        />
      </FieldShell>

      <FieldShell
        label="Téléphone (optionnel)"
        hint="Au format international, par exemple +33 6 12 34 56 78."
        error={errors.contact_phone?.message}
      >
        <Input
          type="tel"
          autoComplete="tel"
          {...register("contact_phone")}
          placeholder="+33 …"
        />
      </FieldShell>
    </div>
  );
}

// ============================================================
// Step 2 — Activité & croissance
// ============================================================

function Step2({ form }: StepProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-5">
      <FieldShell
        label="Combien d'utilisateurs actifs avez-vous actuellement ?"
        required
        error={errors.active_users?.message}
      >
        <Controller
          control={control}
          name="active_users"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez une plage" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVE_USERS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FieldShell>

      <FieldShell
        label="Quels sont vos objectifs de croissance sur 12 mois ?"
        hint="Volumétrie cible, marchés visés, nouvelles fonctionnalités…"
        required
        error={errors.growth_goals?.message}
      >
        <Textarea
          rows={5}
          {...register("growth_goals")}
          placeholder="Atteindre 50 000 utilisateurs, ouvrir le marché européen, lancer un module B2B…"
        />
      </FieldShell>
    </div>
  );
}

// ============================================================
// Step 3 — Architecture
// ============================================================

function Step3({ form }: StepProps) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;

  const hasDoc = watch("has_documentation");
  const showDocLink = hasDoc && hasDoc !== "Non";

  return (
    <div className="flex flex-col gap-5">
      <FieldShell
        label="Utilisez-vous uniquement Firebase ou existe-t-il un backend personnalisé ?"
        required
        error={errors.backend_setup?.message}
      >
        <Controller
          control={control}
          name="backend_setup"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="gap-2"
            >
              {BACKEND_SETUP_OPTIONS.map((opt) => (
                <Label
                  key={opt}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3.5 transition-colors hover:border-primary/40 hover:bg-primary/5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem value={opt} />
                  <span className="text-[15px] font-semibold text-zinc-900 sm:text-base">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </FieldShell>

      <FieldShell
        label="Quelles fonctionnalités backend posent actuellement problème ?"
        hint="Performance, fiabilité, coût, complexité, sécurité…"
        required
        error={errors.current_issues?.message}
      >
        <Textarea
          rows={5}
          {...register("current_issues")}
          placeholder="Les notifications push échouent au-delà de 1 000 envois simultanés, le module de paiement…"
        />
      </FieldShell>

      <FieldShell
        label="Avez-vous une documentation technique existante ?"
        required
        error={errors.has_documentation?.message}
      >
        <Controller
          control={control}
          name="has_documentation"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="gap-2"
            >
              {HAS_DOC_OPTIONS.map((opt) => (
                <Label
                  key={opt}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3.5 transition-colors hover:border-primary/40 hover:bg-primary/5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem value={opt} />
                  <span className="text-[15px] font-semibold text-zinc-900 sm:text-base">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </FieldShell>

      {showDocLink ? (
        <DocumentationField form={form} />
      ) : null}
    </div>
  );
}

// ============================================================
// Documentation : toggle lien / fichier
// ============================================================

function DocumentationField({ form }: StepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const linkValue = watch("documentation_link");
  const fileName = watch("documentation_file_name");
  const filePath = watch("documentation_file_path");

  const initialMode: "link" | "file" = filePath ? "file" : "link";
  const [mode, setMode] = useState<"link" | "file">(initialMode);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function switchMode(next: "link" | "file") {
    setMode(next);
    if (next === "link") {
      setValue("documentation_file_path", "");
      setValue("documentation_file_name", "");
    } else {
      setValue("documentation_link", "");
    }
  }

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo).");
      return;
    }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadDocumentation(fd);
      if (res.success) {
        setValue("documentation_file_path", res.path, { shouldDirty: true });
        setValue("documentation_file_name", res.name, { shouldDirty: true });
        toast.success("Document téléversé.");
      } else {
        toast.error(res.error);
      }
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeFile() {
    setValue("documentation_file_path", "");
    setValue("documentation_file_name", "");
  }

  const hasFile = Boolean(filePath && fileName);

  return (
    <FieldShell
      label="Documentation (optionnel)"
      hint="Partagez un lien (Notion, Confluence, GitHub…) ou téléversez un fichier."
      error={errors.documentation_link?.message || errors.documentation_file_path?.message}
    >
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit rounded-lg border border-zinc-200 bg-zinc-50 p-1">
          <button
            type="button"
            onClick={() => switchMode("link")}
            className={`rounded-md px-3.5 py-2 text-[15px] font-semibold transition-colors ${
              mode === "link"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-700 hover:text-zinc-950"
            }`}
          >
            Lien
          </button>
          <button
            type="button"
            onClick={() => switchMode("file")}
            className={`rounded-md px-3.5 py-2 text-[15px] font-semibold transition-colors ${
              mode === "file"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-700 hover:text-zinc-950"
            }`}
          >
            Fichier
          </button>
        </div>

        {mode === "link" ? (
          <Input
            {...register("documentation_link")}
            placeholder="https://"
            defaultValue={linkValue}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {hasFile ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="truncate text-[15px] font-semibold text-zinc-950 sm:text-base">
                    {fileName}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="shrink-0 text-zinc-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Retirer le fichier</span>
                </Button>
              </div>
            ) : (
              <label
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 bg-white p-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/5 ${
                  isUploading ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <span className="text-[15px] font-semibold text-zinc-800 sm:text-base">
                      Téléversement en cours…
                    </span>
                  </>
                ) : (
                  <>
                    <FileUp className="h-7 w-7 text-primary" />
                    <span className="text-[15px] font-semibold text-zinc-950 sm:text-base">
                      Cliquez pour choisir un fichier
                    </span>
                    <span className="text-[13px] text-zinc-700 sm:text-sm">
                      PDF, DOC, DOCX, XLS, XLSX, TXT, MD, ZIP — 10 Mo max
                    </span>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.zip"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                />
              </label>
            )}
          </div>
        )}
      </div>
    </FieldShell>
  );
}

// ============================================================
// Step 4 — Données & sécurité
// ============================================================

function Step4({ form }: StepProps) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;

  const dataTypes = watch("data_types");
  const hadIncidents = watch("had_incidents");

  return (
    <div className="flex flex-col gap-5">
      <FieldShell
        label="Quels types de données utilisateurs sont stockés ?"
        hint="Sélectionnez tout ce qui s'applique."
        required
        error={errors.data_types?.message}
      >
        <Controller
          control={control}
          name="data_types"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              {DATA_TYPE_OPTIONS.map((opt) => {
                const checked = field.value.includes(opt);
                return (
                  <Label
                    key={opt}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3.5 transition-colors hover:border-primary/40 hover:bg-primary/5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        if (c) field.onChange([...field.value, opt]);
                        else
                          field.onChange(
                            field.value.filter((v: string) => v !== opt),
                          );
                      }}
                    />
                    <span className="text-[15px] font-semibold text-zinc-900 sm:text-base">{opt}</span>
                  </Label>
                );
              })}
            </div>
          )}
        />
      </FieldShell>

      {dataTypes?.includes("Autre") ? (
        <FieldShell
          label="Précisez le type de données « Autre »"
          required
          error={errors.data_types_other?.message}
        >
          <Input
            {...register("data_types_other")}
            placeholder="Métadonnées d'usage, contenu généré…"
          />
        </FieldShell>
      ) : null}

      <FieldShell
        label="Avez-vous déjà rencontré des incidents de sécurité ou de performance ?"
        required
        error={errors.had_incidents?.message}
      >
        <Controller
          control={control}
          name="had_incidents"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="gap-2"
            >
              {INCIDENT_OPTIONS.map((opt) => (
                <Label
                  key={opt}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3.5 transition-colors hover:border-primary/40 hover:bg-primary/5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem value={opt} />
                  <span className="text-[15px] font-semibold text-zinc-900 sm:text-base">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </FieldShell>

      {hadIncidents === "Oui" ? (
        <FieldShell
          label="Pouvez-vous décrire brièvement ?"
          hint="Nature, impact, période — pas besoin d'être exhaustif."
          required
          error={errors.incidents_details?.message}
        >
          <Textarea
            rows={4}
            {...register("incidents_details")}
            placeholder="Indisponibilité de 4h en mars, fuite de logs publics, etc."
          />
        </FieldShell>
      ) : null}
    </div>
  );
}

// ============================================================
// Step 5 — Direction technique
// ============================================================

function Step5({ form }: StepProps) {
  const {
    control,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-5">
      <FieldShell
        label="Souhaitez-vous conserver Firebase ou migrer vers une architecture backend dédiée ?"
        required
        error={errors.migration_intent?.message}
      >
        <Controller
          control={control}
          name="migration_intent"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="gap-2"
            >
              {MIGRATION_INTENT_OPTIONS.map((opt) => (
                <Label
                  key={opt}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3.5 transition-colors hover:border-primary/40 hover:bg-primary/5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem value={opt} />
                  <span className="text-[15px] font-semibold text-zinc-900 sm:text-base">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </FieldShell>

      <FieldShell
        label="De quoi avez-vous besoin ?"
        hint="Plusieurs réponses possibles."
        required
        error={errors.technical_needs?.message}
      >
        <Controller
          control={control}
          name="technical_needs"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              {TECHNICAL_NEEDS_OPTIONS.map((opt) => {
                const checked = field.value.includes(opt);
                return (
                  <Label
                    key={opt}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3.5 transition-colors hover:border-primary/40 hover:bg-primary/5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        if (c) field.onChange([...field.value, opt]);
                        else
                          field.onChange(
                            field.value.filter((v: string) => v !== opt),
                          );
                      }}
                    />
                    <span className="text-[15px] font-semibold text-zinc-900 sm:text-base">{opt}</span>
                  </Label>
                );
              })}
            </div>
          )}
        />
      </FieldShell>
    </div>
  );
}

// ============================================================
// Step 6 — Engagement
// ============================================================

function Step6({ form }: StepProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-5">
      <FieldShell
        label="Qu'attendez-vous de notre équipe ?"
        hint="Plusieurs réponses possibles."
        required
        error={errors.engagement_type?.message}
      >
        <Controller
          control={control}
          name="engagement_type"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              {ENGAGEMENT_OPTIONS.map((opt) => {
                const checked = field.value.includes(opt);
                return (
                  <Label
                    key={opt}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3.5 transition-colors hover:border-primary/40 hover:bg-primary/5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        if (c) field.onChange([...field.value, opt]);
                        else
                          field.onChange(
                            field.value.filter((v: string) => v !== opt),
                          );
                      }}
                    />
                    <span className="text-[15px] font-semibold text-zinc-900 sm:text-base">{opt}</span>
                  </Label>
                );
              })}
            </div>
          )}
        />
      </FieldShell>

      <FieldShell
        label="Souhaitez-vous ajouter quelque chose ?"
        hint="Optionnel."
        error={errors.additional_notes?.message}
      >
        <Textarea
          rows={4}
          {...register("additional_notes")}
          placeholder="Contraintes spécifiques, délais cibles, équipe en place…"
        />
      </FieldShell>
    </div>
  );
}

// ============================================================
// Phase 1 — Rapport d'analyse préliminaire
// ============================================================

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[15px] font-bold uppercase tracking-wider text-primary sm:text-base">
        {title}
      </h3>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-zinc-800 sm:text-base">
        {children}
      </div>
    </section>
  );
}

function ReportItem({
  name,
  role,
  impact,
}: {
  name: string;
  role: string;
  impact?: string[];
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="text-[15px] font-bold text-zinc-950 sm:text-base">{name}</div>
      <div className="mt-1.5 text-[14px] leading-relaxed text-zinc-800 sm:text-[15px]">
        <span className="font-bold text-zinc-950">Rôle :</span> {role}
      </div>
      {impact && impact.length > 0 ? (
        <div className="mt-2.5 text-[14px] leading-relaxed text-zinc-800 sm:text-[15px]">
          <span className="font-bold text-zinc-950">Impact backend :</span>
          <ul className="ml-5 mt-1.5 list-disc space-y-1">
            {impact.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function StepReport({ form }: StepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-7">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <p className="text-[15px] leading-relaxed text-zinc-900 sm:text-base">
          Nous avons analysé la plateforme{" "}
          <strong className="font-bold">Qemwork</strong> avant de vous
          solliciter. Voici les éléments techniques détectés. Confirmez ou
          complétez-les en bas de page — cela nous permet de cadrer la suite
          du questionnaire au plus juste.
        </p>
      </div>

      <ReportSection title="1. Résumé exécutif">
        <p>
          La plateforme Qemwork utilise une architecture web moderne orientée
          frontend dynamique avec plusieurs services cloud et outils tiers. Les
          éléments détectés montrent principalement :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Une application frontend basée sur React</li>
          <li>Une utilisation de Firebase comme backend temps réel / BaaS</li>
          <li>Une distribution via CDN et load balancing avec Fastly</li>
          <li>Des mécanismes de sécurité via HTTPS, HSTS et reCAPTCHA</li>
          <li>Une compatibilité mobile avancée</li>
          <li>Une infrastructure DNS et mail gérée par Hostinger</li>
        </ul>
      </ReportSection>

      <ReportSection title="A. Technologies critiques">
        <ReportItem
          name="1. React"
          role="Framework frontend principal pour l'interface utilisateur."
          impact={[
            "API REST ou temps réel nécessaires",
            "Gestion d'authentification",
            "Gestion d'état côté client",
            "Optimisation des échanges API",
          ]}
        />
        <ReportItem
          name="2. Firebase"
          role="Backend-as-a-Service utilisé probablement pour : authentification, base de données temps réel, hébergement partiel, notifications, stockage."
          impact={[
            "Migration ou extension backend possible",
            "Analyse de la dépendance Firebase",
            "Gestion sécurité / règles Firestore",
            "Scalabilité et coûts cloud",
          ]}
        />
        <ReportItem
          name="3. Fastly"
          role="CDN + Load Balancer + optimisation trafic."
          impact={[
            "Mise en cache",
            "Performance mondiale",
            "Répartition de charge",
            "Protection trafic",
          ]}
        />
      </ReportSection>

      <ReportSection title="B. Sécurité et conformité">
        <ReportItem
          name="4. Google reCAPTCHA + reCAPTCHA Enterprise"
          role="Protection anti-bot et anti-spam."
          impact={[
            "Validation serveur obligatoire",
            "Gestion sécurité formulaires / auth",
          ]}
        />
        <ReportItem
          name="5. SSL / HTTPS / HSTS"
          role={`Point critique détecté : "Common Name Invalid" sur le certificat SSL — peut indiquer une mauvaise configuration SSL, un domaine secondaire mal configuré, ou un risque de confiance navigateur.`}
        />
        <ReportItem
          name="6. DMARC / SPF"
          role={`Politique DMARC actuellement en "None" : monitoring actif, mais protection non appliquée.`}
        />
      </ReportSection>

      <ReportSection title="C. Infrastructure & hébergement">
        <ReportItem
          name="7. Hostinger"
          role="DNS, registrar, mail hosting."
        />
        <ReportItem
          name="8. Hébergement US + Fastly Hosted"
          role="Serveurs localisés aux États-Unis."
        />
      </ReportSection>

      <ReportSection title="D. Analytics & suivi">
        <ReportItem
          name="9. Global Site Tag"
          role="Tracking Google Analytics / Ads."
        />
      </ReportSection>

      <ReportSection title="E. Compatibilité mobile">
        <ul className="ml-5 list-disc space-y-1">
          <li>Viewport Meta</li>
          <li>Apple Mobile Web App</li>
          <li>iPhone Compatible</li>
        </ul>
      </ReportSection>

      <ReportSection title="F. Optimisations frontend">
        <ul className="ml-5 list-disc space-y-1">
          <li>10. JavaScript Modules</li>
          <li>11. Intersection Observer</li>
        </ul>
      </ReportSection>

      <Separator />

      <FieldShell
        label="Avez-vous des éléments à ajouter ou à corriger ?"
        hint="Technologies oubliées, infos erronées, contexte additionnel — tout ce qui peut affiner notre analyse."
        error={errors.report_feedback?.message}
      >
        <Textarea
          rows={5}
          {...register("report_feedback")}
          placeholder="Par exemple : nous utilisons aussi Stripe pour les paiements, le backend custom tourne sur AWS Lambda…"
        />
      </FieldShell>
    </div>
  );
}

// ============================================================
// Phase 3 — Récapitulatif
// ============================================================

function RecapRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-200 py-3 last:border-b-0 sm:flex-row sm:gap-4">
      <div className="text-[13px] font-bold uppercase tracking-wide text-zinc-700 sm:w-56 sm:shrink-0 sm:text-xs">
        {label}
      </div>
      <div className="text-[15px] leading-relaxed text-zinc-900 sm:text-base">
        {value || <em className="text-zinc-500">—</em>}
      </div>
    </div>
  );
}

function RecapBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-2 text-[15px] font-bold uppercase tracking-wider text-primary sm:text-base">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function renderList(values: string[] | undefined) {
  if (!values || values.length === 0) return null;
  return (
    <ul className="ml-5 list-disc space-y-0.5">
      {values.map((v) => (
        <li key={v}>{v}</li>
      ))}
    </ul>
  );
}

function StepRecap({ form }: StepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const v = watch();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <p className="text-[15px] leading-relaxed text-zinc-900 sm:text-base">
          Voici le récapitulatif de vos réponses. Relisez-le, complétez ou
          corrigez ce qui doit l&apos;être, puis envoyez le questionnaire.
        </p>
      </div>

      <RecapBlock title="Contact">
        <RecapRow label="Nom" value={v.contact_name} />
        <RecapRow label="Rôle" value={v.contact_role} />
        <RecapRow label="Email" value={v.contact_email} />
        <RecapRow label="Téléphone" value={v.contact_phone} />
      </RecapBlock>

      <RecapBlock title="Activité & croissance">
        <RecapRow label="Utilisateurs actifs" value={v.active_users} />
        <RecapRow label="Objectifs 12 mois" value={v.growth_goals} />
      </RecapBlock>

      <RecapBlock title="Architecture actuelle">
        <RecapRow label="Backend en place" value={v.backend_setup} />
        <RecapRow label="Problèmes rencontrés" value={v.current_issues} />
        <RecapRow label="Documentation" value={v.has_documentation} />
        {v.documentation_link ? (
          <RecapRow label="Lien doc" value={v.documentation_link} />
        ) : null}
        {v.documentation_file_name ? (
          <RecapRow
            label="Fichier doc"
            value={
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {v.documentation_file_name}
              </span>
            }
          />
        ) : null}
      </RecapBlock>

      <RecapBlock title="Données & sécurité">
        <RecapRow label="Types de données" value={renderList(v.data_types)} />
        {v.data_types_other ? (
          <RecapRow label="Autre type" value={v.data_types_other} />
        ) : null}
        <RecapRow label="Incidents passés" value={v.had_incidents} />
        {v.incidents_details ? (
          <RecapRow label="Détails incidents" value={v.incidents_details} />
        ) : null}
      </RecapBlock>

      <RecapBlock title="Direction technique">
        <RecapRow label="Intention de migration" value={v.migration_intent} />
        <RecapRow label="Besoins techniques" value={renderList(v.technical_needs)} />
      </RecapBlock>

      <RecapBlock title="Engagement">
        <RecapRow label="Type d'engagement" value={renderList(v.engagement_type)} />
        {v.additional_notes ? (
          <RecapRow label="Notes" value={v.additional_notes} />
        ) : null}
      </RecapBlock>

      {v.report_feedback ? (
        <RecapBlock title="Retour sur notre analyse">
          <RecapRow label="Compléments" value={v.report_feedback} />
        </RecapBlock>
      ) : null}

      <Separator />

      <FieldShell
        label="Souhaitez-vous ajouter ou modifier quelque chose ?"
        hint="Dernière occasion d'ajuster avant envoi. Optionnel."
        error={errors.recap_feedback?.message}
      >
        <Textarea
          rows={5}
          {...register("recap_feedback")}
          placeholder="Précisions de dernière minute, ajustements, points à clarifier…"
        />
      </FieldShell>
    </div>
  );
}
