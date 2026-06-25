"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Path } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import type { ZodTypeAny } from "zod";

import { submitResponse } from "@/app/actions/submit-response";
import {
  ACTIVE_USERS_OPTIONS,
  BACKEND_SETUP_OPTIONS,
  DATA_TYPE_OPTIONS,
  ENGAGEMENT_OPTIONS,
  HAS_DOC_OPTIONS,
  INCIDENT_OPTIONS,
  MIGRATION_INTENT_OPTIONS,
  PRIORITY_ITEMS,
  STEP_KEYS,
  TECHNICAL_NEEDS_OPTIONS,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
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

import { PrioritiesSortable } from "./priorities-sortable";

type FormValues = {
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

  data_types: string[];
  data_types_other: string;
  had_incidents: string;
  incidents_details: string;

  migration_intent: string;
  technical_needs: string[];

  engagement_type: string[];
  priorities: string[];
  additional_notes: string;
};

const STORAGE_KEY = "qemwork-qualification-v1";

const STEP_SCHEMAS: ZodTypeAny[] = [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
];

const STEP_TITLES = [
  "Identification",
  "Activité & croissance",
  "Architecture actuelle",
  "Données & sécurité",
  "Direction technique",
  "Engagement & priorités",
];

function defaultValues(): FormValues {
  return {
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

    data_types: [],
    data_types_other: "",
    had_incidents: "",
    incidents_details: "",

    migration_intent: "",
    technical_needs: [],

    engagement_type: [],
    priorities: [...PRIORITY_ITEMS],
    additional_notes: "",
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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Étape {step + 1} sur {STEP_TITLES.length}
          </span>
          <span className="text-sm font-semibold text-primary">
            {STEP_TITLES[step]}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
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
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                {STEP_TITLES[step]}
              </h2>
              <p className="text-sm text-zinc-500">
                Tous les champs marqués
                <span className="text-primary"> *</span> sont obligatoires.
              </p>
            </div>

            {step === 0 && <Step1 form={form} />}
            {step === 1 && <Step2 form={form} />}
            {step === 2 && <Step3 form={form} />}
            {step === 3 && <Step4 form={form} />}
            {step === 4 && <Step5 form={form} />}
            {step === 5 && <Step6 form={form} />}
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
          className="h-11 px-4 text-base sm:w-auto"
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
            className="h-12 px-6 text-base sm:w-auto"
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
            className="h-12 px-6 text-base sm:w-auto"
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
      <Label className="text-base font-semibold leading-snug text-zinc-950">
        {label}
        {required ? <span className="ml-0.5 text-primary">*</span> : null}
      </Label>
      {hint ? (
        <p className="text-sm leading-relaxed text-zinc-500">{hint}</p>
      ) : null}
      {children}
      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
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
      <p className="text-sm text-zinc-600">
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
                  <span className="text-[15px] font-medium text-zinc-900">{opt}</span>
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
                  <span className="text-[15px] font-medium text-zinc-900">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </FieldShell>

      {showDocLink ? (
        <FieldShell
          label="Lien vers la documentation (optionnel)"
          hint="URL Notion, Confluence, GitHub, etc."
          error={errors.documentation_link?.message}
        >
          <Input
            {...register("documentation_link")}
            placeholder="https://"
          />
        </FieldShell>
      ) : null}
    </div>
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
                    <span className="text-[15px] font-medium text-zinc-900">{opt}</span>
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
                  <span className="text-[15px] font-medium text-zinc-900">{opt}</span>
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
                  <span className="text-[15px] font-medium text-zinc-900">{opt}</span>
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
                    <span className="text-[15px] font-medium text-zinc-900">{opt}</span>
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
// Step 6 — Engagement & priorités
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
                    <span className="text-[15px] font-medium text-zinc-900">{opt}</span>
                  </Label>
                );
              })}
            </div>
          )}
        />
      </FieldShell>

      <FieldShell
        label="Classez vos priorités du plus important au moins important"
        hint="Glissez-déposez ou utilisez les flèches."
        required
        error={errors.priorities?.message}
      >
        <Controller
          control={control}
          name="priorities"
          render={({ field }) => (
            <PrioritiesSortable
              items={field.value}
              onChange={field.onChange}
            />
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
