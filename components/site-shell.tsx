import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/horizontal-re.png"
            alt="Found ID"
            width={180}
            height={48}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </Link>
        <span className="hidden text-sm font-medium text-zinc-600 sm:inline">
          Pour <span className="text-zinc-900">Qemwork</span>
        </span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>
          © {new Date().getFullYear()} Found ID — Data et IA pour bâtir
          l&apos;Afrique de demain.
        </span>
        <span>Questionnaire confidentiel destiné à Qemwork.</span>
      </div>
    </footer>
  );
}

export function BrandBand({ className = "h-1.5" }: { className?: string }) {
  return <div className={`brand-band w-full ${className}`} aria-hidden />;
}
