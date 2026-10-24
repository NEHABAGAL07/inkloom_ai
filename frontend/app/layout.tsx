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
      <body className="bg-workspace text-ink-primary min-h-screen font-sans">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
