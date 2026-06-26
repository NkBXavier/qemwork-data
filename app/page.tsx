import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <section className="border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50">
          <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
            <div className="flex flex-col gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-wider text-primary sm:text-xs">
                Questionnaire technique
              </span>
              <h1 className="text-[2.25rem] font-bold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
                Projet Qemwork —
                <br className="hidden sm:block" />{" "}
                <span className="text-primary">qualification du besoin backend</span>
              </h1>
              <p className="max-w-2xl text-[17px] leading-relaxed text-zinc-800 sm:text-xl">
                Merci d&apos;avoir sollicité{" "}
                <strong className="font-bold text-zinc-950">Found ID</strong>.
                Avant de vous transmettre une proposition cadrée, nous avons
                besoin de mieux comprendre votre contexte technique et vos
                objectifs. Vos réponses nous servent à dimensionner la mission
                au plus juste — ni plus, ni moins.
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="h-12 px-6 text-base font-semibold"
                  nativeButton={false}
                  render={<Link href="/questionnaire" />}
                >
                  Commencer le questionnaire
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <span className="text-[14px] text-zinc-700 sm:text-sm">
                  Environ 8 à 10 minutes. Reprise possible à tout moment.
                </span>
              </div>
            </div>
          </div>
          <div className="brand-band h-1.5 w-full" aria-hidden />
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}

