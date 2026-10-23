import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/services/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Inkloom AI — Enterprise Brand Governance Platform",
  description:
    "Automated brand guideline retrieval, tone analysis, claim verification, and human-in-the-loop review workflow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
