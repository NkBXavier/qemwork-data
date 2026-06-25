import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Questionnaire technique – Projet Qemwork",
  description:
    "Questionnaire de qualification technique pour le projet Qemwork. Envoyé par Found ID.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-white">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
