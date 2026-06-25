import Link from "next/link";
import { ArrowRight, Clock, Lock, MessageSquare } from "lucide-react";
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
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Questionnaire technique
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
                Projet Qemwork —
                <br className="hidden sm:block" />{" "}
                <span className="text-primary">qualification du besoin backend</span>
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-zinc-700 sm:text-xl">
                Merci d&apos;avoir sollicité <strong>Found ID</strong>. Avant de
                vous transmettre une proposition cadrée, nous avons besoin de
                mieux comprendre votre contexte technique et vos objectifs. Vos
                réponses nous servent à dimensionner la mission au plus juste —
                ni plus, ni moins.
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="h-12 px-6 text-base"
                  nativeButton={false}
                  render={<Link href="/questionnaire" />}
                >
                  Commencer le questionnaire
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <span className="text-sm text-zinc-500">
                  Environ 8 à 10 minutes. Reprise possible à tout moment.
                </span>
              </div>
            </div>
          </div>
          <div className="brand-band h-1.5 w-full" aria-hidden />
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="8 à 10 minutes"
              body="Six étapes courtes. Vos réponses sont sauvegardées localement, vous pouvez reprendre plus tard."
            />
            <FeatureCard
              icon={<Lock className="h-6 w-6" />}
              title="Confidentialité"
              body="Vos réponses restent strictement internes à Found ID et ne sont jamais partagées avec des tiers."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Retour sous 48 h"
              body="Nous revenons vers vous avec une proposition adaptée à votre contexte et à vos priorités."
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-950">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-600">{body}</p>
    </div>
  );
}

