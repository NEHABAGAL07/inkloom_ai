import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/services/theme-context";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('inkloom_theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = stored === 'dark' || (stored !== 'light' && prefersDark) ? 'dark' : 'light';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-workspace text-ink-primary min-h-screen font-sans antialiased selection:bg-teal selection:text-white transition-colors duration-150">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
