import { BrandBand, SiteFooter, SiteHeader } from "@/components/site-shell";
import QuestionnaireForm from "./questionnaire-form";

export const metadata = {
  title: "Questionnaire — Projet Qemwork | Found ID",
};

export default function QuestionnairePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <BrandBand />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
          <div className="mb-8 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Projet Qemwork
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Questionnaire technique
            </h1>
            <p className="text-base text-zinc-600 sm:text-lg">
              Six étapes courtes pour cadrer la mission backend. Vos réponses
              sont sauvegardées automatiquement dans votre navigateur.
            </p>
          </div>
          <QuestionnaireForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
