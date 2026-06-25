import { CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandBand, SiteFooter, SiteHeader } from "@/components/site-shell";
import { ClearLocalStorage } from "./clear-local-storage";

export const metadata = {
  title: "Merci ! — Projet Qemwork | Found ID",
};

export default function MerciPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <BrandBand />
      <main className="flex flex-1 flex-col items-center justify-center">
        <ClearLocalStorage />
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-5 py-16 text-center sm:px-8 sm:py-24">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Merci pour vos réponses
            </h1>
            <p className="text-lg leading-relaxed text-zinc-600 sm:text-xl">
              Vos réponses sont bien arrivées chez Found ID. Nous revenons vers
              vous sous <strong>48 h</strong> avec une proposition cadrée pour
              votre projet backend.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-2 h-11 px-5 text-base"
            nativeButton={false}
            render={
              <a
                href="https://www.found-id.com"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Découvrir Found ID
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
